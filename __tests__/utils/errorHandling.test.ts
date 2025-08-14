import {
  HistoryRewriterError,
  createErrorFromResponse,
  withErrorHandling,
  ErrorRecovery,
  getUserFriendlyMessage,
  isRecoverable
} from '@/utils/errorHandling';

describe('errorHandling utilities', () => {
  describe('HistoryRewriterError', () => {
    it('creates error with all properties', () => {
      const error = new HistoryRewriterError(
        'network',
        'Connection failed',
        true,
        'Timeout after 5000ms'
      );

      expect(error.type).toBe('network');
      expect(error.message).toBe('Connection failed');
      expect(error.recoverable).toBe(true);
      expect(error.details).toBe('Timeout after 5000ms');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('converts to AppError format', () => {
      const error = new HistoryRewriterError('api', 'Server error', false);
      const appError = error.toAppError();

      expect(appError.type).toBe('api');
      expect(appError.message).toBe('Server error');
      expect(appError.recoverable).toBe(false);
      expect(appError.timestamp).toBeInstanceOf(Date);
    });

    it('uses default values', () => {
      const error = new HistoryRewriterError('validation', 'Invalid input');

      expect(error.recoverable).toBe(true); // Default
      expect(error.details).toBeUndefined();
    });
  });

  describe('createErrorFromResponse', () => {
    it('creates error from 500 response', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({ message: 'Database connection failed' })
      } as any;

      const error = await createErrorFromResponse(mockResponse);

      expect(error.type).toBe('api');
      expect(error.message).toContain('Database connection failed');
      expect(error.recoverable).toBe(true);
    });

    it('creates error from 401 response', async () => {
      const mockResponse = {
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({ error: 'Invalid API key' })
      } as any;

      const error = await createErrorFromResponse(mockResponse);

      expect(error.type).toBe('network');
      expect(error.recoverable).toBe(false); // 401 is not recoverable
    });

    it('handles response without JSON', async () => {
      const mockResponse = {
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockRejectedValue(new Error('No JSON'))
      } as any;

      const error = await createErrorFromResponse(mockResponse);

      expect(error.message).toContain('HTTP 404: Not Found');
    });
  });

  describe('withErrorHandling', () => {
    it('returns result on success', async () => {
      const successfulApiCall = jest.fn().mockResolvedValue('success');

      const result = await withErrorHandling(successfulApiCall);

      expect(result).toBe('success');
      expect(successfulApiCall).toHaveBeenCalledTimes(1);
    });

    it('retries on recoverable error', async () => {
      const failingApiCall = jest.fn()
        .mockRejectedValueOnce(new HistoryRewriterError('network', 'Timeout', true))
        .mockRejectedValueOnce(new HistoryRewriterError('network', 'Timeout', true))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      const result = await withErrorHandling(failingApiCall, {
        maxRetries: 3,
        retryDelay: 10,
        onRetry
      });

      expect(result).toBe('success');
      expect(failingApiCall).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it('does not retry non-recoverable errors', async () => {
      const failingApiCall = jest.fn()
        .mockRejectedValue(new HistoryRewriterError('validation', 'Bad input', false));

      await expect(withErrorHandling(failingApiCall, { maxRetries: 3 }))
        .rejects.toThrow('Bad input');

      expect(failingApiCall).toHaveBeenCalledTimes(1);
    });

    it('throws after max retries', async () => {
      const failingApiCall = jest.fn()
        .mockRejectedValue(new HistoryRewriterError('network', 'Always fails', true));

      await expect(withErrorHandling(failingApiCall, { maxRetries: 2 }))
        .rejects.toThrow('Always fails');

      expect(failingApiCall).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('ErrorRecovery', () => {
    it('generates history fallback', () => {
      const fallback = ErrorRecovery.historyFallback('Test prompt');

      expect(fallback.summary).toContain('temporary issue');
      expect(fallback.timeline).toHaveLength(3);
      expect(fallback.timeline[0]).toHaveProperty('year');
      expect(fallback.timeline[0]).toHaveProperty('title');
      expect(fallback.timeline[0]).toHaveProperty('description');
      expect(fallback.timeline[0]).toHaveProperty('geoPoints');
      expect(fallback.geoChanges.type).toBe('FeatureCollection');
    });

    it('generates narration fallback', () => {
      const text = 'This is a test narration text';
      const fallback = ErrorRecovery.narrationFallback(text);

      expect(fallback.audioUrl).toBe('/audio/silence.mp3');
      expect(fallback.duration).toBeGreaterThan(0);
      expect(fallback.subtitles).toHaveLength(1);
      expect(fallback.subtitles[0].text).toContain('temporarily unavailable');
    });

    it('generates visual-only mode config', () => {
      const config = ErrorRecovery.visualOnlyMode();

      expect(config.message).toContain('visual-only mode');
      expect(config.features.audio).toBe(false);
      expect(config.features.timeline).toBe(true);
      expect(config.features.map).toBe(true);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('returns appropriate message for network errors', () => {
      const error = {
        type: 'network' as const,
        message: 'Fetch failed',
        recoverable: true,
        timestamp: new Date()
      };

      const message = getUserFriendlyMessage(error);
      expect(message).toContain('Connection issue');
    });

    it('returns appropriate message for API errors', () => {
      const error = {
        type: 'api' as const,
        message: 'Server error',
        recoverable: true,
        timestamp: new Date()
      };

      const message = getUserFriendlyMessage(error);
      expect(message).toContain('Service temporarily unavailable');
    });

    it('returns generic message for unknown errors', () => {
      const error = {
        type: 'unknown' as const,
        message: 'Something weird happened',
        recoverable: true,
        timestamp: new Date()
      };

      const message = getUserFriendlyMessage(error);
      expect(message).toContain('Something went wrong');
    });
  });

  describe('isRecoverable', () => {
    it('returns true for HistoryRewriterError with recoverable flag', () => {
      const error = new HistoryRewriterError('network', 'Timeout', true);
      expect(isRecoverable(error)).toBe(true);
    });

    it('returns false for HistoryRewriterError with non-recoverable flag', () => {
      const error = new HistoryRewriterError('validation', 'Bad input', false);
      expect(isRecoverable(error)).toBe(false);
    });

    it('returns true for network fetch errors', () => {
      const error = new TypeError('fetch failed');
      expect(isRecoverable(error)).toBe(true);
    });

    it('returns true for unknown errors by default', () => {
      const error = new Error('Unknown error');
      expect(isRecoverable(error)).toBe(true);
    });
  });
});
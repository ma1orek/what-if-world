/**
 * Error handling utilities for the History Rewriter Live application
 */

export interface AppError {
  type: 'network' | 'api' | 'audio' | 'rendering' | 'validation' | 'unknown';
  message: string;
  details?: string;
  recoverable: boolean;
  timestamp: Date;
}

export class HistoryRewriterError extends Error {
  public readonly type: AppError['type'];
  public readonly recoverable: boolean;
  public readonly details?: string;
  public readonly timestamp: Date;

  constructor(
    type: AppError['type'],
    message: string,
    recoverable: boolean = true,
    details?: string
  ) {
    super(message);
    this.name = 'HistoryRewriterError';
    this.type = type;
    this.recoverable = recoverable;
    this.details = details;
    this.timestamp = new Date();
  }

  toAppError(): AppError {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      recoverable: this.recoverable,
      timestamp: this.timestamp
    };
  }
}

/**
 * Create error from fetch response
 */
export async function createErrorFromResponse(response: Response): Promise<HistoryRewriterError> {
  let details: string;
  
  try {
    const errorData = await response.json();
    details = errorData.message || errorData.error || 'Unknown server error';
  } catch {
    details = `HTTP ${response.status}: ${response.statusText}`;
  }

  const type: AppError['type'] = response.status >= 500 ? 'api' : 'network';
  const recoverable = response.status !== 401 && response.status !== 403;

  return new HistoryRewriterError(
    type,
    `Request failed: ${details}`,
    recoverable,
    details
  );
}

/**
 * Handle API call with error recovery
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry non-recoverable errors
      if (error instanceof HistoryRewriterError && !error.recoverable) {
        break;
      }
      
      // Call retry callback
      if (onRetry) {
        onRetry(attempt + 1, error as Error);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError!;
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  /**
   * Fallback for history generation
   */
  historyFallback: (prompt: string) => ({
    summary: "Due to a temporary issue, we've generated a basic alternate history scenario. The full AI-powered experience will be restored shortly.",
    timeline: [
      {
        year: new Date().getFullYear() - 100,
        title: "The Divergence",
        description: "A pivotal moment that could have changed the course of history.",
        geoPoints: [[51.5074, -0.1278]] as [number, number][]
      },
      {
        year: new Date().getFullYear() - 50,
        title: "Ripple Effects",
        description: "The consequences of the change begin to manifest globally.",
        geoPoints: [[48.8566, 2.3522]] as [number, number][]
      },
      {
        year: new Date().getFullYear(),
        title: "Modern Impact",
        description: "How this alternate timeline affects our world today.",
        geoPoints: [[40.7128, -74.0060]] as [number, number][]
      }
    ],
    geoChanges: {
      type: "FeatureCollection" as const,
      features: []
    }
  }),

  /**
   * Fallback for narration
   */
  narrationFallback: (text: string) => ({
    audioUrl: '/audio/silence.mp3', // Would need a silent audio file
    duration: Math.max(30, text.length * 0.05), // Estimate based on text length
    subtitles: [
      {
        start: 0,
        end: Math.max(30, text.length * 0.05),
        text: "Audio narration is temporarily unavailable. Please read the timeline events to follow the story."
      }
    ]
  }),

  /**
   * Visual-only mode fallback
   */
  visualOnlyMode: () => ({
    message: "Running in visual-only mode. Audio features are disabled.",
    features: {
      audio: false,
      narration: false,
      subtitles: false,
      timeline: true,
      map: true
    }
  })
};

/**
 * Error logging utility
 */
export function logError(error: AppError | Error, context?: string): void {
  const errorData = {
    timestamp: new Date().toISOString(),
    context: context || 'Unknown',
    error: error instanceof HistoryRewriterError ? error.toAppError() : {
      type: 'unknown' as const,
      message: error.message,
      recoverable: true,
      timestamp: new Date()
    }
  };

  console.error('History Rewriter Error:', errorData);
  
  // In production, you might want to send this to an error tracking service
  // Example: sendToErrorTracking(errorData);
}

/**
 * User-friendly error messages
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case 'network':
      return 'Connection issue. Please check your internet and try again.';
    case 'api':
      return 'Service temporarily unavailable. Please try again in a moment.';
    case 'audio':
      return 'Audio playback issue. The visual experience will continue.';
    case 'rendering':
      return 'Display issue detected. Refreshing may help.';
    case 'validation':
      return 'Please check your input and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Check if error is recoverable
 */
export function isRecoverable(error: Error): boolean {
  if (error instanceof HistoryRewriterError) {
    return error.recoverable;
  }
  
  // Network errors are usually recoverable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // Default to recoverable
  return true;
}

/**
 * Create error boundary handler
 */
export function createErrorBoundaryHandler(
  onError: (error: AppError) => void,
  onRecover?: () => void
) {
  return {
    handleError: (error: Error, errorInfo?: any) => {
      const appError: AppError = error instanceof HistoryRewriterError 
        ? error.toAppError()
        : {
            type: 'unknown',
            message: error.message,
            details: errorInfo?.componentStack,
            recoverable: true,
            timestamp: new Date()
          };
      
      logError(appError, 'Error Boundary');
      onError(appError);
    },
    
    recover: () => {
      if (onRecover) {
        onRecover();
      }
    }
  };
}
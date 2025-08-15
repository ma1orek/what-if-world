/**
 * End-to-End User Flow Tests
 * 
 * These tests simulate complete user journeys through the application.
 * They test the integration between frontend and backend components.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Home from '@/pages/index';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  })
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock Three.js and WebGL
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Array(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => []),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  }))
});

// Mock GSAP
jest.mock('gsap', () => ({
  timeline: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    fromTo: jest.fn().mockReturnThis()
  })),
  set: jest.fn(),
  to: jest.fn(),
  fromTo: jest.fn(),
  killTweensOf: jest.fn()
}));

// Mock audio
Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentTime: 0,
    duration: 100,
    volume: 0.8
  }))
});

describe('End-to-End User Flow Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Complete History Rewriting Flow', () => {
    it('should complete full user journey from intro to presentation', async () => {
      // Mock successful API responses
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            summary: 'In this alternate timeline, Napoleon\'s victory at Waterloo reshapes European politics.',
            timeline: [
              {
                year: 1815,
                title: 'Victory at Waterloo',
                description: 'Napoleon defeats the Coalition forces decisively.',
                geoPoints: [[50.6794, 4.4125]]
              },
              {
                year: 1820,
                title: 'Continental Dominance',
                description: 'French influence spreads across Europe.',
                geoPoints: [[48.8566, 2.3522]]
              }
            ],
            geoChanges: {
              type: 'FeatureCollection',
              features: []
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            audioUrl: '/audio/test-narration.mp3',
            duration: 60,
            subtitles: [
              { start: 0, end: 30, text: 'In this alternate timeline...' },
              { start: 30, end: 60, text: 'Napoleon\'s victory changes everything.' }
            ]
          })
        });

      render(<Home />);

      // 1. Intro Phase - Wait for intro to complete
      expect(screen.getByText(/History is written by the victors/i)).toBeInTheDocument();
      
      // Simulate intro completion (normally triggered by GSAP)
      await waitFor(() => {
        const introElement = screen.queryByText(/History is written by the victors/i);
        if (introElement) {
          // Simulate clicking or waiting for intro to complete
          fireEvent.animationEnd(introElement);
        }
      }, { timeout: 5000 });

      // 2. Input Phase - Should show input prompt
      await waitFor(() => {
        expect(screen.getByText('Rewrite History')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('What if...')).toBeInTheDocument();
      expect(screen.getByText(/Napoleon wins at Waterloo/i)).toBeInTheDocument();

      // 3. User enters a prompt
      const textarea = screen.getByPlaceholderText('What if...');
      await user.type(textarea, 'What if Napoleon had won at Waterloo?');

      expect(textarea).toHaveValue('What if Napoleon had won at Waterloo?');

      // 4. User submits the prompt
      const submitButton = screen.getByText('Begin Rewrite');
      expect(submitButton).not.toBeDisabled();
      
      await user.click(submitButton);

      // 5. Loading state should appear
      await waitFor(() => {
        expect(screen.getByText('Rewriting History...')).toBeInTheDocument();
      });

      // 6. API calls should be made
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      // Verify history API call
      expect(fetch).toHaveBeenCalledWith('/api/rewrite-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'What if Napoleon had won at Waterloo?' })
      });

      // 7. Presentation phase should load
      await waitFor(() => {
        expect(screen.getByText('Timeline')).toBeInTheDocument();
        expect(screen.getByText('Alternate Timeline')).toBeInTheDocument();
      }, { timeout: 10000 });

      // 8. Timeline events should be displayed
      expect(screen.getByText('1815')).toBeInTheDocument();
      expect(screen.getByText('Victory at Waterloo')).toBeInTheDocument();
      expect(screen.getByText('1820')).toBeInTheDocument();
      expect(screen.getByText('Continental Dominance')).toBeInTheDocument();

      // 9. Summary should be displayed
      expect(screen.getByText(/Napoleon's victory at Waterloo/i)).toBeInTheDocument();

      // 10. New Scenario button should be available
      expect(screen.getByText('New Scenario')).toBeInTheDocument();
    });

    it('should handle example prompt selection', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          summary: 'Test response',
          timeline: [],
          geoChanges: { type: 'FeatureCollection', features: [] }
        })
      });

      render(<Home />);

      // Skip to input phase
      await waitFor(() => {
        expect(screen.getByText('Rewrite History')).toBeInTheDocument();
      });

      // Click on example prompt
      const exampleButton = screen.getByText(/Napoleon wins at Waterloo/i).closest('button');
      await user.click(exampleButton!);

      // Input should be filled
      const textarea = screen.getByPlaceholderText('What if...');
      expect(textarea).toHaveValue('Napoleon wins at Waterloo');

      // Submit button should be enabled
      const submitButton = screen.getByText('Begin Rewrite');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API failure
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<Home />);

      // Skip to input phase
      await waitFor(() => {
        expect(screen.getByText('Rewrite History')).toBeInTheDocument();
      });

      // Enter prompt and submit
      const textarea = screen.getByPlaceholderText('What if...');
      await user.type(textarea, 'What if the internet was never invented?');
      
      const submitButton = screen.getByText('Begin Rewrite');
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Connection issue/i)).toBeInTheDocument();
      });

      // Should return to input phase
      await waitFor(() => {
        expect(screen.getByText('Rewrite History')).toBeInTheDocument();
      });
    });

    it('should handle partial failures (history success, narration failure)', async () => {
      // Mock history success, narration failure
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            summary: 'Test alternate history',
            timeline: [
              { year: 2000, title: 'Test Event', description: 'Test', geoPoints: [[0, 0]] }
            ],
            geoChanges: { type: 'FeatureCollection', features: [] }
          })
        })
        .mockRejectedValueOnce(new Error('TTS service unavailable'));

      render(<Home />);

      // Skip to input and submit
      await waitFor(() => {
        expect(screen.getByText('Rewrite History')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('What if...');
      await user.type(textarea, 'Test prompt');
      
      const submitButton = screen.getByText('Begin Rewrite');
      await user.click(submitButton);

      // Should still show presentation (with fallback narration)
      await waitFor(() => {
        expect(screen.getByText('Timeline')).toBeInTheDocument();
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Features', () => {
    it('should handle timeline event clicks', async () => {
      // Mock successful responses
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            summary: 'Test',
            timeline: [
              { year: 1815, title: 'Event 1', description: 'First event', geoPoints: [[50, 4]] },
              { year: 1820, title: 'Event 2', description: 'Second event', geoPoints: [[48, 2]] }
            ],
            geoChanges: { type: 'FeatureCollection', features: [] }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            audioUrl: '/audio/test.mp3',
            duration: 60,
            subtitles: []
          })
        });

      render(<Home />);

      // Get to presentation phase
      await waitFor(() => {
        expect(screen.getByText('Rewrite History')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('What if...');
      await user.type(textarea, 'Test');
      await user.click(screen.getByText('Begin Rewrite'));

      await waitFor(() => {
        expect(screen.getByText('Timeline')).toBeInTheDocument();
      });

      // Click on timeline event
      const timelineEvent = screen.getByText('Event 1').closest('div');
      await user.click(timelineEvent!);

      // Should trigger map animation (tested through component behavior)
      // In a real E2E test, we'd verify camera movement or visual changes
    });

    it('should handle reset functionality', async () => {
      // Mock responses
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          summary: 'Test',
          timeline: [{ year: 2000, title: 'Test', description: 'Test', geoPoints: [[0, 0]] }],
          geoChanges: { type: 'FeatureCollection', features: [] }
        })
      });

      render(<Home />);

      // Get to presentation phase
      await waitFor(() => {
        expect(screen.getByText('Rewrite History')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('What if...');
      await user.type(textarea, 'Test prompt');
      await user.click(screen.getByText('Begin Rewrite'));

      await waitFor(() => {
        expect(screen.getByText('New Scenario')).toBeInTheDocument();
      });

      // Click reset button
      await user.click(screen.getByText('New Scenario'));

      // Should return to input phase
      await waitFor(() => {
        expect(screen.getByText('Rewrite History')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('What if...')).toHaveValue('');
      });
    });
  });

  describe('Accessibility and UX', () => {
    it('should be keyboard navigable', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Rewrite History')).toBeInTheDocument();
      });

      // Tab to textarea
      await user.tab();
      expect(screen.getByPlaceholderText('What if...')).toHaveFocus();

      // Type and use keyboard shortcut
      await user.type(screen.getByPlaceholderText('What if...'), 'Test prompt');
      await user.keyboard('{Control>}{Enter}{/Control}');

      // Should trigger submission
      expect(fetch).toHaveBeenCalled();
    });

    it('should show appropriate loading states', async () => {
      // Mock slow API response
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ summary: 'Test', timeline: [], geoChanges: { type: 'FeatureCollection', features: [] } })
        }), 1000))
      );

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Rewrite History')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('What if...');
      await user.type(textarea, 'Test prompt');
      await user.click(screen.getByText('Begin Rewrite'));

      // Should show loading immediately
      expect(screen.getByText('Rewriting History...')).toBeInTheDocument();
      expect(screen.getByText('This may take a moment')).toBeInTheDocument();
    });
  });
});
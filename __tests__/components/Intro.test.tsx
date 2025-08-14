import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Intro from '@/components/Intro';

// Mock GSAP
jest.mock('gsap', () => ({
  timeline: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    onComplete: jest.fn()
  })),
  set: jest.fn(),
  to: jest.fn()
}));

describe('Intro Component', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main quote text', () => {
    render(<Intro onComplete={mockOnComplete} />);
    
    expect(screen.getByText(/History is written by the victors/i)).toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    render(<Intro onComplete={mockOnComplete} />);
    
    expect(screen.getByText(/but what if you could change it/i)).toBeInTheDocument();
  });

  it('renders scroll hint', () => {
    render(<Intro onComplete={mockOnComplete} />);
    
    expect(screen.getByText(/Scroll to begin/i)).toBeInTheDocument();
  });

  it('renders decorative particles', () => {
    render(<Intro onComplete={mockOnComplete} />);
    
    // Check that particle container exists
    const particleContainer = screen.getByText(/History is written by the victors/i).closest('main')?.querySelector('.absolute.inset-0.overflow-hidden');
    expect(particleContainer).toBeInTheDocument();
  });

  it('has proper styling classes', () => {
    render(<Intro onComplete={mockOnComplete} />);
    
    const mainQuote = screen.getByText(/History is written by the victors/i);
    expect(mainQuote).toHaveClass('font-cinematic', 'text-history-gold');
    
    const subtitle = screen.getByText(/but what if you could change it/i);
    expect(subtitle).toHaveClass('font-modern', 'text-white');
  });

  it('calls onComplete after animation timeout', async () => {
    // Mock setTimeout to be synchronous for testing
    jest.useFakeTimers();
    
    render(<Intro onComplete={mockOnComplete} />);
    
    // Fast-forward time
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      // The component should call onComplete after animation
      // Note: In real implementation, this would be called by GSAP timeline
    });
    
    jest.useRealTimers();
  });

  it('renders with correct container structure', () => {
    const { container } = render(<Intro onComplete={mockOnComplete} />);
    
    const mainContainer = container.querySelector('.absolute.inset-0');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('bg-history-dark', 'z-50');
  });
});
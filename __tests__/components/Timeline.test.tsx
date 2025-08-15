import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Timeline from '@/components/Timeline';
import { TimelineEvent } from '@/types';

// Mock GSAP
jest.mock('gsap', () => ({
  timeline: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis()
  })),
  set: jest.fn(),
  to: jest.fn(),
  fromTo: jest.fn(),
  killTweensOf: jest.fn()
}));

// Mock animation utils
jest.mock('@/utils/animationUtils', () => ({
  fadeIn: jest.fn(),
  staggeredReveal: jest.fn()
}));

describe('Timeline Component', () => {
  const mockOnEventClick = jest.fn();
  const user = userEvent.setup();

  const mockEvents: TimelineEvent[] = [
    {
      year: 1815,
      title: 'Battle of Waterloo',
      description: 'Napoleon faces his final defeat',
      geoPoints: [[50.6794, 4.4125]]
    },
    {
      year: 1820,
      title: 'Continental System',
      description: 'Economic warfare continues',
      geoPoints: [[48.8566, 2.3522]]
    },
    {
      year: 1825,
      title: 'Industrial Revolution',
      description: 'Technology advances rapidly',
      geoPoints: [[51.5074, -0.1278]]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when no events', () => {
    render(<Timeline events={[]} activeIndex={-1} onEventClick={mockOnEventClick} />);
    
    expect(screen.getByText('Loading timeline...')).toBeInTheDocument();
  });

  it('renders timeline header', () => {
    render(<Timeline events={mockEvents} activeIndex={0} onEventClick={mockOnEventClick} />);
    
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Follow the events as they unfold')).toBeInTheDocument();
  });

  it('renders all events', () => {
    render(<Timeline events={mockEvents} activeIndex={0} onEventClick={mockOnEventClick} />);
    
    expect(screen.getByText('1815')).toBeInTheDocument();
    expect(screen.getByText('Battle of Waterloo')).toBeInTheDocument();
    expect(screen.getByText('Napoleon faces his final defeat')).toBeInTheDocument();
    
    expect(screen.getByText('1820')).toBeInTheDocument();
    expect(screen.getByText('Continental System')).toBeInTheDocument();
    
    expect(screen.getByText('1825')).toBeInTheDocument();
    expect(screen.getByText('Industrial Revolution')).toBeInTheDocument();
  });

  it('shows event numbers', () => {
    render(<Timeline events={mockEvents} activeIndex={0} onEventClick={mockOnEventClick} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows geographic points indicator', () => {
    render(<Timeline events={mockEvents} activeIndex={0} onEventClick={mockOnEventClick} />);
    
    // Each event has 1 location
    const locationIndicators = screen.getAllByText('1 location');
    expect(locationIndicators).toHaveLength(3);
  });

  it('handles event clicks', async () => {
    render(<Timeline events={mockEvents} activeIndex={0} onEventClick={mockOnEventClick} />);
    
    const firstEvent = screen.getByText('Battle of Waterloo').closest('div');
    await user.click(firstEvent!);
    
    expect(mockOnEventClick).toHaveBeenCalledWith(0);
  });

  it('handles multiple event clicks', async () => {
    render(<Timeline events={mockEvents} activeIndex={0} onEventClick={mockOnEventClick} />);
    
    const secondEvent = screen.getByText('Continental System').closest('div');
    await user.click(secondEvent!);
    
    expect(mockOnEventClick).toHaveBeenCalledWith(1);
    
    const thirdEvent = screen.getByText('Industrial Revolution').closest('div');
    await user.click(thirdEvent!);
    
    expect(mockOnEventClick).toHaveBeenCalledWith(2);
  });

  it('shows footer instructions', () => {
    render(<Timeline events={mockEvents} activeIndex={0} onEventClick={mockOnEventClick} />);
    
    expect(screen.getByText('Click any event to focus on its location')).toBeInTheDocument();
  });

  it('handles events with multiple locations', () => {
    const eventsWithMultipleLocations: TimelineEvent[] = [
      {
        year: 1815,
        title: 'Global Event',
        description: 'An event spanning multiple locations',
        geoPoints: [[50.6794, 4.4125], [48.8566, 2.3522], [51.5074, -0.1278]]
      }
    ];

    render(<Timeline events={eventsWithMultipleLocations} activeIndex={0} onEventClick={mockOnEventClick} />);
    
    expect(screen.getByText('3 locations')).toBeInTheDocument();
  });

  it('handles events with no locations', () => {
    const eventsWithNoLocations: TimelineEvent[] = [
      {
        year: 1815,
        title: 'Abstract Event',
        description: 'An event with no specific location',
        geoPoints: []
      }
    ];

    render(<Timeline events={eventsWithNoLocations} activeIndex={0} onEventClick={mockOnEventClick} />);
    
    expect(screen.getByText('0 locations')).toBeInTheDocument();
  });

  it('has proper scrollable container', () => {
    render(<Timeline events={mockEvents} activeIndex={0} onEventClick={mockOnEventClick} />);
    
    const container = screen.getByText('Timeline').closest('.overflow-y-auto');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('scrollbar-thin', 'scrollbar-thumb-history-gold');
  });

  it('applies hover effects', async () => {
    render(<Timeline events={mockEvents} activeIndex={0} onEventClick={mockOnEventClick} />);
    
    const firstEvent = screen.getByText('Battle of Waterloo').closest('div');
    expect(firstEvent).toHaveClass('hover:bg-white', 'hover:bg-opacity-5');
  });

  it('shows timeline dots', () => {
    render(<Timeline events={mockEvents} activeIndex={0} onEventClick={mockOnEventClick} />);
    
    const timelineDots = screen.getByText('Timeline').closest('div')?.querySelectorAll('.timeline-dot');
    expect(timelineDots).toHaveLength(3);
  });
});
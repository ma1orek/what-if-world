import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import InputPrompt from '@/components/InputPrompt';

// Mock GSAP
jest.mock('gsap', () => ({
  timeline: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis()
  })),
  set: jest.fn(),
  to: jest.fn(),
  fromTo: jest.fn()
}));

describe('InputPrompt Component', () => {
  const mockOnSubmit = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible', () => {
    render(<InputPrompt onSubmit={mockOnSubmit} isVisible={true} />);
    
    expect(screen.getByText('Rewrite History')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What if...')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<InputPrompt onSubmit={mockOnSubmit} isVisible={false} />);
    
    expect(screen.queryByText('Rewrite History')).not.toBeInTheDocument();
  });

  it('renders example prompts', () => {
    render(<InputPrompt onSubmit={mockOnSubmit} isVisible={true} />);
    
    expect(screen.getByText(/Napoleon wins at Waterloo/i)).toBeInTheDocument();
    expect(screen.getByText(/Roman Empire never falls/i)).toBeInTheDocument();
    expect(screen.getByText(/Cold War turns hot in 1962/i)).toBeInTheDocument();
  });

  it('allows text input', async () => {
    render(<InputPrompt onSubmit={mockOnSubmit} isVisible={true} />);
    
    const textarea = screen.getByPlaceholderText('What if...');
    await user.type(textarea, 'What if dinosaurs never went extinct?');
    
    expect(textarea).toHaveValue('What if dinosaurs never went extinct?');
  });

  it('shows character counter', async () => {
    render(<InputPrompt onSubmit={mockOnSubmit} isVisible={true} />);
    
    const textarea = screen.getByPlaceholderText('What if...');
    await user.type(textarea, 'Test input');
    
    expect(screen.getByText('10/500')).toBeInTheDocument();
  });

  it('fills input when example is clicked', async () => {
    render(<InputPrompt onSubmit={mockOnSubmit} isVisible={true} />);
    
    const exampleButton = screen.getByText(/Napoleon wins at Waterloo/i).closest('button');
    await user.click(exampleButton!);
    
    const textarea = screen.getByPlaceholderText('What if...');
    expect(textarea).toHaveValue('Napoleon wins at Waterloo');
  });

  it('submits form with valid input', async () => {
    render(<InputPrompt onSubmit={mockOnSubmit} isVisible={true} />);
    
    const textarea = screen.getByPlaceholderText('What if...');
    const submitButton = screen.getByText('Begin Rewrite');
    
    await user.type(textarea, 'What if the Library of Alexandria never burned?');
    await user.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('What if the Library of Alexandria never burned?');
  });

  it('does not submit with empty input', async () => {
    render(<InputPrompt onSubmit={mockOnSubmit} isVisible={true} />);
    
    const submitButton = screen.getByText('Begin Rewrite');
    expect(submitButton).toBeDisabled();
    
    await user.click(submitButton);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('does not submit with only whitespace', async () => {
    render(<InputPrompt onSubmit={mockOnSubmit} isVisible={true} />);
    
    const textarea = screen.getByPlaceholderText('What if...');
    const submitButton = screen.getByText('Begin Rewrite');
    
    await user.type(textarea, '   ');
    expect(submitButton).toBeDisabled();
  });

  it('handles keyboard shortcut (Ctrl+Enter)', async () => {
    render(<InputPrompt onSubmit={mockOnSubmit} isVisible={true} />);
    
    const textarea = screen.getByPlaceholderText('What if...');
    await user.type(textarea, 'Test prompt');
    
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Test prompt');
  });

  it('respects character limit', async () => {
    render(<InputPrompt onSubmit={mockOnSubmit} isVisible={true} />);
    
    const textarea = screen.getByPlaceholderText('What if...') as HTMLTextAreaElement;
    const longText = 'a'.repeat(600); // Exceeds 500 char limit
    
    await user.type(textarea, longText);
    
    // Should be truncated to 500 characters
    expect(textarea.value.length).toBeLessThanOrEqual(500);
  });

  it('shows loading state when submitting', async () => {
    const slowOnSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    render(<InputPrompt onSubmit={slowOnSubmit} isVisible={true} />);
    
    const textarea = screen.getByPlaceholderText('What if...');
    const submitButton = screen.getByText('Begin Rewrite');
    
    await user.type(textarea, 'Test prompt');
    await user.click(submitButton);
    
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(<InputPrompt onSubmit={mockOnSubmit} isVisible={true} />);
    
    const textarea = screen.getByPlaceholderText('What if...');
    expect(textarea).toHaveAttribute('maxLength', '500');
    
    const submitButton = screen.getByText('Begin Rewrite');
    expect(submitButton).toHaveAttribute('type', 'submit');
  });
});
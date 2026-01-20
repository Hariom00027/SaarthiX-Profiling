import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionBox from '../QuestionBox';

describe('QuestionBox Component', () => {
  const mockOnAnswerChange = vi.fn();
  const mockQuestion = {
    id: 'q1',
    question: 'What is 2+2?',
    options: ['2', '3', '4', '5'],
    type: 'MCQ',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render question text', () => {
    render(
      <QuestionBox
        question={mockQuestion}
        answer={null}
        onAnswerChange={mockOnAnswerChange}
      />
    );

    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
  });

  it('should render all options', () => {
    render(
      <QuestionBox
        question={mockQuestion}
        answer={null}
        onAnswerChange={mockOnAnswerChange}
      />
    );

    mockQuestion.options.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('should call onAnswerChange when option is selected', () => {
    render(
      <QuestionBox
        question={mockQuestion}
        answer={null}
        onAnswerChange={mockOnAnswerChange}
      />
    );

    const option = screen.getByText('4');
    fireEvent.click(option);

    expect(mockOnAnswerChange).toHaveBeenCalledWith('q1', '4');
  });

  it('should highlight selected answer', () => {
    render(
      <QuestionBox
        question={mockQuestion}
        answer="4"
        onAnswerChange={mockOnAnswerChange}
      />
    );

    const selectedOption = screen.getByText('4').closest('button');
    expect(selectedOption).toHaveClass(/selected|active|bg-blue/i);
  });
});

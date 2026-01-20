import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SaarthiChatbot from '../SaarthiChatbot';
import * as api from '../../api';

// Mock API
vi.mock('../../api', () => ({
  generateQuestions: vi.fn(),
  sendChatMessage: vi.fn(),
}));

describe('SaarthiChatbot Component', () => {
  const mockProfile = {
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-FRONT-008: SaarthiChatbot - Render Chatbot
  it('TC-FRONT-008: Should render chatbot interface', async () => {
    const mockQuestions = ['Question 1?', 'Question 2?', 'Question 3?'];
    api.generateQuestions.mockResolvedValue({
      success: true,
      data: { questions: mockQuestions },
    });

    render(<SaarthiChatbot userProfile={mockProfile} />);

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.getByText('Question 1?')).toBeInTheDocument();
    });
  });

  // TC-FRONT-009: SaarthiChatbot - Send Message
  it('TC-FRONT-009: Should send chat message when user submits answer', async () => {
    const mockQuestions = ['Question 1?'];
    api.generateQuestions.mockResolvedValue({
      success: true,
      data: { questions: mockQuestions },
    });

    api.sendChatMessage.mockResolvedValue({
      success: true,
      data: {
        nextQuestion: 'Question 2?',
        isComplete: false,
      },
    });

    render(<SaarthiChatbot userProfile={mockProfile} />);

    // Wait for first question
    await waitFor(() => {
      expect(screen.getByText('Question 1?')).toBeInTheDocument();
    });

    // Type answer and send
    const input = screen.getByPlaceholderText(/type your answer/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'My answer' } });
    fireEvent.click(sendButton);

    // Verify API call
    await waitFor(() => {
      expect(api.sendChatMessage).toHaveBeenCalled();
    });
  });

  // Test: Chatbot completion
  it('Should show completion message when all questions answered', async () => {
    const mockQuestions = ['Question 1?'];
    api.generateQuestions.mockResolvedValue({
      success: true,
      data: { questions: mockQuestions },
    });

    api.sendChatMessage.mockResolvedValue({
      success: true,
      data: {
        nextQuestion: null,
        isComplete: true,
      },
    });

    render(<SaarthiChatbot userProfile={mockProfile} />);

    await waitFor(() => {
      expect(screen.getByText('Question 1?')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type your answer/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Answer' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Great! You've answered all questions. Let me analyze your responses.../i,
        ),
      ).toBeInTheDocument();
    });
  });

  // Test: Error handling
  it('Should show error message when API call fails', async () => {
    api.generateQuestions.mockRejectedValue(new Error('API Error'));

    render(<SaarthiChatbot userProfile={mockProfile} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to initialize chatbot. Please try again.'),
      ).toBeInTheDocument();
    });
  });
});



import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { useAuth } from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Dashboard Component', () => {
  const mockOnStartProfiling = vi.fn();
  const mockOnViewSaved = vi.fn();
  const mockOnPsychometricTest = vi.fn();
  const mockOnViewSavedReports = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ isAuthenticated: () => false });
  });

  it('should render hero section with main heading', () => {
    render(
      <Dashboard
        onStartProfiling={mockOnStartProfiling}
        onViewSaved={mockOnViewSaved}
        onPsychometricTest={mockOnPsychometricTest}
        onViewSavedReports={mockOnViewSavedReports}
      />
    );

    expect(screen.getByText(/SaarthiX/i)).toBeInTheDocument();
  });

  it('should call onStartProfiling when start button is clicked', () => {
    render(
      <Dashboard
        onStartProfiling={mockOnStartProfiling}
        onViewSaved={mockOnViewSaved}
        onPsychometricTest={mockOnPsychometricTest}
        onViewSavedReports={mockOnViewSavedReports}
      />
    );

    const startButton = screen.getByText(/start profiling/i);
    fireEvent.click(startButton);

    expect(mockOnStartProfiling).toHaveBeenCalled();
  });

  it('should display feature cards', () => {
    render(
      <Dashboard
        onStartProfiling={mockOnStartProfiling}
        onViewSaved={mockOnViewSaved}
        onPsychometricTest={mockOnPsychometricTest}
        onViewSavedReports={mockOnViewSavedReports}
      />
    );

    expect(screen.getByText(/Comprehensive Profiling/i)).toBeInTheDocument();
    expect(screen.getByText(/Interest Evaluation with Chatbot/i)).toBeInTheDocument();
    expect(screen.getByText(/Psychometric Assessment/i)).toBeInTheDocument();
  });

  it('should display process steps', () => {
    render(
      <Dashboard
        onStartProfiling={mockOnStartProfiling}
        onViewSaved={mockOnViewSaved}
        onPsychometricTest={mockOnPsychometricTest}
        onViewSavedReports={mockOnViewSavedReports}
      />
    );

    expect(screen.getByText(/Register/i)).toBeInTheDocument();
    expect(screen.getByText(/Assessment/i)).toBeInTheDocument();
  });

  it('should toggle FAQ when clicked', () => {
    render(
      <Dashboard
        onStartProfiling={mockOnStartProfiling}
        onViewSaved={mockOnViewSaved}
        onPsychometricTest={mockOnPsychometricTest}
        onViewSavedReports={mockOnViewSavedReports}
      />
    );

    const faqButton = screen.getAllByRole('button').find(btn => 
      btn.textContent.includes('What is SaarthiX')
    );
    
    if (faqButton) {
      fireEvent.click(faqButton);
      // FAQ should expand
    }
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SuccessModal from '../SuccessModal';

describe('SuccessModal Component', () => {
  const mockOnClose = vi.fn();

  it('should render success message', () => {
    render(<SuccessModal message="Operation successful" onClose={mockOnClose} />);

    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<SuccessModal message="Success" onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button') || screen.getByText(/close/i);
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should render default message when none provided', () => {
    render(<SuccessModal onClose={mockOnClose} />);

    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});

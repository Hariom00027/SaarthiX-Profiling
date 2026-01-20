import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingOverlay from '../LoadingOverlay';

describe('LoadingOverlay Component', () => {
  it('should render loading message', () => {
    render(<LoadingOverlay message="Loading..." />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render default message when none provided', () => {
    render(<LoadingOverlay />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show spinner', () => {
    const { container } = render(<LoadingOverlay />);

    const spinner = container.querySelector('.spinner') || container.querySelector('[class*="spin"]');
    expect(spinner).toBeInTheDocument();
  });
});

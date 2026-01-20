import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimerDisplay from '../TimerDisplay';

describe('TimerDisplay Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display formatted time', () => {
    render(<TimerDisplay timeRemaining={3600000} />); // 1 hour

    expect(screen.getByText(/60:00/i)).toBeInTheDocument();
  });

  it('should display warning when time is low', () => {
    render(<TimerDisplay timeRemaining={300000} />); // 5 minutes

    expect(screen.getByText(/05:00/i)).toBeInTheDocument();
  });

  it('should display zero when expired', () => {
    render(<TimerDisplay timeRemaining={0} />);

    expect(screen.getByText(/00:00/i)).toBeInTheDocument();
  });
});

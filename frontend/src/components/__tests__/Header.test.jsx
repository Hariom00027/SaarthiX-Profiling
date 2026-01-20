import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { useAuth } from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock window.location
delete window.location;
window.location = { href: '' };

describe('Header Component', () => {
  const mockOnNavigateToStart = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
  });

  it('should render brand name', () => {
    useAuth.mockReturnValue({
      isAuthenticated: () => false,
      logout: mockLogout,
    });

    render(<Header onNavigateToStart={mockOnNavigateToStart} />);

    expect(screen.getByText(/Saarthi/i)).toBeInTheDocument();
  });

  it('should show logout button when authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: () => true,
      logout: mockLogout,
    });

    render(<Header onNavigateToStart={mockOnNavigateToStart} />);

    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  it('should not show logout button when not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: () => false,
      logout: mockLogout,
    });

    render(<Header onNavigateToStart={mockOnNavigateToStart} />);

    expect(screen.queryByText(/Logout/i)).not.toBeInTheDocument();
  });

  it('should call logout and redirect on logout click', () => {
    useAuth.mockReturnValue({
      isAuthenticated: () => true,
      logout: mockLogout,
    });

    render(<Header onNavigateToStart={mockOnNavigateToStart} />);

    const logoutButton = screen.getByText(/Logout/i);
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(window.location.href).toBe('/');
  });

  it('should call onNavigateToStart when brand is clicked', () => {
    useAuth.mockReturnValue({
      isAuthenticated: () => false,
      logout: mockLogout,
    });

    render(<Header onNavigateToStart={mockOnNavigateToStart} />);

    const brandButton = screen.getByText(/Saarthi/i).closest('button');
    fireEvent.click(brandButton);

    expect(mockOnNavigateToStart).toHaveBeenCalled();
  });
});

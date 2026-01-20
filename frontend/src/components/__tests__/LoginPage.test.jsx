import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../LoginPage';
import * as api from '../../api';

// Mock API
vi.mock('../../api', () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-FRONT-012: LoginPage - Valid Login
  it('TC-FRONT-012: Should login with valid credentials', async () => {
    api.login.mockResolvedValue({
      success: true,
      data: {
        token: 'jwt-token',
        userId: 'user123',
        email: 'test@example.com',
      },
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  // TC-FRONT-013: LoginPage - Invalid Login
  it('TC-FRONT-013: Should show error for invalid credentials', async () => {
    api.login.mockResolvedValue({
      success: false,
      error: 'Invalid email or password',
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  // Test: Form validation
  it('Should validate email format', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  // Test: Registration flow
  it('Should switch to registration form', () => {
    render(<LoginPage />);

    const registerLink = screen.getByText(/register/i);
    fireEvent.click(registerLink);

    expect(screen.getByText(/create account/i)).toBeInTheDocument();
  });
});



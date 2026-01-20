import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext.jsx';

// Mock api module used inside AuthContext
vi.mock('../api', () => {
  return {
    default: {
      defaults: {
        headers: {
          common: {},
        },
      },
      get: vi.fn(),
    },
  };
});

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('useAuth should throw when used outside provider', () => {
    const TestComponent = () => {
      useAuth();
      return null;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useAuth must be used within an AuthProvider',
    );
  });

  it('login should set token and user, and persist token', async () => {
    const TestComponent = () => {
      const { login, user, token } = useAuth();
      React.useEffect(() => {
        login('test-token', { id: 'user-1', email: 'test@example.com' });
      }, [login]);
      return (
        <div>
          <span data-testid="token">{token}</span>
          <span data-testid="user-email">{user?.email || ''}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await act(async () => {});

    expect(localStorage.getItem('token')).toBe('test-token');
    expect(screen.getByTestId('token').textContent).toBe('test-token');
    expect(screen.getByTestId('user-email').textContent).toBe('test@example.com');
  });

  it('logout should clear token and user state', async () => {
    const TestComponent = () => {
      const { login, logout, user, token } = useAuth();
      React.useEffect(() => {
        login('test-token', { id: 'user-1', email: 'test@example.com' }).then(() => {
          logout();
        });
      }, [login, logout]);
      return (
        <div>
          <span data-testid="token">{token || ''}</span>
          <span data-testid="user-email">{user?.email || ''}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await act(async () => {});

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('token').textContent).toBe('');
    expect(screen.getByTestId('user-email').textContent).toBe('');
  });
});



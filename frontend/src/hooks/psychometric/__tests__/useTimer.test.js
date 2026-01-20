import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts countdown and updates remaining time', () => {
    const { result } = renderHook(() => useTimer('session-1'));

    act(() => {
      result.current.start();
    });

    const initialRemaining = result.current.timeRemaining;

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.timeRemaining).toBeLessThan(initialRemaining);
    expect(result.current.formattedTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it('invokes onExpire and clears storage when timer elapses', () => {
    const onExpire = vi.fn();
    const oneHourMs = 60 * 60 * 1000;

    const { result } = renderHook(() => useTimer('session-2', onExpire));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(oneHourMs + 1000);
    });

    expect(onExpire).toHaveBeenCalled();
    expect(result.current.isExpired).toBe(true);
    expect(localStorage.getItem('test_timer_session-2')).toBeFalsy();
  });
});


import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProctoring } from '../useProctoring';

// Mock face-api.js to avoid loading heavy models in tests
vi.mock('face-api.js', () => {
  return {
    nets: {
      tinyFaceDetector: { loadFromUri: vi.fn().mockResolvedValue() },
      faceLandmark68Net: { loadFromUri: vi.fn().mockResolvedValue() },
      faceRecognitionNet: { loadFromUri: vi.fn().mockResolvedValue() },
    },
    TinyFaceDetectorOptions: vi.fn(),
    detectAllFaces: vi.fn().mockResolvedValue([]),
  };
});

describe('useProctoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it('addWarning should increment warnings and persist violations', async () => {
    const { result } = renderHook(() => useProctoring('session-1'));

    act(() => {
      result.current.addWarning('Test violation');
    });

    expect(result.current.warnings).toBe(1);
    expect(result.current.violations.length).toBe(1);
    expect(result.current.violations[0].reason).toBe('Test violation');
  });
});


import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as psychometricApi from '../psychometric';

// Mock fetch globally
global.fetch = vi.fn();
global.URL.createObjectURL = vi.fn(() => 'blob:url');
global.URL.revokeObjectURL = vi.fn();
window.URL = global.URL;

describe('Psychometric API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  describe('createPsychometricSession', () => {
    it('should create session successfully', async () => {
      const mockResponse = { id: 'session-123' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await psychometricApi.createPsychometricSession({ name: 'Test' });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/psychometric/sessions'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle network error', async () => {
      global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(
        psychometricApi.createPsychometricSession({ name: 'Test' })
      ).rejects.toThrow(/Failed to connect to backend/);
    });

    it('should handle server error response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      await expect(
        psychometricApi.createPsychometricSession({ name: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('getPsychometricSession', () => {
    it('should fetch session successfully', async () => {
      const mockResponse = { id: 'session-123', status: 'CREATED' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await psychometricApi.getPsychometricSession('session-123');

      expect(result).toEqual(mockResponse);
    });

    it('should handle 404 error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Session not found' }),
      });

      await expect(
        psychometricApi.getPsychometricSession('invalid-id')
      ).rejects.toThrow();
    });
  });

  describe('submitTest', () => {
    it('should submit test successfully', async () => {
      const mockResponse = { sessionId: 'session-123', submitted: true };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const submissionData = {
        userId: 'user-123',
        answers: { q1: 'answer1' },
        results: { totalQuestions: 120 },
      };

      const result = await psychometricApi.submitTest('session-123', submissionData);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test/submit'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('session-123'),
        })
      );
    });

    it('should handle submission error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid submission' }),
      });

      await expect(
        psychometricApi.submitTest('session-123', {})
      ).rejects.toThrow();
    });
  });

  describe('saveReport', () => {
    it('should save report successfully', async () => {
      localStorage.setItem('token', 'test-token');
      const mockResponse = { id: 'saved-123' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await psychometricApi.saveReport('session-123', 'My Report');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/psychometric/saved-reports'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should throw error when not authenticated', async () => {
      localStorage.removeItem('token');

      await expect(
        psychometricApi.saveReport('session-123')
      ).rejects.toThrow('Authentication required');
    });

    it('should handle 401 unauthorized', async () => {
      localStorage.setItem('token', 'invalid-token');
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(
        psychometricApi.saveReport('session-123')
      ).rejects.toThrow('Please log in');
    });

    it('should handle 409 conflict (already saved)', async () => {
      localStorage.setItem('token', 'test-token');
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
      });

      await expect(
        psychometricApi.saveReport('session-123')
      ).rejects.toThrow('Report already saved');
    });
  });

  describe('getSavedReports', () => {
    it('should fetch saved reports successfully', async () => {
      localStorage.setItem('token', 'test-token');
      const mockResponse = [{ id: 'report-1' }, { id: 'report-2' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await psychometricApi.getSavedReports();

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when not authenticated', async () => {
      localStorage.removeItem('token');

      await expect(
        psychometricApi.getSavedReports()
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('deleteSavedReport', () => {
    it('should delete report successfully', async () => {
      localStorage.setItem('token', 'test-token');
      global.fetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await psychometricApi.deleteSavedReport('session-123');

      expect(result).toBe(true);
    });

    it('should throw error when not authenticated', async () => {
      localStorage.removeItem('token');

      await expect(
        psychometricApi.deleteSavedReport('session-123')
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('checkReportSaved', () => {
    it('should return true if report is saved', async () => {
      localStorage.setItem('token', 'test-token');
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ saved: true }),
      });

      const result = await psychometricApi.checkReportSaved('session-123');

      expect(result).toEqual({ saved: true });
    });

    it('should return false if not authenticated', async () => {
      localStorage.removeItem('token');

      const result = await psychometricApi.checkReportSaved('session-123');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      localStorage.setItem('token', 'test-token');
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      const result = await psychometricApi.checkReportSaved('session-123');

      expect(result).toBe(false);
    });
  });

  describe('downloadReportPdf', () => {
    it('should download PDF successfully', async () => {
      const mockReportData = { userInfo: { name: 'Test' }, scores: {} };
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });

      // Mock getReport
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockReportData,
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => mockBlob,
        });

      const createElementSpy = vi.spyOn(document, 'createElement');
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      createElementSpy.mockReturnValue(mockAnchor);

      await psychometricApi.downloadReportPdf('session-123');

      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.download).toContain('psychometric-report');
    });

    it('should use provided reportData without fetching', async () => {
      const mockReportData = { userInfo: { name: 'Test' }, scores: {} };
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const createElementSpy = vi.spyOn(document, 'createElement');
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      createElementSpy.mockReturnValue(mockAnchor);

      await psychometricApi.downloadReportPdf('session-123', mockReportData);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should handle PDF download error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(
        psychometricApi.downloadReportPdf('session-123', {})
      ).rejects.toThrow();
    });
  });
});

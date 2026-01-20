import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import * as api from '../api';
import { notifyError, notifySuccess } from '../../utils/notifications';

// Mock axios
vi.mock('axios');
const mockedAxios = axios;

// Mock notifications
vi.mock('../../utils/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

describe('API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Existing tests
  it('Should submit profile successfully', async () => {
    const mockProfileData = { name: 'Test User', email: 'test@example.com' };
    const mockResponse = {
      data: {
        message: 'Success',
        data: { profile: { id: 'profile123' }, templateText: 'Template' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.submitProfile(mockProfileData, 'professional');

    expect(result.success).toBe(true);
  });

  it('Should fetch templates successfully', async () => {
    const mockTemplates = [
      { id: 'professional', name: 'Professional' },
      { id: 'bio', name: 'Bio' },
    ];
    const mockResponse = {
      data: {
        message: 'Success',
        data: mockTemplates,
      },
    };

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.fetchTemplates();

    expect(result).toEqual(mockTemplates);
  });

  it('Should login successfully and store token', async () => {
    const mockResponse = {
      data: {
        message: 'Success',
        data: {
          token: 'jwt-token',
          userId: 'user123',
        },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.login('test@example.com', 'password123');

    expect(result.success).toBe(true);
    expect(result.data.token).toBe('jwt-token');
  });

  it('Should handle API errors gracefully', async () => {
    const mockError = {
      response: {
        status: 400,
        data: {
          message: 'Bad Request',
        },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(mockError),
    });

    const result = await api.submitProfile({}, 'professional');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Bad Request');
    expect(notifyError).toHaveBeenCalledWith('Bad Request');
  });

  it('Should handle 401 errors and clear token on getCurrentUser', async () => {
    const mockError = {
      response: {
        status: 401,
      },
    };

    localStorage.setItem('token', 'old-token');

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockRejectedValue(mockError),
      interceptors: {
        response: {
          use: vi.fn(),
        },
      },
    });

    const result = await api.getCurrentUser();

    expect(result.success).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  // New failure-focused tests

  it('uploadTemplatePreview should fail when templateId or file is missing', async () => {
    const resultNoId = await api.uploadTemplatePreview(null, new File(['x'], 'x.png'));
    const resultNoFile = await api.uploadTemplatePreview('template-1', null);

    expect(resultNoId.success).toBe(false);
    expect(resultNoId.error).toBe('Template ID and file are required');
    expect(resultNoFile.success).toBe(false);
    expect(resultNoFile.error).toBe('Template ID and file are required');
  });

  it('uploadTemplatePreview should report success and notify on happy path', async () => {
    const mockResponse = {
      data: {
        message: 'Uploaded',
        data: { url: 'https://example.com/preview.png' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const file = new File(['x'], 'x.png', { type: 'image/png' });
    const result = await api.uploadTemplatePreview('template-1', file);

    expect(result.success).toBe(true);
    expect(result.data.url).toBe('https://example.com/preview.png');
    expect(notifySuccess).toHaveBeenCalled();
  });

  it('enhanceProfileWithAI should fail fast when profile text is empty', async () => {
    const resultEmpty = await api.enhanceProfileWithAI('');
    const resultWhitespace = await api.enhanceProfileWithAI('   ');

    expect(resultEmpty.success).toBe(false);
    expect(resultEmpty.error).toBe('Profile text is required');
    expect(resultWhitespace.success).toBe(false);
    expect(resultWhitespace.error).toBe('Profile text is required');
  });

  it('enhanceProfileWithAI should handle missing enhancedProfile in response', async () => {
    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
    });

    const result = await api.enhanceProfileWithAI('Some profile text');

    expect(result.success).toBe(false);
    expect(result.error).toBe('No enhanced profile returned from server');
    expect(notifyError).toHaveBeenCalledWith('No enhanced profile returned from server');
  });

  it('getMyProfile should handle 404 with a friendly message', async () => {
    const error = {
      response: {
        status: 404,
      },
    };

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockRejectedValue(error),
    });

    const result = await api.getMyProfile();

    expect(result.success).toBe(false);
    expect(result.error).toBe('No saved profile found');
    expect(notifyError).toHaveBeenCalledWith('No saved profile found');
  });

  it('getAllMyProfiles should return empty list on 404', async () => {
    const error = {
      response: {
        status: 404,
      },
    };

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockRejectedValue(error),
    });

    const result = await api.getAllMyProfiles();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('getProfileById should fail when profileId is missing', async () => {
    const result = await api.getProfileById('');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Profile ID is required');
    expect(notifyError).toHaveBeenCalledWith('Profile ID is required');
  });

  it('getProfileById should handle 404 gracefully', async () => {
    const error = {
      response: {
        status: 404,
      },
    };

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockRejectedValue(error),
    });

    const result = await api.getProfileById('missing-id');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Profile not found');
  });

  it('saveProfileAsJson should fail when profileId is missing', async () => {
    const result = await api.saveProfileAsJson('');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Profile ID is required');
    expect(notifyError).toHaveBeenCalledWith('Profile ID is required');
  });

  it('parseResume should fail when file is missing', async () => {
    const result = await api.parseResume(null);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Resume file is required');
  });

  it('parseProfilePdf should fail when file is missing', async () => {
    const result = await api.parseProfilePdf(null);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Profile PDF file is required');
  });

  it('enhanceProfileWithReport should surface backend error message', async () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'Server failure' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(error),
    });

    const result = await api.enhanceProfileWithReport({ profileId: 'p1' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Server failure');
    expect(notifyError).toHaveBeenCalledWith('Server failure');
  });

  it('enhanceUploadedParagraphWithReport should surface backend error message', async () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'Paragraph enhance failed' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(error),
    });

    const result = await api.enhanceUploadedParagraphWithReport({ text: 'x' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Paragraph enhance failed');
    expect(notifyError).toHaveBeenCalledWith('Paragraph enhance failed');
  });

  // ==================== ADDITIONAL PROFILE API TESTS (30+ tests) ====================

  it('submitProfile should include templateType in request', async () => {
    const mockProfileData = { name: 'Test User', email: 'test@example.com' };
    const mockResponse = {
      data: {
        message: 'Success',
        data: { profile: { id: 'profile123' }, templateText: 'Template' },
      },
    };

    const mockPost = vi.fn().mockResolvedValue(mockResponse);
    mockedAxios.create.mockReturnValue({
      post: mockPost,
    });

    await api.submitProfile(mockProfileData, 'bio');

    expect(mockPost).toHaveBeenCalledWith(
      '/api/profiles',
      expect.objectContaining({ templateType: 'bio' })
    );
  });

  it('submitProfile should handle network errors', async () => {
    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(new Error('Network Error')),
    });

    const result = await api.submitProfile({ name: 'Test' }, 'professional');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network Error');
  });

  it('submitProfile should handle 500 server errors', async () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(error),
    });

    const result = await api.submitProfile({ name: 'Test' }, 'professional');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal Server Error');
  });

  it('submitProfile should handle 403 forbidden errors', async () => {
    const error = {
      response: {
        status: 403,
        data: { message: 'Forbidden' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(error),
    });

    const result = await api.submitProfile({ name: 'Test' }, 'professional');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Forbidden');
  });

  it('submitProfile should handle missing response data', async () => {
    const mockResponse = {
      data: {
        message: 'Success',
        // Missing data field
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.submitProfile({ name: 'Test' }, 'professional');

    expect(result.success).toBe(true);
  });

  it('getAllMyProfiles should return profiles array on success', async () => {
    const mockProfiles = [
      { profile: { id: 'p1', name: 'Profile 1' } },
      { profile: { id: 'p2', name: 'Profile 2' } },
    ];

    const mockResponse = {
      data: {
        message: 'Success',
        data: mockProfiles,
      },
    };

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.getAllMyProfiles();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockProfiles);
  });

  it('getAllMyProfiles should handle empty array response', async () => {
    const mockResponse = {
      data: {
        message: 'Success',
        data: [],
      },
    };

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.getAllMyProfiles();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('getAllMyProfiles should handle network timeout', async () => {
    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockRejectedValue(new Error('timeout')),
    });

    const result = await api.getAllMyProfiles();

    expect(result.success).toBe(false);
    expect(result.error).toBe('timeout');
  });

  it('getProfileById should return profile on success', async () => {
    const mockProfile = {
      id: 'profile-1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    const mockResponse = {
      data: {
        message: 'Success',
        data: mockProfile,
      },
    };

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.getProfileById('profile-1');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockProfile);
  });

  it('getProfileById should handle 500 server errors', async () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'Server Error' },
      },
    };

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockRejectedValue(error),
    });

    const result = await api.getProfileById('profile-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Server Error');
  });

  it('saveProfileAsJson should return file path on success', async () => {
    const mockResponse = {
      data: {
        message: 'Success',
        data: { path: '/saved/profile.json' },
      },
    };

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.saveProfileAsJson('profile-1');

    expect(result.success).toBe(true);
    expect(result.data.path).toBe('/saved/profile.json');
  });

  it('saveProfileAsJson should handle 500 errors', async () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'Save failed' },
      },
    };

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockRejectedValue(error),
    });

    const result = await api.saveProfileAsJson('profile-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Save failed');
  });

  it('regenerateProfile should return updated profile', async () => {
    const mockPayload = {
      templateType: 'bio',
      profileId: 'profile-1',
    };

    const mockResponse = {
      data: {
        message: 'Success',
        data: {
          profile: { id: 'profile-1', name: 'John Doe' },
          templateText: 'New template',
        },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.regenerateProfile(mockPayload);

    expect(result.success).toBe(true);
    expect(result.data.templateText).toBe('New template');
  });

  it('regenerateProfile should handle missing payload', async () => {
    const mockResponse = {
      data: {
        message: 'Success',
        data: { profile: {}, templateText: '' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.regenerateProfile({});

    expect(result.success).toBe(true);
  });

  it('regenerateProfile should handle network errors', async () => {
    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(new Error('Network Error')),
    });

    const result = await api.regenerateProfile({ templateType: 'bio' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network Error');
  });

  it('parseResume should return parsed data on success', async () => {
    const mockFile = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const mockParsedData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
    };

    const mockResponse = {
      data: {
        message: 'Success',
        data: mockParsedData,
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.parseResume(mockFile);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockParsedData);
  });

  it('parseResume should handle invalid file format', async () => {
    const mockFile = new File(['content'], 'resume.txt', { type: 'text/plain' });
    const error = {
      response: {
        status: 400,
        data: { message: 'Invalid file format' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(error),
    });

    const result = await api.parseResume(mockFile);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid file format');
  });

  it('parseResume should handle file size errors', async () => {
    const mockFile = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const error = {
      response: {
        status: 413,
        data: { message: 'File too large' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(error),
    });

    const result = await api.parseResume(mockFile);

    expect(result.success).toBe(false);
    expect(result.error).toBe('File too large');
  });

  it('parseProfilePdf should return parsed profile data', async () => {
    const mockFile = new File(['content'], 'profile.pdf', { type: 'application/pdf' });
    const mockParsedData = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    const mockResponse = {
      data: {
        message: 'Success',
        data: mockParsedData,
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.parseProfilePdf(mockFile);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockParsedData);
  });

  it('parseProfilePdf should handle parsing errors', async () => {
    const mockFile = new File(['content'], 'profile.pdf', { type: 'application/pdf' });
    const error = {
      response: {
        status: 400,
        data: { message: 'Failed to parse PDF' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(error),
    });

    const result = await api.parseProfilePdf(mockFile);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to parse PDF');
  });

  it('enhanceProfileWithAI should return enhanced profile', async () => {
    const mockResponse = {
      data: {
        message: 'Success',
        data: {
          enhancedProfile: 'Enhanced profile text',
        },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.enhanceProfileWithAI('Original profile text');

    expect(result.success).toBe(true);
    expect(result.data.enhancedProfile).toBe('Enhanced profile text');
  });

  it('enhanceProfileWithAI should handle network errors', async () => {
    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(new Error('Network Error')),
    });

    const result = await api.enhanceProfileWithAI('Profile text');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network Error');
  });

  it('enhanceProfileWithAI should handle 429 rate limit errors', async () => {
    const error = {
      response: {
        status: 429,
        data: { message: 'Rate limit exceeded' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(error),
    });

    const result = await api.enhanceProfileWithAI('Profile text');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Rate limit exceeded');
  });

  it('enhanceProfileWithReport should return enhanced profile', async () => {
    const mockPayload = {
      profileId: 'profile-1',
      reportData: { insights: ['insight1', 'insight2'] },
    };

    const mockResponse = {
      data: {
        message: 'Success',
        data: {
          profile: { id: 'profile-1' },
          templateText: 'Enhanced template',
        },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.enhanceProfileWithReport(mockPayload);

    expect(result.success).toBe(true);
    expect(result.data.templateText).toBe('Enhanced template');
  });

  it('enhanceProfileWithReport should handle missing reportData', async () => {
    const mockPayload = {
      profileId: 'profile-1',
      // Missing reportData
    };

    const mockResponse = {
      data: {
        message: 'Success',
        data: { profile: {}, templateText: '' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.enhanceProfileWithReport(mockPayload);

    expect(result.success).toBe(true);
  });

  it('enhanceProfileWithReport should handle 400 validation errors', async () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Invalid profile data' },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(error),
    });

    const result = await api.enhanceProfileWithReport({ profileId: 'p1' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid profile data');
  });

  it('enhanceUploadedParagraphWithReport should return enhanced text', async () => {
    const mockPayload = {
      text: 'Original paragraph',
      reportData: { insights: ['insight1'] },
    };

    const mockResponse = {
      data: {
        message: 'Success',
        data: {
          enhancedText: 'Enhanced paragraph',
        },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.enhanceUploadedParagraphWithReport(mockPayload);

    expect(result.success).toBe(true);
    expect(result.data.enhancedText).toBe('Enhanced paragraph');
  });

  it('enhanceUploadedParagraphWithReport should handle empty text', async () => {
    const result = await api.enhanceUploadedParagraphWithReport({ text: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Text is required');
  });

  it('enhanceUploadedParagraphWithReport should handle network timeout', async () => {
    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(new Error('timeout')),
    });

    const result = await api.enhanceUploadedParagraphWithReport({ text: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('timeout');
  });

  it('getMyProfile should return profile on success', async () => {
    const mockProfile = {
      id: 'profile-1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    const mockResponse = {
      data: {
        message: 'Success',
        data: mockProfile,
      },
    };

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await api.getMyProfile();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockProfile);
  });

  it('getMyProfile should handle 401 unauthorized', async () => {
    const error = {
      response: {
        status: 401,
      },
    };

    localStorage.setItem('token', 'token');

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockRejectedValue(error),
      interceptors: {
        response: {
          use: vi.fn(),
        },
      },
    });

    const result = await api.getMyProfile();

    expect(result.success).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('getMyProfile should handle 500 server errors', async () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'Server Error' },
      },
    };

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockRejectedValue(error),
    });

    const result = await api.getMyProfile();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Server Error');
  });

  it('fetchTemplates should handle direct array response', async () => {
    const mockTemplates = [
      { id: 'professional', name: 'Professional' },
      { id: 'bio', name: 'Bio' },
    ];

    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: mockTemplates }),
    });

    const result = await api.fetchTemplates();

    expect(result).toEqual(mockTemplates);
  });

  it('fetchTemplates should handle network errors with retry', async () => {
    let callCount = 0;
    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network Error'));
        }
        return Promise.resolve({
          data: { data: [{ id: 'professional', name: 'Professional' }] },
        });
      }),
    });

    const result = await api.fetchTemplates();

    expect(result).toEqual([{ id: 'professional', name: 'Professional' }]);
  });

  it('fetchTemplates should return empty array on final failure', async () => {
    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockRejectedValue(new Error('Network Error')),
    });

    const result = await api.fetchTemplates();

    expect(result).toEqual([]);
  });

  // Total: 50+ test cases for API functions
});


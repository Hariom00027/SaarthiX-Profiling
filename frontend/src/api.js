import axios from 'axios';
import { notifyError, notifySuccess } from './utils/notifications';

// Get API URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/profiling-api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token from localStorage if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const withRetry = async (fn, retries = 0) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    return withRetry(fn, retries - 1);
  }
};

const handleApiError = (error, defaultMessage) => {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    defaultMessage;

  notifyError(message);
  return {
    success: false,
    error: message,
  };
};

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      notifyError('Session expired. Please log in again.');
      // Only redirect if not already on login page and not during initial load
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && !currentPath.includes('login')) {
        window.location.reload(); // Reload to trigger App.jsx authentication check
      }
    }
    return Promise.reject(error);
  }
);

// API function to submit profile with template type
export const submitProfile = async (profileData, templateType = 'professional') => {
  try {
    const dataWithTemplate = {
      ...profileData,
      templateType: templateType
    };

    const response = await api.post('/api/profiles', dataWithTemplate);
    console.log('API response:', response);
    console.log('API response data:', response.data);

    // Backend returns: { message: "...", data: { profile: {...}, templateText: "..." } }
    // Extract the actual profile data from the nested structure
    const actualData = response.data.data || response.data;

    return { success: true, data: actualData };
  } catch (error) {
    console.error('API error:', error);
    return handleApiError(error, 'Failed to submit profile');
  }
};

export const fetchTemplates = async () => {
  try {
    const response = await withRetry(() => api.get('/api/templates/all'), 1);
    console.log('Templates API response:', response.data);
    // API returns { message: "...", data: [...] }
    // Handle both ApiResponse format and direct array
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    console.error('Error details:', error.response?.data);
    handleApiError(error, 'Failed to fetch templates');
    throw error;
  }
};

/**
 * Upload preview image for a template
 * @param {string} templateId - The template ID
 * @param {File} file - The image file to upload
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const uploadTemplatePreview = async (templateId, file) => {
  try {
    if (!templateId || !file) {
      return {
        success: false,
        error: 'Template ID and file are required'
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/api/templates/uploadPreview/${templateId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    notifySuccess('Preview image uploaded successfully');
    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('API error:', error);
    return handleApiError(error, 'Failed to upload preview image');
  }
};

/**
 * API function to enhance profile using AI
 * @param {string} profileText - The profile text to enhance
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export const enhanceProfileWithAI = async (profileText) => {
  try {
    if (!profileText || profileText.trim().length === 0) {
      return {
        success: false,
        error: 'Profile text is required'
      };
    }

    const response = await api.post('/api/ai-enhance', {
      profile: profileText
    });

    // Backend returns: { message: "...", data: { enhancedProfile: "..." } }
    const enhancedProfile = response.data?.data?.enhancedProfile || response.data?.enhancedProfile;

    if (!enhancedProfile) {
      return {
        success: false,
        error: 'No enhanced profile returned from server'
      };
    }

    return {
      success: true,
      data: enhancedProfile
    };
  } catch (error) {
    console.error('API error:', error);
    return handleApiError(error, 'Failed to enhance profile with AI');
  }
};

/**
 * Chatbot API functions
 */

// Generate personalized questions based on user profile
export const generateQuestions = async (userProfile) => {
  try {
    const response = await api.post('/api/generate-questions', {
      userProfile
    });
    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('Error generating questions:', error);
    return handleApiError(error, 'Failed to generate questions');
  }
};

// Send chat message and get next question
export const sendChatMessage = async (userMessage, conversationState) => {
  try {
    const response = await api.post('/api/chat', {
      userMessage,
      conversationState
    });
    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('Error sending chat message:', error);
    return handleApiError(error, 'Failed to send message');
  }
};

// Evaluate user interests
export const evaluateInterests = async (userProfile, answers) => {
  try {
    const response = await api.post('/api/evaluate', {
      userProfile,
      answers
    });
    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('Error evaluating interests:', error);
    return handleApiError(error, 'Failed to evaluate interests');
  }
};

// Authentication API functions
export const register = async (email, password, name) => {
  try {
    const response = await api.post('/api/auth/register', { email, password, name });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    return handleApiError(error, 'Registration failed');
  }
};

export const login = async (email, password) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    return handleApiError(error, 'Login failed');
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/me');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    return handleApiError(error, 'Failed to get user');
  }
};

/**
 * Exchange SomethingX token for Profiling token
 * @param {string} token - SomethingX token (optional, for future validation)
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} userType - User type (e.g., "STUDENT")
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const exchangeSomethingXToken = async (token, email, name, userType) => {
  try {
    console.log('Calling exchange endpoint with:', { token: token ? 'present' : 'missing', email, name, userType });

    // Use form data for POST request
    const formData = new URLSearchParams();
    if (token) formData.append('token', token);
    formData.append('email', email);
    if (name) formData.append('name', name);
    if (userType) formData.append('userType', userType);

    const response = await api.post('/api/auth/somethingx/exchange', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('Exchange response:', response.data);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Exchange error details:', error.response?.data || error.message);
    return handleApiError(error, 'Failed to exchange SomethingX token');
  }
};

/**
 * Save profile as JSON file
 * @param {string} profileId - The profile ID to save
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const saveProfileAsJson = async (profileId) => {
  try {
    if (!profileId) {
      return handleApiError(new Error('Profile ID is required'), 'Profile ID is required');
    }

    const response = await api.post(`/api/profiles/${profileId}/save-json`);
    notifySuccess('Profile saved successfully.');
    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('API error:', error);
    return handleApiError(error, 'Failed to save profile as JSON');
  }
};

export const regenerateProfile = async (payload = {}) => {
  try {
    const response = await api.post('/api/profile/regenerate', payload);
    const actualData = response.data?.data || response.data;
    return { success: true, data: actualData };
  } catch (error) {
    console.error('API error:', error);
    return handleApiError(error, 'Failed to regenerate profile');
  }
};

/**
 * Get the current user's saved profile
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getMyProfile = async () => {
  try {
    const response = await api.get('/api/profiles/my-profile');

    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('API error:', error);
    if (error.response?.status === 404) {
      notifyError('No saved profile found');
      return {
        success: false,
        error: 'No saved profile found'
      };
    }
    return handleApiError(error, 'Failed to retrieve saved profile');
  }
};

export const getAllMyProfiles = async () => {
  try {
    const response = await api.get('/api/profiles/my-profiles');
    return {
      success: true,
      data: response.data?.data || response.data || []
    };
  } catch (error) {
    console.error('API error:', error);
    if (error.response?.status === 404) {
      return {
        success: true,
        data: []
      };
    }
    return handleApiError(error, 'Failed to retrieve saved profiles');
  }
};

/**
 * Get a specific profile by ID
 * @param {string} profileId - The profile ID to fetch
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getProfileById = async (profileId) => {
  try {
    if (!profileId) {
      return handleApiError(new Error('Profile ID is required'), 'Profile ID is required');
    }

    const response = await api.get(`/api/profiles/${profileId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('API error:', error);
    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'Profile not found'
      };
    }
    return handleApiError(error, 'Failed to retrieve profile');
  }
};

/**
 * Enhance profile with psychometric report data
 * @param {object} payload - Contains profileId, profileData, reportData, sessionId
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const enhanceProfileWithReport = async (payload) => {
  try {
    const response = await api.post('/api/profiles/enhance-with-report', payload);
    notifySuccess('Profile enhanced successfully with report insights');
    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('Enhance profile error:', error);
    return handleApiError(error, 'Failed to enhance profile with report data');
  }
};

/**
 * Enhance a single uploaded profile paragraph using psychometric report data.
 * Keeps word count from increasing (server enforced).
 * @param {object} payload - { text, reportData, sessionId }
 */
export const enhanceUploadedParagraphWithReport = async (payload) => {
  try {
    const response = await api.post('/api/profiles/enhance-paragraph-with-report', payload);
    notifySuccess('Paragraph enhanced successfully with report insights');
    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('Enhance paragraph error:', error);
    return handleApiError(error, 'Failed to enhance paragraph with report data');
  }
};

/**
 * Parse resume file and extract data
 * @param {File} file - The resume file (PDF or DOCX)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const parseResume = async (file) => {
  try {
    if (!file) {
      return {
        success: false,
        error: 'Resume file is required'
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/profiles/parse-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    notifySuccess('Resume parsed successfully');
    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('API error:', error);
    return handleApiError(error, 'Failed to parse resume');
  }
};

/**
 * Parse profile PDF file and extract data
 * @param {File} file - The profile PDF file
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const parseProfilePdf = async (file) => {
  try {
    if (!file) {
      return {
        success: false,
        error: 'Profile PDF file is required'
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/profiles/parse-profile-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    notifySuccess('Profile PDF parsed successfully');
    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('API error:', error);
    return handleApiError(error, 'Failed to parse profile PDF');
  }
};

export default api;


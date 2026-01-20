import axios from 'axios';
import { notifyError, notifySuccess } from '../utils/notifications';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090';
const ADMIN_TOKEN_KEY = 'adminToken';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getStoredAdminToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

const persistAdminToken = (token) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    adminApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    delete adminApi.defaults.headers.common['Authorization'];
  }
};

const handleApiError = (error, defaultMessage) => {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    defaultMessage;

  notifyError(message);
  const err = new Error(message);
  err.response = error?.response;
  throw err;
};

persistAdminToken(getStoredAdminToken());

export const loginAdmin = async (email, password) => {
  try {
    const response = await adminApi.post('/api/admin/login', {
      email,
      password,
    });
    const payload = response.data?.data;
    if (!payload) {
      throw new Error('Invalid admin login response');
    }
    if (payload.token) {
      persistAdminToken(payload.token);
    }
    return payload;
  } catch (error) {
    return handleApiError(error, 'Admin login failed');
  }
};

export const logoutAdmin = () => {
  persistAdminToken(null);
};

export const listAdminTemplates = async () => {
  try {
    const response = await adminApi.get('/api/admin/templates');
    const data = response.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return handleApiError(error, 'Failed to fetch templates');
  }
};

export const createAdminTemplate = async (template) => {
  try {
    const response = await adminApi.post('/api/admin/templates', template);
    notifySuccess('Template created');
    return response.data?.data;
  } catch (error) {
    return handleApiError(error, 'Failed to create template');
  }
};

export const updateAdminTemplate = async (type, template) => {
  try {
    const response = await adminApi.put(`/api/admin/templates/${type}`, template);
    notifySuccess('Template updated');
    return response.data?.data;
  } catch (error) {
    return handleApiError(error, 'Failed to update template');
  }
};

export const deleteAdminTemplate = async (type) => {
  try {
    const response = await adminApi.delete(`/api/admin/templates/${type}`);
    notifySuccess('Template deleted');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to delete template');
  }
};

export const toggleAdminTemplateEnabled = async (type, enabled) => {
  try {
    const response = await adminApi.put(`/api/admin/templates/${type}`, { enabled });
    notifySuccess(`Template ${enabled ? 'enabled' : 'disabled'}`);
    return response.data?.data;
  } catch (error) {
    return handleApiError(error, `Failed to ${enabled ? 'enable' : 'disable'} template`);
  }
};

export const uploadAdminTemplatePreview = async (templateId, file) => {
  try {
    if (!templateId || !file) {
      throw new Error('Template ID and file are required');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await adminApi.post(`/api/admin/templates/uploadPreview/${templateId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    notifySuccess('Preview image uploaded successfully');
    return response.data?.data;
  } catch (error) {
    return handleApiError(error, 'Failed to upload preview image');
  }
};

export { getStoredAdminToken, persistAdminToken };


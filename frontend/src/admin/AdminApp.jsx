import React, { useCallback, useEffect, useState } from 'react';
import {
  loginAdmin,
  logoutAdmin,
  listAdminTemplates,
  createAdminTemplate,
  updateAdminTemplate,
  deleteAdminTemplate,
  toggleAdminTemplateEnabled,
  uploadAdminTemplatePreview,
  getStoredAdminToken,
  persistAdminToken,
} from './adminApi';

const initialFormState = {
  id: '',
  name: '',
  description: '',
  icon: '',
  content: '',
  css: '',
};

const AdminApp = () => {
  const [adminToken, setAdminToken] = useState(() => getStoredAdminToken());
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [dashboardError, setDashboardError] = useState('');
  const [formError, setFormError] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [processingForm, setProcessingForm] = useState(false);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [uploadingPreview, setUploadingPreview] = useState({});
  const [viewingPreview, setViewingPreview] = useState(null);

  const fetchTemplates = useCallback(async () => {
    setDashboardError('');
    setLoadingTemplates(true);
    try {
      const data = await listAdminTemplates();
      setTemplates(data);
    } catch (error) {
      setDashboardError(error?.message || 'Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    if (adminToken) {
      persistAdminToken(adminToken);
      fetchTemplates();
    } else {
      persistAdminToken(null);
      setTemplates([]);
    }
  }, [adminToken, fetchTemplates]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError('');
    setProcessingForm(true);
    try {
      const payload = await loginAdmin(credentials.email.trim(), credentials.password);
      if (payload?.token) {
        setAdminToken(payload.token);
      }
    } catch (error) {
      setAuthError(error?.message || 'Admin login failed');
    } finally {
      setProcessingForm(false);
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    logoutAdmin();
    setSelectedTemplate(null);
    setFormState(initialFormState);
    setCredentials({ email: '', password: '' });
    setAuthError('');
    setDashboardError('');
  };

  const handleFormChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const trimmedId = formState.id.trim();
    if (!trimmedId) {
      setFormError('Template ID is required.');
      return;
    }

    setProcessingForm(true);
    try {
      if (selectedTemplate) {
        const updated = await updateAdminTemplate(selectedTemplate.id, {
          ...formState,
          id: trimmedId,
        });
        setTemplates((prev) =>
          prev.map((template) => (template.id === updated.id ? updated : template)),
        );
        setSelectedTemplate(updated);
        setFormState((prev) => ({ ...prev, id: updated.id }));
      } else {
        const created = await createAdminTemplate({ ...formState, id: trimmedId });
        setTemplates((prev) => [...prev.filter((template) => template.id !== created.id), created]);
        setFormState(initialFormState);
        setShowFormPanel(false);
      }
      setFormError('');
    } catch (error) {
      setFormError(error?.message || 'Failed to save template.');
    } finally {
      setProcessingForm(false);
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormState({
      id: template.id || '',
      name: template.name || '',
      description: template.description || '',
      icon: template.icon || '',
      content: template.content || '',
      css: template.css || '',
    });
    setFormError('');
    setShowFormPanel(true);
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Delete template "${template.name}" permanently?`)) {
      return;
    }
    setProcessingForm(true);
    try {
      await deleteAdminTemplate(template.id);
      setTemplates((prev) => prev.filter((item) => item.id !== template.id));
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
        setFormState(initialFormState);
      }
      setDashboardError('');
    } catch (error) {
      setDashboardError(error?.message || 'Failed to delete template.');
    } finally {
      setProcessingForm(false);
    }
  };

  const handleToggleTemplateStatus = async (template, enable) => {
    setDashboardError('');
    setProcessingForm(true);
    try {
      const updated = await toggleAdminTemplateEnabled(template.id, enable);
      if (updated) {
        setTemplates((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        if (selectedTemplate?.id === updated.id) {
          setSelectedTemplate(updated);
        }
      }
    } catch (error) {
      setDashboardError(error?.message || 'Failed to update template status.');
    } finally {
      setProcessingForm(false);
    }
  };

  const handleUploadPreview = async (template, event) => {
    event.stopPropagation();
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDashboardError('Please select an image file');
      return;
    }

    setUploadingPreview((prev) => ({ ...prev, [template.id]: true }));
    setDashboardError('');

    try {
      const updated = await uploadAdminTemplatePreview(template.id, file);
      if (updated) {
        setTemplates((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        if (selectedTemplate?.id === updated.id) {
          setSelectedTemplate(updated);
        }
      }
    } catch (error) {
      setDashboardError(error?.message || 'Failed to upload preview image.');
    } finally {
      setUploadingPreview((prev) => ({ ...prev, [template.id]: false }));
      // Reset file input
      event.target.value = '';
    }
  };

  const isEditing = Boolean(selectedTemplate);
  const submitLabel = isEditing ? 'Save template' : 'Create template';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-indigo-200/50 backdrop-blur-sm bg-white/30 rounded-2xl p-6 shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-indigo-600 font-bold mb-1">Admin Dashboard</p>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Template Management</h1>
              </div>
            </div>
            <p className="text-gray-600 ml-16">Manage all global templates centrally</p>
          </div>
          {adminToken && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          )}
        </header>

        {!adminToken && (
          <div className="max-w-md mx-auto animate-fade-in">
            <form
              onSubmit={handleLogin}
              className="bg-white/80 backdrop-blur-md border border-indigo-200/50 rounded-2xl p-8 space-y-6 shadow-2xl hover:shadow-3xl transition-all duration-300"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h2>
                <p className="text-sm text-gray-600">
                  Use the credentials configured via environment variables
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={credentials.email}
                    onChange={(event) => setCredentials((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-xl bg-white border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-200 hover:border-indigo-300"
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={credentials.password}
                    onChange={(event) =>
                      setCredentials((prev) => ({ ...prev, password: event.target.value }))
                    }
                    className="w-full rounded-xl bg-white border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-200 hover:border-indigo-300"
                    placeholder="Enter your password"
                  />
                </div>
                {authError && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-shake">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">{authError}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={processingForm}
                  className="w-full inline-flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all duration-200 disabled:opacity-60 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                >
                  {processingForm ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign in as admin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {adminToken && (
          <>
            <section className="bg-white/80 backdrop-blur-md border border-indigo-200/50 rounded-2xl p-6 space-y-5 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {isEditing ? '✏️ Edit template' : '✨ Create new template'}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Give the template a unique lower-case type id and fill out the details.
                  </p>
                </div>
                {(!showFormPanel && !isEditing) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setFormState(initialFormState);
                      setFormError('');
                      setShowFormPanel(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create template
                  </button>
                ) : isEditing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setFormState(initialFormState);
                      setFormError('');
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 hover:border-indigo-400 text-gray-700 hover:text-indigo-600 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-indigo-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Start new template
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowFormPanel(false);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Hide form
                  </button>
                )}
              </div>
              {(showFormPanel || isEditing) && (
                <form onSubmit={handleFormSubmit} className={`grid gap-5 md:grid-cols-2 pt-6 border-t border-indigo-100 animate-slide-down`}>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-indigo-600">🔑</span>
                      Template ID
                    </label>
                    <input
                      type="text"
                      value={formState.id}
                      onChange={(event) => handleFormChange('id', event.target.value)}
                      disabled={isEditing}
                      required
                      placeholder="professional (lowercase, no spaces)"
                      className="w-full rounded-xl bg-white border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-200 hover:border-indigo-300 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-indigo-600">📝</span>
                      Name
                    </label>
                    <input
                      type="text"
                      value={formState.name}
                      onChange={(event) => handleFormChange('name', event.target.value)}
                      required
                      placeholder="Template name"
                      className="w-full rounded-xl bg-white border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-200 hover:border-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-indigo-600">🎨</span>
                      Icon
                    </label>
                    <input
                      type="text"
                      value={formState.icon}
                      onChange={(event) => handleFormChange('icon', event.target.value)}
                      placeholder="Emoji or text"
                      className="w-full rounded-xl bg-white border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-200 hover:border-indigo-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-indigo-600">📄</span>
                      Description
                    </label>
                    <input
                      type="text"
                      value={formState.description}
                      onChange={(event) => handleFormChange('description', event.target.value)}
                      placeholder="Brief description of the template"
                      className="w-full rounded-xl bg-white border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-200 hover:border-indigo-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-indigo-600">📋</span>
                      Content
                    </label>
                    <textarea
                      value={formState.content}
                      onChange={(event) => handleFormChange('content', event.target.value)}
                      rows={6}
                      required
                      placeholder="Template content..."
                      className="w-full rounded-xl bg-white border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-200 hover:border-indigo-300 resize-y"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-indigo-600">💅</span>
                      CSS (optional)
                    </label>
                    <textarea
                      value={formState.css}
                      onChange={(event) => handleFormChange('css', event.target.value)}
                      rows={4}
                      placeholder="Custom CSS styles..."
                      className="w-full rounded-xl bg-gray-900 text-green-400 border-2 border-gray-700 px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-200 font-mono text-sm"
                    />
                  </div>
                  {isEditing && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-indigo-600">🖼️</span>
                        Preview Image
                      </label>
                      <div className="space-y-3">
                        {selectedTemplate?.previewImageUrl && (
                          <div className="relative">
                            <img 
                              src={selectedTemplate.previewImageUrl} 
                              alt="Preview" 
                              className="w-full max-w-md h-48 object-cover rounded-xl border-2 border-gray-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex gap-3 items-center flex-wrap">
                          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {uploadingPreview[selectedTemplate?.id] ? 'Uploading...' : 'Upload Preview Image'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => selectedTemplate && handleUploadPreview(selectedTemplate, e)}
                              disabled={uploadingPreview[selectedTemplate?.id]}
                              className="hidden"
                            />
                          </label>
                          {selectedTemplate?.previewImageUrl && (
                            <button
                              type="button"
                              onClick={() => setViewingPreview(selectedTemplate)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Preview
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Upload a preview image that will be shown when users hover over this template card</p>
                      </div>
                    </div>
                  )}
                  {formError && (
                    <div className="md:col-span-2 bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-shake">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">{formError}</p>
                    </div>
                  )}
                  <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={processingForm}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                    >
                      {processingForm ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {submitLabel}
                        </>
                      )}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(null);
                          setFormState(initialFormState);
                          setFormError('');
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel edit
                      </button>
                    )}
                  </div>
                </form>
              )}
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Template Library</h2>
                {!!templates.length && (
                  <span className="text-sm text-gray-700 bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-1.5 rounded-full font-semibold border border-indigo-200 shadow-sm">
                    {templates.length} {templates.length === 1 ? 'template' : 'templates'}
                  </span>
                )}
              </div>

              {dashboardError && (
                <div className="rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-3 animate-shake">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">{dashboardError}</p>
                </div>
              )}

              {loadingTemplates ? (
                <div className="text-center py-16">
                  <div className="inline-block">
                    <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600 font-medium">Loading templates...</p>
                  </div>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-16 bg-white/80 backdrop-blur-md border-2 border-indigo-200/50 rounded-2xl shadow-lg">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium text-lg">No templates yet</p>
                  <p className="text-gray-500 text-sm mt-1">Create your first template above</p>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template, index) => {
                    const isEnabled = template.enabled !== false;
                    return (
                      <article
                        key={template.id}
                        onClick={() => setHoveredTemplate(template)}
                        className="group relative bg-white/80 backdrop-blur-md border-2 border-indigo-200/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:border-indigo-400 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1 template-card-enter"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-purple-50/0 group-hover:from-indigo-50/50 group-hover:to-purple-50/50 rounded-2xl transition-all duration-300 pointer-events-none"></div>
                        
                        <header className="flex items-start justify-between gap-3 mb-4 relative z-10">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-indigo-600 uppercase tracking-wide font-bold mb-2 truncate">
                              {template.id}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                                <span className="text-2xl">{template.icon}</span>
                                <span className="truncate">{template.name}</span>
                              </h3>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 ${
                                isEnabled
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-amber-100 text-amber-700 border border-amber-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></span>
                              {isEnabled ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </header>
                        
                        {/* Description */}
                        {template.description && (
                          <p className="text-sm text-gray-600 mb-4 overflow-hidden relative z-10" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', maxHeight: '2.5rem' }}>
                            {template.description}
                          </p>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 relative z-10" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleEdit(template)}
                              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                              title="Edit template"
                            >
                              ✏️ Edit
                            </button>
                            <label className="px-3 py-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-105 cursor-pointer">
                              📷 {uploadingPreview[template.id] ? 'Uploading...' : 'Upload Preview'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUploadPreview(template, e)}
                                disabled={uploadingPreview[template.id]}
                                className="hidden"
                              />
                            </label>
                            {template.previewImageUrl && (
                              <button
                                type="button"
                                onClick={() => setViewingPreview(template)}
                                className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                                title="View preview image"
                              >
                                👁️ View Preview
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleTemplateStatus(template, !isEnabled)}
                              disabled={processingForm}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 ${
                                isEnabled 
                                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' 
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              }`}
                              title={isEnabled ? 'Disable template' : 'Enable template'}
                            >
                              {isEnabled ? '⏸️ Disable' : '▶️ Enable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(template)}
                              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                              title="Delete template"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                          <div className="text-gray-400 group-hover:text-indigo-400 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                        </div>

                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Preview Image Modal */}
            {viewingPreview && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
                onClick={() => setViewingPreview(null)}
              >
                <div 
                  className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-indigo-300 animate-scale-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white px-6 py-5 flex items-center justify-between z-10 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                        {viewingPreview.icon}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-indigo-100 mb-1 font-semibold">
                          {viewingPreview.id}
                        </p>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          {viewingPreview.name} - Preview Image
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewingPreview(null)}
                      className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200 transform hover:scale-110 hover:rotate-90"
                      aria-label="Close"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] flex items-center justify-center bg-gray-50">
                    {viewingPreview.previewImageUrl ? (() => {
                      // Resolve image URL - handle both absolute and relative paths
                      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090';
                      let imageUrl = viewingPreview.previewImageUrl;
                      let finalImageUrl = imageUrl;
                      
                      // If it's already a full URL, use it as-is
                      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                        finalImageUrl = imageUrl;
                      } else {
                        // Ensure it starts with /uploads/ if it's a relative path
                        if (!imageUrl.startsWith('/')) {
                          imageUrl = '/' + imageUrl;
                        }
                        // If it doesn't start with /uploads/, prepend it
                        if (!imageUrl.startsWith('/uploads/')) {
                          imageUrl = '/uploads/' + imageUrl.replace(/^\/+/, '');
                        }
                        // Try relative path first (goes through nginx proxy in Docker, or direct in dev)
                        finalImageUrl = imageUrl;
                      }
                      
                      console.log('Preview image URL:', finalImageUrl);
                      
                      const handleImageError = (e) => {
                        console.error('Failed to load preview image:', finalImageUrl);
                        
                        // If we tried relative path, try backend URL directly
                        if (!finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
                          const backendUrl = apiBaseUrl + finalImageUrl;
                          console.log('Trying backend URL:', backendUrl);
                          // Update the src to try backend URL
                          e.target.src = backendUrl;
                          // Prevent showing error until we've tried both
                          return;
                        }
                        
                        // Both attempts failed - show error
                        e.target.style.display = 'none';
                        // Check if error message already exists
                        if (!e.target.parentNode.querySelector('.image-error')) {
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'image-error text-center p-8 text-gray-500';
                          errorDiv.innerHTML = `
                            <p class="text-lg font-semibold mb-2">Image not found</p>
                            <p class="text-sm mb-2">The preview image could not be loaded.</p>
                            <p class="text-xs text-gray-400 mt-2 break-all">Tried URL: ${finalImageUrl}</p>
                            <p class="text-xs text-gray-400 mt-1">Please verify:</p>
                            <ul class="text-xs text-gray-400 mt-1 text-left list-disc list-inside">
                              <li>The backend server is running</li>
                              <li>The file exists at the path</li>
                              <li>You may need to re-upload the preview image</li>
                            </ul>
                          `;
                          e.target.parentNode.appendChild(errorDiv);
                        }
                      };
                      
                      return (
                        <img 
                          src={finalImageUrl}
                          alt={`${viewingPreview.name} preview`}
                          className="max-w-full max-h-[calc(90vh-200px)] object-contain rounded-xl shadow-2xl border-2 border-gray-200"
                          onError={handleImageError}
                        />
                      );
                    })() : (
                      <div className="text-center p-8 text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-semibold mb-2">No preview image</p>
                        <p className="text-sm">Upload a preview image to see it here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Modal with animations */}
            {hoveredTemplate && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
                onClick={() => setHoveredTemplate(null)}
              >
                <div 
                  className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-indigo-300 animate-scale-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white px-6 py-5 flex items-center justify-between z-10 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                        {hoveredTemplate.icon}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-indigo-100 mb-1 font-semibold">
                          {hoveredTemplate.id}
                        </p>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          {hoveredTemplate.name}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setHoveredTemplate(null)}
                      className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200 transform hover:scale-110 hover:rotate-90"
                      aria-label="Close"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                    {hoveredTemplate.description && (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                        <p className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Description
                        </p>
                        <p className="text-base text-gray-700 leading-relaxed">{hoveredTemplate.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Content Preview
                      </p>
                      <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 hover:border-indigo-300 transition-colors">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {hoveredTemplate.content || 'No content available'}
                        </p>
                      </div>
                    </div>
                    {hoveredTemplate.css && (
                      <div>
                        <p className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          Custom CSS
                        </p>
                        <div className="bg-gray-900 rounded-xl p-5 border-2 border-gray-700 overflow-x-auto shadow-inner">
                          <pre className="text-xs text-green-400 font-mono leading-relaxed">
                            <code>{hoveredTemplate.css}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                    <div className="pt-4 border-t-2 border-gray-200 bg-gray-50 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-600 font-medium">
                          {hoveredTemplate.createdAt 
                            ? `Created: ${new Date(hoveredTemplate.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                            : 'No creation date available'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${hoveredTemplate.enabled !== false ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></span>
                        <p className="text-sm text-gray-600">
                          Status: <span className={`font-bold ${hoveredTemplate.enabled !== false ? 'text-green-600' : 'text-amber-600'}`}>
                            {hoveredTemplate.enabled !== false ? 'Enabled' : 'Disabled'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminApp;


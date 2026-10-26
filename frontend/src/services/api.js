import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (email, password, fullName) => {
    const res = await api.post('/auth/register', { email, password, full_name: fullName });
    return res.data;
  },
  googleAuth: async (idToken) => {
    const res = await api.post('/auth/google', { id_token: idToken, token: idToken });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const projectService = {
  list: async () => {
    const res = await api.get('/projects');
    return res.data;
  },
  create: async (name, description) => {
    const res = await api.post('/projects', { name, description });
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },
};

export const paperService = {
  upload: async (projectId, files, onProgress) => {
    const formData = new FormData();
    formData.append('project_id', projectId);
    files.forEach((file) => {
      formData.append('files', file);
    });

    const res = await api.post('/papers/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
    return res.data;
  },
  getByProject: async (projectId) => {
    const res = await api.get(`/papers/project/${projectId}`);
    return res.data;
  },
  getDetails: async (paperId) => {
    const res = await api.get(`/papers/${paperId}`);
    return res.data;
  },
  delete: async (paperId) => {
    const res = await api.delete(`/papers/${paperId}`);
    return res.data;
  },
  seedDemo: async (projectId) => {
    const res = await api.post(`/papers/seed-demo/${projectId}`);
    return res.data;
  },
};

export const jobService = {
  getStatus: async (jobId) => {
    const res = await api.get(`/jobs/${jobId}/status`);
    return res.data;
  },
};

export const chatService = {
  ask: async (projectId, question, paperId = null) => {
    const res = await api.post('/chat', {
      project_id: projectId,
      question,
      paper_id: paperId,
    });
    return res.data;
  },
};

export const comparisonService = {
  compare: async (projectId, paperIds = []) => {
    const res = await api.post('/comparison', {
      project_id: projectId,
      paper_ids: paperIds,
    });
    return res.data;
  },
  getCSVUrl: (projectId) => `${API_BASE_URL}/comparison/export/${projectId}`,
};

export const analyticsService = {
  getSimilarity: async (projectId) => {
    const res = await api.get(`/analytics/similarity/${projectId}`);
    return res.data;
  },
  getTrends: async (projectId) => {
    const res = await api.get(`/analytics/trends/${projectId}`);
    return res.data;
  },
  getResearchGaps: async (projectId) => {
    const res = await api.get(`/analytics/research-gaps/${projectId}`);
    return res.data;
  },
  getCitations: async (projectId) => {
    const res = await api.get(`/analytics/citations/${projectId}`);
    return res.data;
  },
};

export const reportService = {
  generate: async (projectId) => {
    const res = await api.post(`/reports/generate/${projectId}`);
    return res.data;
  },
  getPreview: async (projectId) => {
    const res = await api.get(`/reports/preview?project_id=${projectId}`);
    return res.data;
  },
  getDownloadUrl: (reportId) => `${API_BASE_URL}/reports/download/${reportId}`,
  getPDFExportUrl: (projectId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE_URL}/projects/${projectId}/export/pdf${query ? '?' + query : ''}`;
  },
  getCSVExportUrl: (projectId) => `${API_BASE_URL}/projects/${projectId}/export/csv`,
  downloadPDF: async (projectId, params = {}) => {
    const res = await api.get(`/projects/${projectId}/export/pdf`, { params, responseType: 'blob' });
    return res.data;
  },
  downloadCSV: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/export/csv`, { responseType: 'blob' });
    return res.data;
  }
};

export default api;

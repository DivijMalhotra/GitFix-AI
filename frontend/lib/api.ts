import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────
export const authApi = {
  me: () => api.get('/auth/me').then(r => r.data),
  logout: () => api.post('/auth/logout'),
};

// ─── Repos ────────────────────────────────────────────────
export const reposApi = {
  list: () => api.get('/repos').then(r => r.data),
  listGithub: () => api.get('/repos/github').then(r => r.data),
  connect: (owner: string, name: string) => api.post('/repos/connect', { owner, name }).then(r => r.data),
  get: (id: string) => api.get(`/repos/${id}`).then(r => r.data),
  index: (id: string) => api.post(`/repos/${id}/index`).then(r => r.data),
  status: (id: string) => api.get(`/repos/${id}/status`).then(r => r.data),
  delete: (id: string) => api.delete(`/repos/${id}`).then(r => r.data),
};

// ─── Debug ────────────────────────────────────────────────
export const debugApi = {
  analyze: (data: {
    repoId: string;
    errorMessage: string;
    stackTrace?: string;
    githubIssueUrl?: string;
    logs?: string;
  }) => api.post('/debug/analyze', data).then(r => r.data),

  analyzeIssue: (repoId: string, issueUrl: string) =>
    api.post('/debug/issue', { repoId, issueUrl }).then(r => r.data),

  chat: (sessionId: string, message: string) =>
    api.post('/debug/chat', { sessionId, message }).then(r => r.data),

  sessions: () => api.get('/debug/sessions').then(r => r.data),
  session: (id: string) => api.get(`/debug/sessions/${id}`).then(r => r.data),
  deleteSession: (id: string) => api.delete(`/debug/sessions/${id}`).then(r => r.data),
};

// ─── Pull Requests ────────────────────────────────────────
export const prApi = {
  create: (data: {
    sessionId: string;
    branchName?: string;
    prTitle?: string;
    prBody?: string;
  }) => api.post('/pullrequests/create', data).then(r => r.data),

  status: (sessionId: string) =>
    api.get(`/pullrequests/${sessionId}`).then(r => r.data),
};

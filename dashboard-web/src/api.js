import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const statsApi = {
  get: () => api.get('/stats'),
};

export const applicationApi = {
  list: (params) => api.get('/applications', { params }),
  get: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  remove: (id) => api.delete(`/applications/${id}`),
  import: () => api.post('/applications/import'),
  uploadJd: (id, file) => {
    const fd = new FormData();
    fd.append('jd', file);
    return api.post(`/applications/${id}/jd`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getInterviews: (id) => api.get(`/applications/${id}/interviews`),
  addInterview: (id, data) => api.post(`/applications/${id}/interviews`, data),
  getContacts: (id) => api.get(`/applications/${id}/contacts`),
  addContact: (id, data) => api.post(`/applications/${id}/contacts`, data),
  getEmails: (id) => api.get(`/applications/${id}/emails`),
  addEmail: (id, data) => api.post(`/applications/${id}/emails`, data),
  addFollowup: (id, data) => api.post(`/applications/${id}/followups`, data),
  getActivity: (id) => api.get(`/applications/${id}/activity`),
  getSources: () => api.get('/applications/sources'),
};

export const interviewApi = {
  update: (id, data) => api.put(`/interviews/${id}`, data),
  remove: (id) => api.delete(`/interviews/${id}`),
  getAll: () => api.get('/interviews/all'),
};

export const contactApi = {
  update: (id, data) => api.put(`/contacts/${id}`, data),
  remove: (id) => api.delete(`/contacts/${id}`),
};

export const emailApi = {
  update: (id, data) => api.put(`/emails/${id}`, data),
  remove: (id) => api.delete(`/emails/${id}`),
};

export const followupApi = {
  update: (id, data) => api.put(`/followups/${id}`, data),
  remove: (id) => api.delete(`/followups/${id}`),
};

export const chatApi = {
  send: (message) => api.post('/chat', { message }),
};

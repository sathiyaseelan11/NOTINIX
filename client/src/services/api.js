import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001/api',
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const { token } = JSON.parse(userInfo);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    updateProfile: (data) => api.put('/auth/profile', data),
};

// Notes API
export const notesAPI = {
    getNotes: () => api.get('/notes'),
    getNote: (id) => api.get(`/notes/${id}`),
    createNote: (data) => api.post('/notes', data),
    updateNote: (id, data) => api.put(`/notes/${id}`, data),
    deleteNote: (id) => api.delete(`/notes/${id}`),
};


// Tasks API
export const tasksAPI = {
    getTasks: (params) => api.get('/tasks', { params }),
    getTask: (id) => api.get(`/tasks/${id}`),
    createTask: (data) => api.post('/tasks', data),
    updateTask: (id, data) => api.put(`/tasks/${id}`, data),
    deleteTask: (id) => api.delete(`/tasks/${id}`),
    extractTasksFromNote: (noteId) => api.post(`/tasks/from-note/${noteId}`),
};


// Knowledge Graph API
export const graphAPI = {
    getGraph: () => api.get('/graph'),
    getNodeConnections: (noteId) => api.get(`/graph/node/${noteId}`),
    generateSemanticLinks: (noteId) => api.post('/graph/semantic-links', { noteId }),
    getTopicClusters: () => api.get('/graph/clusters'),
};

// Import API
export const importAPI = {
    uploadFile: (formData) => api.post('/import/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    importNotion: (pageId) => api.post('/import/notion', { pageId }),
};

// Upload API
export const uploadAPI = {
    uploadFile: (formData) => api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// AI API
export const aiAPI = {
    summarizeNote: (noteId, type = 'brief') => api.post('/ai/summarize', { noteId, type }),
    extractTasks: (noteId) => api.post('/ai/extract-tasks', { noteId }),
    autoTagNote: (noteId) => api.post('/ai/auto-tag', { noteId }),
    applyTags: (noteId, tags, priority) => api.post('/ai/apply-tags', { noteId, tags, priority }),
    findRelatedNotes: (noteId, limit = 5) => api.post('/ai/find-related', { noteId, limit }),
    chatWithKnowledge: (query, noteIds = []) => api.post('/ai/chat-knowledge', { query, noteIds }),
    searchNotes: (query) => api.post('/ai/search', { query }), // Legacy
    editText: (text, instruction) => api.post('/ai/edit-text', { text, instruction }),
};

export default api;

import apiClient from '../axios.config';

export const assignmentAPI = {
    getAll: async () => {
        return apiClient.get('/assignments');
    },

    getById: async (id) => {
        return apiClient.get(`/assignments/${id}`);
    },

    create: async (assignmentData) => {
        return apiClient.post('/assignments', assignmentData);
    },

    updateStatus: async (id, status) => {
        return apiClient.patch(`/assignments/${id}/status`, { status });
    },
};

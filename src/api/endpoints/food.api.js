import api from '../axios';

export const foodAPI = {
    create: async (data) => {
        const response = await api.post('/food', data);
        return response.data;
    },
    getAll: async (params = {}) => {
        const response = await api.get('/food', { params });
        return response.data;
    },
    updateStatus: async (id, status) => {
        const response = await api.put(`/food/${id}`, { status });
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/food/${id}`);
        return response.data;
    }
};

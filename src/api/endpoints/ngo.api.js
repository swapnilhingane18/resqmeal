import api from '../axios';

export const ngoAPI = {
    create: async (data) => {
        const response = await api.post('/ngos', data);
        return response.data;
    },
    getAll: async () => {
        const response = await api.get('/ngos');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/ngos/${id}`);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/ngos/${id}`, data);
        return response.data;
    },
    updateStatus: async (id, status) => {
        const response = await api.put(`/ngos/${id}`, { status });
        return response.data;
    }
};

import apiClient from '../axios.config';

export const ngoAPI = {
    getAll: async () => {
        return apiClient.get('/ngos');
    },

    getById: async (id) => {
        return apiClient.get(`/ngos/${id}`);
    },

    create: async (ngoData) => {
        return apiClient.post('/ngos', ngoData);
    },

    update: async (id, ngoData) => {
        return apiClient.put(`/ngos/${id}`, ngoData);
    },

    delete: async (id) => {
        return apiClient.delete(`/ngos/${id}`);
    },
};

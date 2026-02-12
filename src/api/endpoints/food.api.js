import apiClient from '../axios.config';

export const foodAPI = {
    // Get all food listings
    getAll: async (params = {}) => {
        return apiClient.get('/food', { params });
    },

    // Get single food item
    getById: async (id) => {
        return apiClient.get(`/food/${id}`);
    },

    // Create new food listing
    create: async (foodData) => {
        return apiClient.post('/food', foodData);
    },

    // Update food status
    updateStatus: async (id, status) => {
        return apiClient.patch(`/food/${id}/status`, { status });
    },

    // Delete food listing
    delete: async (id) => {
        return apiClient.delete(`/food/${id}`);
    },
};

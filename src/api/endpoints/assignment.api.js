import api from '../axios';

export const assignmentAPI = {
    getMyAssignments: async () => {
        const response = await api.get('/assignments/me');
        return response.data;
    },
    updateStatus: async (id, status) => {
        const response = await api.put(`/assignments/${id}`, { status });
        return response.data;
    },
    updateLocation: async (id, lat, lng) => {
        const response = await api.put(`/assignments/${id}/location`, { lat, lng });
        return response.data;
    }
};

import api from '../axios';

export const assignmentAPI = {
    getMyAssignments: async () => {
        const response = await api.get('/assignments');
        return response.data;
    },
    updateStatus: async (id, status) => {
        const response = await api.put(`/assignments/${id}`, { status });
        return response.data;
    }
};

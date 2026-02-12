import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    localStorage.removeItem('auth_token');
                    window.location.href = '/';
                    break;
                case 403:
                case 404:
                case 500:
                default:
                    break;
            }

            return Promise.reject(data);
        } else if (error.request) {
            return Promise.reject({ error: 'Network error. Please check your connection.' });
        } else {
            return Promise.reject({ error: error.message });
        }
    }
);

export default apiClient;

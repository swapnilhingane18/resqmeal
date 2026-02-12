import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const storedAuth = localStorage.getItem('auth_storage');
        if (storedAuth) {
            try {
                const parsed = JSON.parse(storedAuth);
                if (parsed.state && parsed.state.token) {
                    config.headers.Authorization = `Bearer ${parsed.state.token}`;
                }
            } catch (error) {
                localStorage.removeItem('auth_storage');
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_storage');
        }
        return Promise.reject(error);
    }
);

export default api;

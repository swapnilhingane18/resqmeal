import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const storedAuth = localStorage.getItem('auth_storage');

    if (storedAuth) {
        try {
            const parsed = JSON.parse(storedAuth);

            // Flexible token resolution
            const token =
                parsed?.state?.token ||
                parsed?.token ||
                parsed?.state?.auth?.token ||
                parsed?.auth?.token;

            console.log("🛰 Extracted Token:", token);

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log("✅ Authorization header attached");
            } else {
                console.warn("⚠ No token found in auth_storage structure");
            }
        } catch (err) {
            console.error("❌ Failed to parse auth_storage:", err);
        }
    } else {
        console.warn("⚠ auth_storage not found in localStorage");
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('[auth] 401 received — clearing session and redirecting to login');
            localStorage.removeItem('auth_storage');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

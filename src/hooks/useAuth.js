import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            role: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/login', { email, password });
                    const { token, ...userData } = response.data;

                    set({
                        user: userData,
                        role: userData.role,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                    return true;
                } catch (error) {
                    set({
                        error: error.response?.data?.message || 'Login failed',
                        isLoading: false
                    });
                    return false;
                }
            },

            register: async (name, email, password, role) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/register', { name, email, password, role });
                    const { token, ...userData } = response.data;

                    set({
                        user: userData,
                        role: userData.role,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                    return true;
                } catch (error) {
                    set({
                        error: error.response?.data?.message || 'Registration failed',
                        isLoading: false
                    });
                    return false;
                }
            },

            logout: () => {
                set({
                    user: null,
                    role: null,
                    token: null,
                    isAuthenticated: false,
                    error: null
                });
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth_storage',
        }
    )
);

export const useAuth = () => useAuthStore();

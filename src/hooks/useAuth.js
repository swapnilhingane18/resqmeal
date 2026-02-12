import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            role: null,
            token: null,
            isAuthenticated: false,

            login: (userData, token) => {
                set({
                    user: userData,
                    role: userData.role,
                    token,
                    isAuthenticated: true,
                });
                if (token) {
                    localStorage.setItem('auth_token', token);
                }
            },

            logout: () => {
                set({
                    user: null,
                    role: null,
                    token: null,
                    isAuthenticated: false,
                });
                localStorage.removeItem('auth_token');
            },

            setRole: (role) => {
                set({ role });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);

export const useAuth = () => useAuthStore();

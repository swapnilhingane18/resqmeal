import { create } from 'zustand';

const useToastStore = create((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Date.now();
        set((state) => ({
            toasts: [...state.toasts, { id, ...toast }],
        }));
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, toast.duration || 3000);
    },
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },
}));

export const useToast = () => {
    const { addToast } = useToastStore();

    return {
        success: (message) => addToast({ type: 'success', message }),
        error: (message) => addToast({ type: 'error', message }),
        info: (message) => addToast({ type: 'info', message }),
        warning: (message) => addToast({ type: 'warning', message }),
    };
};

export const useToasts = () => useToastStore((state) => state.toasts);
export const useRemoveToast = () => useToastStore((state) => state.removeToast);

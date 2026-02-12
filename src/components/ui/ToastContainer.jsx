import { useToasts, useRemoveToast } from '../../hooks/useToast';

const Toast = ({ id, type, message }) => {
    const removeToast = useRemoveToast();

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    };

    return (
        <div className={`${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slideInRight min-w-[300px]`}>
            <span className="text-xl font-bold">{icons[type]}</span>
            <p className="flex-1">{message}</p>
            <button
                onClick={() => removeToast(id)}
                className="text-white hover:text-neutral-200 text-xl font-bold"
                aria-label="Close notification"
            >
                ✕
            </button>
        </div>
    );
};

const ToastContainer = () => {
    const toasts = useToasts();

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} />
            ))}
        </div>
    );
};

export default ToastContainer;

import { useEffect, useRef } from 'react';

const Modal = ({ isOpen, onClose, children, className = '' }) => {
    const overlayRef = useRef(null);
    const contentRef = useRef(null);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/50 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
        >
            <div
                ref={contentRef}
                className={`relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md mx-auto transform transition-all duration-300 animate-scale-in ${className}`}
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;

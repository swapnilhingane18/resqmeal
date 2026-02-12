import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import Spinner from './ui/Spinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, role, logout } = useAuth();
    const normalizedRole = role ? String(role).toUpperCase() : null;
    const [checkingToken, setCheckingToken] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);

    useEffect(() => {
        let active = true;

        const verifyToken = async () => {
            if (!isAuthenticated) {
                if (active) {
                    setTokenValid(false);
                    setCheckingToken(false);
                }
                return;
            }

            try {
                await api.get('/auth/me');
                if (active) {
                    setTokenValid(true);
                }
            } catch (error) {
                if (active) {
                    setTokenValid(false);
                }
                logout();
            } finally {
                if (active) {
                    setCheckingToken(false);
                }
            }
        };

        verifyToken();

        return () => {
            active = false;
        };
    }, [isAuthenticated, logout]);

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (checkingToken) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Spinner size="xl" />
            </div>
        );
    }

    if (!tokenValid) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(normalizedRole)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;

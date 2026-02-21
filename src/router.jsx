import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import App from './App';
import Spinner from './components/ui/Spinner';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const AddFoodPage = lazy(() => import('./pages/donor/AddFoodPage'));
const NGOFeedPage = lazy(() => import('./pages/ngo/NGOFeedPage'));
const NGOAssignmentsPage = lazy(() => import('./pages/ngo/NGOAssignmentsPage'));
const NGODashboard = lazy(() => import('./pages/NGODashboard'));
const DonorDashboard = lazy(() => import('./pages/DonorDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

const SuspenseWrapper = ({ children }) => (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
            <Spinner size="xl" />
        </div>
    }>
        {children}
    </Suspense>
);

function DashboardRouter() {
    const { user, role } = useAuth();
    const normalizedRole = String(role || user?.role || '').toUpperCase();

    if (normalizedRole === 'DONOR') {
        return <DonorDashboard />;
    }
    return <NGODashboard />;
}

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        errorElement: <SuspenseWrapper><NotFound /></SuspenseWrapper>,
        children: [
            {
                index: true,
                element: <SuspenseWrapper><LandingPage /></SuspenseWrapper>,
            },
            {
                path: 'login',
                element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
            },
            {
                path: 'register',
                element: <SuspenseWrapper><RegisterPage /></SuspenseWrapper>,
            },
            {
                path: 'donor/add-food',
                element: (
                    <SuspenseWrapper>
                        <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                            <AddFoodPage />
                        </ProtectedRoute>
                    </SuspenseWrapper>
                ),
            },
            {
                path: 'ngo/feed',
                element: (
                    <SuspenseWrapper>
                        <ProtectedRoute allowedRoles={['NGO', 'ADMIN']}>
                            <NGOFeedPage />
                        </ProtectedRoute>
                    </SuspenseWrapper>
                ),
            },
            {
                path: 'ngo/assignments',
                element: (
                    <SuspenseWrapper>
                        <ProtectedRoute allowedRoles={['NGO', 'ADMIN']}>
                            <NGOAssignmentsPage />
                        </ProtectedRoute>
                    </SuspenseWrapper>
                ),
            },
            {
                path: 'dashboard',
                element: (
                    <SuspenseWrapper>
                        <ProtectedRoute allowedRoles={['DONOR', 'NGO', 'ADMIN']}>
                            <DashboardRouter />
                        </ProtectedRoute>
                    </SuspenseWrapper>
                ),
            },
            {
                path: '*',
                element: <SuspenseWrapper><NotFound /></SuspenseWrapper>,
            },
        ],
    },
]);

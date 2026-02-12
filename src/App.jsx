import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ToastContainer from './components/ui/ToastContainer';
import Button from './components/ui/Button';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, logout } = useAuth();

  const isLandingPage = location.pathname === '/';

  const handleBackToHome = () => {
    logout();
    navigate('/');
  };

  const handleAddMoreFood = () => {
    navigate('/donor/add-food');
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      {!isLandingPage && (
        <nav className="bg-white shadow-sm border-b border-neutral-200">
          <div className="container-custom py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToHome}
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
                aria-label="Back to home"
              >
                ← Back to Home
              </button>
              <h2 className="text-xl font-bold text-primary-600">
                🌱 ResQMeal
              </h2>
            </div>

            {role === 'donor' && location.pathname === '/dashboard' && (
              <Button
                onClick={handleAddMoreFood}
                variant="primary"
                size="sm"
              >
                + Add More Food
              </Button>
            )}

            {role && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-600">
                  Role: <strong className="capitalize">{role}</strong>
                </span>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;

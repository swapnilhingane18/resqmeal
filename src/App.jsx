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
        <nav className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
          <div className="container-custom py-4 flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <span className="text-2xl">🌱</span>
              <h2 className="text-xl font-bold text-primary-600 hidden sm:block">
                ResQMeal
              </h2>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-4">
              {role === 'donor' && (
                <>
                  <button
                    onClick={() => navigate('/donor/add-food')}
                    className={`text-sm font-medium transition-colors ${location.pathname === '/donor/add-food' ? 'text-primary-600' : 'text-neutral-600 hover:text-primary-900'}`}
                  >
                    Donate Food
                  </button>
                </>
              )}

              {role === 'ngo' && (
                <>
                  <button
                    onClick={() => navigate('/ngo/feed')}
                    className={`text-sm font-medium transition-colors ${location.pathname === '/ngo/feed' ? 'text-primary-600' : 'text-neutral-600 hover:text-primary-900'}`}
                  >
                    Available Food
                  </button>
                  <button
                    onClick={() => navigate('/ngo/assignments')}
                    className={`text-sm font-medium transition-colors ${location.pathname === '/ngo/assignments' ? 'text-primary-600' : 'text-neutral-600 hover:text-primary-900'}`}
                  >
                    My Pickups
                  </button>
                </>
              )}

              {/* User Menu / Logout */}
              <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-semibold text-neutral-900 capitalize">{role}</span>
                </div>
                <Button
                  onClick={handleBackToHome}
                  variant="outline"
                  size="sm"
                  className="!py-1 !px-3 text-xs"
                >
                  Logout
                </Button>
              </div>
            </div>
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

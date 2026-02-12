import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ToastContainer from './components/ui/ToastContainer';
import Button from './components/ui/Button';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, logout } = useAuth();
  const normalizedRole = role ? String(role).toUpperCase() : null;

  const isLandingPage = location.pathname === '/';

  const handleBackToHome = () => {
    logout();
    navigate('/');
  };

  const handleAddMoreFood = () => {
    navigate('/donor/add-food');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 text-neutral-800 font-sans selection:bg-green-100 selection:text-green-900">
      {/* Navigation Bar */}
      {!isLandingPage && (
        <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-neutral-200/60 sticky top-0 z-50 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate('/dashboard')}
              >
                <span className="text-3xl transform group-hover:scale-110 transition-transform duration-200">🌱</span>
                <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 tracking-tight hidden sm:block">
                  ResQMeal
                </h2>
              </div>

              {/* Navigation Links */}
              <div className="flex items-center gap-6">
                {normalizedRole === 'DONOR' && (
                  <button
                    onClick={() => navigate('/donor/add-food')}
                    className={`text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 ${location.pathname === '/donor/add-food'
                        ? 'bg-green-100 text-green-700 shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-green-600'
                      }`}
                  >
                    Donate Food
                  </button>
                )}

                {normalizedRole === 'NGO' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/ngo/feed')}
                      className={`text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 ${location.pathname === '/ngo/feed'
                          ? 'bg-green-100 text-green-700 shadow-sm'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-green-600'
                        }`}
                    >
                      Available Food
                    </button>
                    <button
                      onClick={() => navigate('/ngo/assignments')}
                      className={`text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 ${location.pathname === '/ngo/assignments'
                          ? 'bg-green-100 text-green-700 shadow-sm'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-green-600'
                        }`}
                    >
                      My Pickups
                    </button>
                  </div>
                )}

                <div className="h-6 w-px bg-neutral-200 mx-2"></div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end hidden md:flex">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      {normalizedRole === 'NGO' ? 'NGO Partner' : 'Donor'}
                    </span>
                  </div>
                  <Button
                    onClick={handleBackToHome}
                    variant="outline"
                    size="sm"
                    className="border-neutral-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-neutral-600"
                  >
                    Logout
                  </Button>
                </div>
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

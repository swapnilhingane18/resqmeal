import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';

const LandingPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleRoleSelect = (role) => {
        login({ role }, null);

        if (role === 'donor') {
            navigate('/donor/add-food');
        } else if (role === 'ngo') {
            navigate('/ngo/feed');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
            <div className="max-w-4xl w-full text-center">
                <div className="mb-12 animate-fadeIn">
                    <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-4">
                        🌱 ResQMeal
                    </h1>
                    <p className="text-xl md:text-2xl text-neutral-600 mb-2">
                        Rescue Food, Feed Communities
                    </p>
                    <p className="text-lg text-neutral-500">
                        Choose your role to get started
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    <button
                        onClick={() => handleRoleSelect('donor')}
                        className="card cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary-200 group text-left"
                        aria-label="Select Food Donor role"
                    >
                        <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">
                            🍽️
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                            Food Donor
                        </h3>
                        <p className="text-neutral-600 mb-6">
                            Restaurants, hostels, events, or individuals with surplus food
                        </p>
                        <Button variant="primary" className="w-full">
                            Get Started as Donor
                        </Button>
                    </button>

                    <button
                        onClick={() => handleRoleSelect('ngo')}
                        className="card cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-secondary-200 group text-left"
                        aria-label="Select NGO role"
                    >
                        <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">
                            🤝
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                            NGO / Volunteer
                        </h3>
                        <p className="text-neutral-600 mb-6">
                            Collect and distribute food to people in need
                        </p>
                        <Button variant="secondary" className="w-full">
                            Get Started as NGO
                        </Button>
                    </button>
                </div>

                <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-primary-600 mb-1">1240+</div>
                        <div className="text-sm text-neutral-600">Meals Rescued</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-primary-600 mb-1">620kg</div>
                        <div className="text-sm text-neutral-600">Food Saved</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-primary-600 mb-1">1.3T</div>
                        <div className="text-sm text-neutral-600">CO₂ Prevented</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;

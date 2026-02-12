import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center pt-10 pb-20 px-4 sm:px-6 lg:px-8 fade-in">
            {/* Hero Section */}
            <div className="text-center max-w-4xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-4 py-1.5 mb-8 shadow-sm">
                    <span className="animate-pulse relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                        AI-Powered Food Rescue
                    </span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-neutral-900 tracking-tight leading-tight mb-6">
                    Bridge the gap between <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                        surplus and scarcity
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    ResQMeal uses intelligent matching to instantly connect food donors with nearby NGOs, reducing waste and fighting hunger.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button
                        onClick={() => navigate('/register')}
                        size="lg"
                        className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-500/20 px-8 py-4 text-lg w-full sm:w-auto transform hover:-translate-y-1 transition-all duration-200"
                    >
                        Get Started
                    </Button>
                    <Button
                        onClick={() => navigate('/login')}
                        variant="outline"
                        size="lg"
                        className="px-8 py-4 text-lg w-full sm:w-auto"
                    >
                        Login
                    </Button>
                </div>
            </div>

            {/* Role Selection Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full mx-auto">
                <div
                    className="group relative bg-white rounded-3xl p-10 shadow-xl border border-neutral-100 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => navigate('/register?role=donor')}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <span className="text-9xl">🍱</span>
                    </div>

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform duration-300">
                            🍱
                        </div>
                        <h2 className="text-3xl font-bold text-neutral-900 mb-3">Donate Food</h2>
                        <p className="text-neutral-500 mb-8 text-lg leading-relaxed">
                            Have surplus food? List it in seconds. Our AI ensures it reaches the right people before it expires.
                        </p>
                        <div className="flex items-center text-orange-600 font-semibold group-hover:translate-x-1 transition-transform">
                            Register as Donor <span className="ml-2">→</span>
                        </div>
                    </div>
                </div>

                <div
                    className="group relative bg-white rounded-3xl p-10 shadow-xl border border-neutral-100 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => navigate('/register?role=ngo')}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <span className="text-9xl">🙌</span>
                    </div>

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform duration-300">
                            🙌
                        </div>
                        <h2 className="text-3xl font-bold text-neutral-900 mb-3">Collect Food</h2>
                        <p className="text-neutral-500 mb-8 text-lg leading-relaxed">
                            Are you an NGO? Get real-time alerts for available food nearby and manage pickups efficiently.
                        </p>
                        <div className="flex items-center text-green-600 font-semibold group-hover:translate-x-1 transition-transform">
                            Register as NGO <span className="ml-2">→</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Impact Stats (Visual only for landing) */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto w-full">
                {[
                    { label: "Meals Saved", value: "10k+", color: "text-blue-600" },
                    { label: "NGO Partners", value: "120+", color: "text-green-600" },
                    { label: "CO₂ Reduced", value: "5000kg", color: "text-emerald-600" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-neutral-100/50">
                        <div className={`text-4xl font-black ${stat.color} mb-2`}>{stat.value}</div>
                        <div className="text-neutral-500 font-medium uppercase tracking-wider text-sm">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LandingPage;

import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center py-10 sm:pt-10 sm:pb-20 px-5 sm:px-6 lg:px-8 fade-in">
            {/* Hero Section */}
            <div className="text-center max-w-md sm:max-w-4xl mx-auto mb-10 sm:mb-16">
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-4 py-1.5 mb-5 sm:mb-8 shadow-sm">
                    <span className="animate-pulse relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                        AI-Powered Food Rescue
                    </span>
                </div>

                <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-neutral-900 tracking-tight leading-[1.15] sm:leading-tight mb-4 sm:mb-6">
                    Eliminate{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                        food waste.
                    </span>
                    <br className="hidden md:block" />
                    Feed{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                        those in need.
                    </span>
                </h1>

                <p className="text-base sm:text-xl md:text-2xl text-neutral-600 mb-3 sm:mb-4 max-w-md sm:max-w-2xl mx-auto leading-relaxed">
                    ResQMeal uses intelligent matching to instantly connect food donors with nearby NGOs, reducing waste and fighting hunger.
                </p>

                {/* Trust Line */}
                <p className="text-sm text-neutral-400 font-medium mb-6 sm:mb-10 flex items-center justify-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </span>
                    Trusted by 100+ NGOs across India
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-sm sm:max-w-none mx-auto">
                    <Button
                        onClick={() => navigate('/register')}
                        size="lg"
                        className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-md hover:shadow-lg px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto transform hover:scale-105 transition-all duration-200"
                    >
                        Donate Food
                    </Button>
                    <Button
                        onClick={() => navigate('/login')}
                        variant="outline"
                        size="lg"
                        className="px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto transform hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md border-neutral-800 text-neutral-800 hover:bg-neutral-900 hover:text-white"
                    >
                        Login
                    </Button>
                </div>
            </div>

            {/* Role Selection Cards */}
            <div className="grid md:grid-cols-2 gap-5 sm:gap-8 max-w-5xl w-full mx-auto">
                <div
                    className="group relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-md sm:shadow-xl border border-neutral-100 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => navigate('/register?role=donor')}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <span className="text-8xl sm:text-9xl">🍱</span>
                    </div>

                    <div className="relative z-10">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300">
                            🍱
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2 sm:mb-3">Donate Food</h2>
                        <p className="text-neutral-500 mb-5 sm:mb-8 text-base sm:text-lg leading-relaxed">
                            Have surplus food? List it in seconds. Our AI ensures it reaches the right people before it expires.
                        </p>
                        <div className="flex items-center text-orange-600 font-semibold group-hover:translate-x-1 transition-transform">
                            Register as Donor <span className="ml-2">→</span>
                        </div>
                    </div>
                </div>

                <div
                    className="group relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-md sm:shadow-xl border border-neutral-100 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => navigate('/register?role=ngo')}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <span className="text-8xl sm:text-9xl">🙌</span>
                    </div>

                    <div className="relative z-10">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300">
                            🙌
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2 sm:mb-3">Collect Food</h2>
                        <p className="text-neutral-500 mb-5 sm:mb-8 text-base sm:text-lg leading-relaxed">
                            Are you an NGO? Get real-time alerts for available food nearby and manage pickups efficiently.
                        </p>
                        <div className="flex items-center text-green-600 font-semibold group-hover:translate-x-1 transition-transform">
                            Register as NGO <span className="ml-2">→</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Impact Stats (Visual only for landing) */}
            <div className="mt-12 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 text-center max-w-4xl mx-auto w-full">
                {[
                    { label: "Meals Saved", value: "10k+", color: "text-blue-600" },
                    { label: "NGO Partners", value: "120+", color: "text-green-600" },
                    { label: "CO₂ Reduced", value: "5000kg", color: "text-emerald-600" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white/50 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border border-neutral-100/50">
                        <div className={`text-3xl sm:text-4xl font-black ${stat.color} mb-1 sm:mb-2`}>{stat.value}</div>
                        <div className="text-neutral-500 font-medium uppercase tracking-wider text-xs sm:text-sm">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LandingPage;

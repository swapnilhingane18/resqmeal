import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import MapPickerModal from '../../components/MapPickerModal';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register: registerUser, isLoading, error, clearError } = useAuth();
    const [searchParams] = useSearchParams();
    const urlRole = searchParams.get('role');
    const defaultRole = (urlRole === 'ngo' || urlRole === 'NGO') ? 'NGO' : ((urlRole === 'donor' || urlRole === 'DONOR') ? 'DONOR' : 'DONOR');
    const hasFixedRole = urlRole === 'ngo' || urlRole === 'NGO' || urlRole === 'donor' || urlRole === 'DONOR';

    const { register, handleSubmit, control, formState: { errors } } = useForm({
        defaultValues: {
            role: defaultRole
        }
    });
    const selectedRole = useWatch({ control, name: 'role' });
    const [localError, setLocalError] = useState('');

    // Map UI State
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [locationStatus, setLocationStatus] = useState('');
    const [isLocating, setIsLocating] = useState(false);

    const handleGeolocation = () => {
        setIsLocating(true);
        setLocationStatus('Requesting location permissions...');
        setLocalError('');

        if (!navigator.geolocation) {
            setLocalError('Geolocation is not supported by your browser.');
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setSelectedLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocationStatus('📍 Location detected successfully.');
                setIsLocating(false);
            },
            (error) => {
                console.error('Geolocation Error:', error);
                setLocalError('Unable to retrieve your location. Please ensure permissions are granted or use the map.');
                setLocationStatus('');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleMapConfirm = (locationData) => {
        // locationData is an object { lat: number, lng: number, address: string }
        setSelectedLocation({
            lat: Number(locationData.lat),
            lng: Number(locationData.lng)
        });
        setLocationStatus('📍 Location selected successfully.');
    };

    const onSubmit = async (data) => {
        clearError();
        setLocalError('');

        let extraData = {};
        if (data.role === 'NGO') {
            if (!selectedLocation) {
                setLocalError('Please select your NGO location.');
                return;
            }
            if (!data.capacity || Number(data.capacity) <= 0) {
                setLocalError('Capacity must be greater than zero.');
                return;
            }

            extraData = {
                capacity: Number(data.capacity),
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng
            };
        }

        const success = await registerUser(data.name, data.email, data.password, data.role, extraData);
        if (success) {
            navigate('/dashboard');
        }
    };

    return (
        <>
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900">
                            Create your account
                        </h2>
                        <p className="mt-2 text-center text-sm text-neutral-600">
                            Or{' '}
                            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                                sign in to your existing account
                            </Link>
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="name" className="sr-only">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-neutral-300'} placeholder-neutral-500 text-neutral-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                                    placeholder="Full Name or Organization Name"
                                    {...register('name', { required: 'Name is required' })}
                                />
                            </div>
                            <div>
                                <label htmlFor="email-address" className="sr-only">
                                    Email address
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-neutral-300'} placeholder-neutral-500 text-neutral-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                                    placeholder="Email address"
                                    {...register('email', { required: 'Email is required' })}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-neutral-300'} placeholder-neutral-500 text-neutral-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                                    placeholder="Password"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 6, message: 'Password must be at least 6 characters' }
                                    })}
                                />
                            </div>
                            <div>
                                <label htmlFor="role" className="sr-only">
                                    Role
                                </label>
                                {hasFixedRole ? (
                                    <>
                                        <input type="hidden" {...register('role')} value={defaultRole} />
                                        <div className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${errors.role ? 'border-red-300' : 'border-neutral-300'} bg-neutral-100 text-neutral-500 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}>
                                            {defaultRole === 'NGO' ? 'NGO / Volunteer' : 'Food Donor'}
                                        </div>
                                    </>
                                ) : (
                                    <select
                                        id="role"
                                        name="role"
                                        className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${errors.role ? 'border-red-300' : 'border-neutral-300'} placeholder-neutral-500 text-neutral-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                                        {...register('role', { required: 'Role is required' })}
                                    >
                                        <option value="DONOR">Food Donor</option>
                                        <option value="NGO">NGO / Volunteer</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        {selectedRole === 'NGO' && (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="capacity" className="block text-sm font-medium text-neutral-700 mb-1">
                                        How many people can you serve per pickup?
                                    </label>
                                    <input
                                        id="capacity"
                                        type="number"
                                        min="1"
                                        required
                                        className={`appearance-none relative block w-full px-3 py-2 border ${errors.capacity ? 'border-red-300' : 'border-neutral-300'} rounded-md placeholder-neutral-500 text-neutral-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                                        placeholder="e.g., 50"
                                        {...register('capacity', { required: 'Capacity is required for NGOs', min: 1 })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        NGO Location
                                    </label>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            type="button"
                                            onClick={handleGeolocation}
                                            disabled={isLocating}
                                            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium bg-white text-neutral-700 hover:bg-neutral-50 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                        >
                                            {isLocating ? 'Locating...' : '📍 Use My Current Location'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setIsMapOpen(true)}
                                            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-primary-300 shadow-sm text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                        >
                                            🗺️ Choose Location on Map
                                        </button>
                                    </div>

                                    {locationStatus && (
                                        <div className="mt-2 text-sm text-green-600 font-medium">
                                            {locationStatus}
                                        </div>
                                    )}

                                    {selectedLocation?.lat != null && selectedLocation?.lng != null && !isNaN(selectedLocation.lat) && !isNaN(selectedLocation.lng) && (
                                        <div className="mt-2 text-xs text-neutral-500 font-mono bg-neutral-100 px-3 py-2 border border-neutral-200 rounded">
                                            Coordinates: {Number(selectedLocation.lat).toFixed(4)}, {Number(selectedLocation.lng).toFixed(4)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {(error || localError) && (
                            <div className="text-red-500 text-sm text-center">
                                {error || localError}
                            </div>
                        )}

                        <div>
                            <Button
                                type="submit"
                                loading={isLoading}
                                variant="primary"
                                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Create Account
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <MapPickerModal
                isOpen={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                onConfirm={handleMapConfirm}
                initialPosition={selectedLocation}
            />
        </>
    );
};

export default RegisterPage;

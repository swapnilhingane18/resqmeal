import { useState, useEffect } from 'react';
import { foodAPI } from '../../api';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';

const NGOFeedPage = () => {
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const toast = useToast();

    const fetchFoods = async () => {
        try {
            setLoading(true);
            const response = await foodAPI.getAll({ status: 'available' });
            setFoods(response.foods || []);
        } catch (error) {
            toast.error(error?.error || 'Failed to load food listings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFoods();
        const interval = setInterval(fetchFoods, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleAcceptPickup = async (foodId) => {
        try {
            setActionLoading(prev => ({ ...prev, [foodId]: true }));
            await foodAPI.updateStatus(foodId, 'assigned');
            toast.success('Pickup accepted successfully!');
            fetchFoods();
        } catch (error) {
            toast.error(error?.error || 'Failed to accept pickup');
        } finally {
            setActionLoading(prev => ({ ...prev, [foodId]: false }));
        }
    };

    const getUrgencyBadge = (expiresAt) => {
        const hoursLeft = (new Date(expiresAt) - new Date()) / (1000 * 60 * 60);

        if (hoursLeft < 2) {
            return <span className="badge badge-error">High Urgency</span>;
        } else if (hoursLeft < 6) {
            return <span className="badge badge-warning">Medium Urgency</span>;
        } else {
            return <span className="badge badge-success">Low Urgency</span>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Spinner size="xl" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-neutral-900 mb-2">
                        🤝 Available Food Pickups
                    </h1>
                    <p className="text-neutral-600">
                        Accept food donations and help distribute them to those in need
                    </p>
                </div>

                <div className="card mb-8 bg-primary-50 border-2 border-primary-200">
                    <h3 className="text-lg font-semibold text-primary-900 mb-2">
                        📋 How it works
                    </h3>
                    <ul className="space-y-1 text-sm text-primary-800">
                        <li>• Browse available food donations below</li>
                        <li>• Check urgency levels and pickup locations</li>
                        <li>• Accept pickups that match your capacity</li>
                        <li>• Coordinate with donors for collection</li>
                    </ul>
                </div>

                {foods.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4">🍽️</div>
                        <h3 className="text-2xl font-semibold text-neutral-700 mb-2">
                            No food available right now
                        </h3>
                        <p className="text-neutral-500">
                            Check back later for new donations
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {foods.map((food) => (
                            <div key={food._id} className="card hover:shadow-xl transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-neutral-900">
                                            {food.description}
                                        </h3>
                                        <p className="text-sm text-neutral-500 capitalize">
                                            {food.type} food
                                        </p>
                                    </div>
                                    {getUrgencyBadge(food.expiresAt)}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-neutral-700">
                                        <span className="text-xl">🍽️</span>
                                        <span>
                                            <strong>{food.quantity}</strong> {food.unit}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-neutral-700">
                                        <span className="text-xl">⏰</span>
                                        <span>
                                            Expires {formatDistanceToNow(new Date(food.expiresAt), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-neutral-700">
                                        <span className="text-xl">📍</span>
                                        <span>
                                            {food.lat?.toFixed(4)}, {food.lng?.toFixed(4)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-neutral-700">
                                        <span className="text-xl">👤</span>
                                        <span>{food.donor?.name || 'Anonymous'}</span>
                                    </div>
                                </div>

                                {food.donor?.contact && (
                                    <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                                        <p className="text-sm text-neutral-600">
                                            <strong>Contact:</strong> {food.donor.contact}
                                        </p>
                                        {food.donor.email && (
                                            <p className="text-sm text-neutral-600">
                                                <strong>Email:</strong> {food.donor.email}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {food.notes && (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-sm text-blue-900">
                                            <strong>Notes:</strong> {food.notes}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => handleAcceptPickup(food._id)}
                                        loading={actionLoading[food._id]}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Accept Pickup
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            window.open(
                                                `https://www.google.com/maps?q=${food.lat},${food.lng}`,
                                                '_blank'
                                            );
                                        }}
                                    >
                                        📍 View on Map
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NGOFeedPage;

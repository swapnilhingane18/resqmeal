import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { foodAPI } from '../../api';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';

const AddFoodPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const { register, handleSubmit, formState: { errors }, reset } = useForm();

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const foodData = {
                type: data.type,
                quantity: parseFloat(data.quantity),
                unit: data.unit,
                description: data.description,
                lat: parseFloat(data.lat),
                lng: parseFloat(data.lng),
                expiresAt: new Date(data.expiresAt).toISOString(),
                donor: {
                    name: data.donorName,
                    contact: data.donorContact,
                    email: data.donorEmail || undefined,
                },
                notes: data.notes || undefined,
            };

            await foodAPI.create(foodData);
            toast.success('Food donation posted successfully! 🎉');
            reset();
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.error || 'Failed to post food donation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-neutral-900 mb-2">
                        🍱 Donate Surplus Food
                    </h1>
                    <p className="text-neutral-600">
                        Help reduce food waste by donating your surplus food to those in need
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
                    {/* Food Type */}
                    <div>
                        <label htmlFor="type" className="label">
                            Food Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="type"
                            {...register('type', { required: 'Food type is required' })}
                            className={`input ${errors.type ? 'input-error' : ''}`}
                        >
                            <option value="">Select type</option>
                            <option value="cooked">Cooked Food</option>
                            <option value="raw">Raw Ingredients</option>
                            <option value="packaged">Packaged Food</option>
                            <option value="prepared">Prepared Meals</option>
                        </select>
                        {errors.type && (
                            <p className="form-error" role="alert">{errors.type.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="label">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="description"
                            {...register('description', {
                                required: 'Description is required',
                                minLength: { value: 3, message: 'Description must be at least 3 characters' }
                            })}
                            className={`input ${errors.description ? 'input-error' : ''}`}
                            placeholder="e.g., Rice & Dal, Fresh Vegetables"
                        />
                        {errors.description && (
                            <p className="form-error" role="alert">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Quantity & Unit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="quantity" className="label">
                                Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="quantity"
                                type="number"
                                step="0.1"
                                {...register('quantity', {
                                    required: 'Quantity is required',
                                    min: { value: 0.1, message: 'Quantity must be greater than 0' }
                                })}
                                className={`input ${errors.quantity ? 'input-error' : ''}`}
                                placeholder="30"
                            />
                            {errors.quantity && (
                                <p className="form-error" role="alert">{errors.quantity.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="unit" className="label">
                                Unit <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="unit"
                                {...register('unit', { required: true })}
                                className="input"
                            >
                                <option value="portions">Portions</option>
                                <option value="kg">Kilograms (kg)</option>
                                <option value="liters">Liters</option>
                                <option value="boxes">Boxes</option>
                            </select>
                        </div>
                    </div>

                    {/* Expiry Time */}
                    <div>
                        <label htmlFor="expiresAt" className="label">
                            Expires At <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="expiresAt"
                            type="datetime-local"
                            {...register('expiresAt', {
                                required: 'Expiry time is required',
                                validate: (value) => {
                                    const selectedDate = new Date(value);
                                    const now = new Date();
                                    return selectedDate > now || 'Expiry time must be in the future';
                                }
                            })}
                            className={`input ${errors.expiresAt ? 'input-error' : ''}`}
                        />
                        {errors.expiresAt && (
                            <p className="form-error" role="alert">{errors.expiresAt.message}</p>
                        )}
                        <p className="text-sm text-neutral-500 mt-1">
                            When will this food expire or need to be picked up?
                        </p>
                    </div>

                    {/* Location */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Pickup Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="lat" className="label">
                                    Latitude <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="lat"
                                    type="number"
                                    step="any"
                                    {...register('lat', {
                                        required: 'Latitude is required',
                                        min: { value: -90, message: 'Invalid latitude' },
                                        max: { value: 90, message: 'Invalid latitude' }
                                    })}
                                    className={`input ${errors.lat ? 'input-error' : ''}`}
                                    placeholder="28.7041"
                                />
                                {errors.lat && (
                                    <p className="form-error" role="alert">{errors.lat.message}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="lng" className="label">
                                    Longitude <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="lng"
                                    type="number"
                                    step="any"
                                    {...register('lng', {
                                        required: 'Longitude is required',
                                        min: { value: -180, message: 'Invalid longitude' },
                                        max: { value: 180, message: 'Invalid longitude' }
                                    })}
                                    className={`input ${errors.lng ? 'input-error' : ''}`}
                                    placeholder="77.1025"
                                />
                                {errors.lng && (
                                    <p className="form-error" role="alert">{errors.lng.message}</p>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-neutral-500 mt-2">
                            💡 Tip: You can use Google Maps to find coordinates
                        </p>
                    </div>

                    {/* Donor Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Your Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="donorName" className="label">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="donorName"
                                    {...register('donorName', {
                                        required: 'Name is required',
                                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                                    })}
                                    className={`input ${errors.donorName ? 'input-error' : ''}`}
                                    placeholder="Your name or organization"
                                />
                                {errors.donorName && (
                                    <p className="form-error" role="alert">{errors.donorName.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="donorContact" className="label">
                                    Contact Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="donorContact"
                                    type="tel"
                                    {...register('donorContact', {
                                        required: 'Contact number is required',
                                        pattern: {
                                            value: /^[0-9+\-\s()]+$/,
                                            message: 'Invalid phone number'
                                        }
                                    })}
                                    className={`input ${errors.donorContact ? 'input-error' : ''}`}
                                    placeholder="+91 98765 43210"
                                />
                                {errors.donorContact && (
                                    <p className="form-error" role="alert">{errors.donorContact.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="donorEmail" className="label">
                                    Email (Optional)
                                </label>
                                <input
                                    id="donorEmail"
                                    type="email"
                                    {...register('donorEmail', {
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                    className={`input ${errors.donorEmail ? 'input-error' : ''}`}
                                    placeholder="your.email@example.com"
                                />
                                {errors.donorEmail && (
                                    <p className="form-error" role="alert">{errors.donorEmail.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional Notes */}
                    <div>
                        <label htmlFor="notes" className="label">
                            Additional Notes (Optional)
                        </label>
                        <textarea
                            id="notes"
                            {...register('notes')}
                            className="input"
                            rows="3"
                            placeholder="Any special instructions, dietary information, or pickup details..."
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full"
                            variant="primary"
                        >
                            {loading ? 'Posting...' : 'Post Food Donation'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFoodPage;

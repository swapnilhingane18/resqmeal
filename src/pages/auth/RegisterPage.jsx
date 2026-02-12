import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register: registerUser, isLoading, error, clearError } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            role: 'DONOR'
        }
    });
    const [localError, setLocalError] = useState('');

    const onSubmit = async (data) => {
        clearError();
        setLocalError('');
        const success = await registerUser(data.name, data.email, data.password, data.role);
        if (success) {
            navigate('/dashboard');
        } else {
            setLocalError('Registration failed');
        }
    };

    return (
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
                            <select
                                id="role"
                                name="role"
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${errors.role ? 'border-red-300' : 'border-neutral-300'} placeholder-neutral-500 text-neutral-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                                {...register('role', { required: 'Role is required' })}
                            >
                                <option value="DONOR">Food Donor</option>
                                <option value="NGO">NGO / Volunteer</option>
                            </select>
                        </div>
                    </div>

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
    );
};

export default RegisterPage;

import React, { useState, useEffect, useRef, useMemo, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { foodAPI } from '../../api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

// Lazy loading the map modal for performance
const MapPickerModal = lazy(() => import('../../components/MapPickerModal.jsx'));

const AddFoodPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [assignmentResult, setAssignmentResult] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [autoSubmitPending, setAutoSubmitPending] = useState(false);
    const toast = useToast();

    // Intersection Observer Steps
    const [activeStep, setActiveStep] = useState(1);
    const step1Ref = useRef(null);
    const step2Ref = useRef(null);
    const step3Ref = useRef(null);
    const formTopRef = useRef(null);

    // Form Field Focus State for Helpers
    const [focusedField, setFocusedField] = useState(null);

    // Draft State & Autosave Indicator
    const [saveStatus, setSaveStatus] = useState(''); // 'Saving...', 'Saved just now', 'Draft restored'
    const saveTimeoutRef = useRef(null);

    // Map & Location State
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState("");
    const [isLocating, setIsLocating] = useState(false);

    // Error Summary Visibility
    const [showErrorSummary, setShowErrorSummary] = useState(false);

    // Success Redirect Status
    const [successTimer, setSuccessTimer] = useState(3);

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch, trigger } = useForm({
        defaultValues: {
            donorName: user?.name || '',
            donorContact: user?.contact || '',
            donorEmail: user?.email || '',
        },
        mode: 'onChange' // Enables real-time validation for progress bar
    });

    const formValues = watch();
    const { quantity, unit, type, description, expiresAt, lat, donorName, donorContact } = formValues;

    // --- Progress Calculation ---
    const completionPercentage = useMemo(() => {
        const requiredFields = [type, quantity, unit, description, expiresAt, lat, donorName, donorContact];
        const validFields = requiredFields.filter(field => field && String(field).trim() !== '');
        return Math.round((validFields.length / requiredFields.length) * 100);
    }, [type, quantity, unit, description, expiresAt, lat, donorName, donorContact]);

    // Urgency Color based on Expiry
    const progressColor = useMemo(() => {
        if (!expiresAt) return 'bg-emerald-500';
        const hoursUntilExpiry = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilExpiry < 2) return 'bg-red-500';
        if (hoursUntilExpiry < 6) return 'bg-amber-500';
        return 'bg-emerald-500';
    }, [expiresAt]);

    // --- Draft & Auto-Save Logic ---
    // Load Draft on Mount
    useEffect(() => {
        const savedContact = localStorage.getItem("resqmeal_contact_draft");
        if (savedContact) {
            try {
                const parsed = JSON.parse(savedContact);
                reset({
                    donorName: parsed.donorName || "",
                    donorContact: parsed.donorContact || "",
                    donorEmail: parsed.donorEmail || "",
                });
                setSaveStatus('Draft restored');
                setTimeout(() => setSaveStatus(''), 4000);
            } catch (err) {
                console.error("Failed to parse draft", err);
            }
        }
    }, [reset, user]);

    // --- Resume Pending Donation After Login ---
    useEffect(() => {
        if (!user) return;
        const pending = localStorage.getItem('pendingDonation');
        if (!pending) return;

        try {
            const savedData = JSON.parse(pending);
            // Restore all form fields
            Object.entries(savedData).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    setValue(key, value, { shouldValidate: true });
                }
            });
            // Restore address display if location was saved
            if (savedData._selectedAddress) {
                setSelectedAddress(savedData._selectedAddress);
            }
            localStorage.removeItem('pendingDonation');
            setAutoSubmitPending(true);
            toast.success('Draft restored — submitting your donation...', { duration: 2000 });
        } catch (err) {
            console.error('Failed to restore pending donation', err);
            localStorage.removeItem('pendingDonation');
        }
    }, [user, setValue, toast]);

    // Debounced Save on Change (Only Contact Fields)
    useEffect(() => {
        if (!donorName && !donorContact && !formValues.donorEmail) return;

        setSaveStatus('Saving...');
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(() => {
            const persistentDraft = {
                donorName: formValues.donorName,
                donorContact: formValues.donorContact,
                donorEmail: formValues.donorEmail,
            };
            localStorage.setItem("resqmeal_contact_draft", JSON.stringify(persistentDraft));
            setSaveStatus('Saved just now');
        }, 500);
        return () => clearTimeout(saveTimeoutRef.current);
    }, [formValues.donorName, formValues.donorContact, formValues.donorEmail]);

    // --- Intersection Observer (Steps) ---
    useEffect(() => {
        const observerOptions = { threshold: 0.3, rootMargin: "-10% 0px -40% 0px" };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.id === 'step-1') setActiveStep(1);
                    if (entry.target.id === 'step-2') setActiveStep(2);
                    if (entry.target.id === 'step-3') setActiveStep(3);
                }
            });
        }, observerOptions);

        if (step1Ref.current) observer.observe(step1Ref.current);
        if (step2Ref.current) observer.observe(step2Ref.current);
        if (step3Ref.current) observer.observe(step3Ref.current);

        return () => observer.disconnect();
    }, []);

    // --- Impact Calculation ---
    const impact = useMemo(() => {
        if (!quantity || !unit) return null;
        const q = parseFloat(quantity) || 0;
        let meals = 0, co2 = 0;
        switch (unit) {
            case 'kg': meals = Math.floor(q * 2.5); co2 = q * 2.5; break;
            case 'portions': meals = Math.floor(q); co2 = q * 0.4; break;
            case 'boxes': meals = Math.floor(q * 2); co2 = q * 0.8; break;
            case 'liters': meals = Math.floor(q * 4); co2 = q * 1.5; break;
            default: return null;
        }
        if (meals < 1) return null;
        return { meals, co2: co2.toFixed(1) };
    }, [quantity, unit]);

    // --- Submission ---
    const onSubmit = async (data) => {
        setShowErrorSummary(false); // Clear errors UI if any

        // Login check — save form data and show modal for unauthenticated users
        if (!user) {
            const pendingData = { ...data };
            if (selectedAddress) pendingData._selectedAddress = selectedAddress;
            localStorage.setItem('pendingDonation', JSON.stringify(pendingData));
            setShowLoginModal(true);
            return;
        }

        try {
            // STEP 5: Safe submit guard
            if (!data.lat || !data.lng) {
                toast.error("Please select a pickup location");
                return;
            }
            if (!data.quantity || parseFloat(data.quantity) <= 0) {
                toast.error("Quantity must be greater than 0");
                return;
            }
            if (!data.unit) {
                toast.error("Please select a valid unit.");
                return;
            }

            // STEP 3: Expiry Date validation
            if (!data.expiresAt) {
                toast.error("Please select an expiration time");
                return;
            }
            const expiresDate = new Date(data.expiresAt);
            if (isNaN(expiresDate.getTime())) {
                toast.error("Invalid expiration date format");
                return;
            }

            setLoading(true);

            // STEP 2 & 1: Construct exactly what backend destructured
            const foodData = {
                type: data.type,
                quantity: Number(data.quantity),
                unit: data.unit,
                description: data.description,
                lat: Number(data.lat),
                lng: Number(data.lng),
                expiresAt: expiresDate.toISOString(),
                foodExpiresAt: expiresDate.toISOString(),
                donor: {
                    name: data.donorName,
                    contact: data.donorContact,
                    email: data.donorEmail || undefined,
                },
                notes: data.notes || undefined,
            };

            console.log("=== DIAGNOSTIC: SUBMITTING FOOD PAYLOAD ===", JSON.stringify(foodData, null, 2));

            const response = await foodAPI.create(foodData);

            // Clean auto-save on success (only the old food one if it exists, contact stays)
            localStorage.removeItem("resqmeal_draft_food");
            localStorage.removeItem("pendingDonation");
            setSaveStatus('');

            setAssignmentResult(response.assignment || { status: 'pending' });

            let counter = 3;
            const timer = setInterval(() => {
                counter -= 1;
                setSuccessTimer(counter);
                if (counter <= 0) {
                    clearInterval(timer);
                    navigate('/dashboard');
                }
            }, 1000);

            reset({
                type: "",
                quantity: "",
                unit: "",
                description: "",
                lat: "",
                lng: "",
                expiresAt: "",
                foodExpiresAt: "",
                notes: "",
                donorName: formValues.donorName,
                donorContact: formValues.donorContact,
                donorEmail: formValues.donorEmail,
            });
            setSelectedAddress("");

            toast.success("Donation published successfully! 🎉", {
                duration: 3000,
                style: {
                    borderRadius: "8px",
                    background: "#ecfdf5",
                    color: "#065f46",
                },
            });
        } catch (error) {
            console.error('Add food error:', error);
            toast.error(error.response?.data?.message || 'Failed to publish donation');
            setLoading(false);
        }
    };

    // Auto-submit after pending donation data is restored
    useEffect(() => {
        if (!autoSubmitPending) return;
        setAutoSubmitPending(false);
        setLoading(true);
        const timer = setTimeout(() => {
            handleSubmit(onSubmit)();
        }, 400);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Form Error Handler
    const onError = (errors) => {
        setShowErrorSummary(true);
        if (formTopRef.current) {
            formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const scrollToField = (fieldId) => {
        const el = document.getElementById(fieldId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
        }
    };

    // --- Handlers ---
    const handleUseCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setValue('lat', latitude, { shouldValidate: true });
                setValue('lng', longitude, { shouldValidate: true });

                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    setSelectedAddress(data.display_name || "Current Location");
                    toast.success("Location updated successfully");
                } catch (err) {
                    setSelectedAddress("Current Location");
                } finally {
                    setIsLocating(false);
                }
            },
            () => {
                toast.error("Failed to get location. Please allow access or use the map.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    }, [setValue, toast]);

    const handleMapConfirm = useCallback(({ lat, lng, address }) => {
        setValue('lat', Number(lat), { shouldValidate: true });
        setValue('lng', Number(lng), { shouldValidate: true });
        setSelectedAddress(address || "");
        setIsMapOpen(false);
    }, [setValue]);

    // Success View
    if (assignmentResult) {
        return (
            <div className="min-h-screen bg-stone-50 py-12 px-4 flex items-center justify-center animate-fade-in">
                <div className="max-w-[650px] w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8 sm:p-12 text-center space-y-6">
                    <div className="flex justify-center mb-6 animate-bounce">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl shadow-inner">
                            ✅
                        </div>
                    </div>
                    <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">Donation Published Successfully</h2>
                    <p className="text-lg text-stone-600 max-w-md mx-auto leading-relaxed">
                        Your food is now being matched with nearby NGOs.
                    </p>
                    <div className="bg-stone-50 rounded-xl p-6 my-8 border border-stone-100">
                        <div className="flex items-center justify-center space-x-3 text-stone-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            <span>Estimated assignment window: <strong className="text-stone-800">2 minutes</strong></span>
                        </div>
                    </div>
                    <p className="text-sm text-stone-400">
                        Redirecting to dashboard in {successTimer} seconds...
                    </p>
                </div>
            </div>
        );
    }

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <div className="min-h-screen bg-stone-50 pb-24 relative overflow-x-hidden">

            {/* --- TOP PROGRESS BAR --- */}
            <div className="fixed top-0 left-0 w-full h-1.5 bg-stone-200 z-50">
                <div
                    className={`h-full transition-all duration-700 ease-out ${progressColor}`}
                    style={{ width: `${completionPercentage}%` }}
                    role="progressbar"
                    aria-valuenow={completionPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                />
            </div>

            {/* --- PROGRESS PILLS (MOBILE & DESKTOP) --- */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-5 pb-4 border-b border-stone-200 px-4 shadow-sm">
                <div className="max-w-2xl mx-auto flex items-center justify-between relative px-2">
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-stone-200 -z-10 hidden sm:block"></div>

                    {[
                        { num: 1, label: "Details" },
                        { num: 2, label: "Location" },
                        { num: 3, label: "Publish" }
                    ].map((step) => (
                        <div key={step.num} className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 cursor-default bg-transparent sm:bg-white sm:px-2 transition-all">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 shadow-sm ${activeStep >= step.num ? 'bg-emerald-600 text-white scale-110' : 'bg-white border-2 border-stone-200 text-stone-400 opacity-60'}`}>
                                {activeStep > step.num ? '✓' : step.num}
                            </div>
                            <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-bold transition-colors ${activeStep >= step.num ? 'text-emerald-800' : 'text-stone-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 relative" ref={formTopRef}>

                <div className="mb-8 text-center sm:text-left transition-all duration-500 origin-top">
                    <h1 className="text-3xl font-extrabold text-stone-900 mb-2 tracking-tight flex items-center justify-center sm:justify-start gap-3">
                        🍱 <span>Donate Surplus Food</span>
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3">
                        <p className="text-stone-500 text-sm font-medium">
                            Fill in the details below to securely publish your donation.
                        </p>
                        {saveStatus && (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full animate-fade-in flex items-center gap-1 ${saveStatus === 'Saving...' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {saveStatus === 'Saving...' ? <div className="w-2.5 h-2.5 border border-amber-600 border-t-transparent rounded-full animate-spin"></div> : '☁️'}
                                {saveStatus}
                            </span>
                        )}
                    </div>
                </div>

                {/* ERROR SUMMARY CARD */}
                {showErrorSummary && hasErrors && (
                    <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-xl shadow-sm animate-slide-down">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-red-600 text-xl font-bold">⚠️</span>
                            <h3 className="font-bold text-red-800 text-sm uppercase tracking-wide">Action Required</h3>
                        </div>
                        <ul className="space-y-1 pl-7 list-disc text-sm text-red-700">
                            {Object.entries(errors).map(([key, err]) => (
                                <li key={key}>
                                    <button
                                        type="button"
                                        onClick={() => scrollToField(key)}
                                        className="hover:underline text-left outline-none focus:ring-2 focus:ring-red-400 rounded-sm"
                                    >
                                        {err.message}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8 relative pb-32">

                    {/* --- SECTION 1: Food Details --- */}
                    <div id="step-1" ref={step1Ref} className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition-shadow scroll-mt-36">
                        <h2 className="text-base font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-stone-100 pb-3">
                            <span className="text-xl">🥗</span> Food Details
                        </h2>

                        <div className="relative group">
                            <select
                                id="type"
                                aria-label="Food Type"
                                aria-invalid={errors.type ? "true" : "false"}
                                onFocus={() => setFocusedField('type')}
                                onBlur={() => setFocusedField(null)}
                                {...register('type', { required: 'Food type is required' })}
                                className={`peer block w-full rounded-xl border appearance-none px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${errors.type ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-stone-200 focus:border-emerald-500 hover:border-stone-300'}`}
                            >
                                <option value="" disabled hidden></option>
                                <option value="cooked">Cooked Food</option>
                                <option value="raw">Raw Ingredients</option>
                                <option value="packaged">Packaged Food</option>
                                <option value="prepared">Prepared Meals</option>
                            </select>
                            <label htmlFor="type" className={`absolute left-4 top-2 text-xs font-medium transition-all pointer-events-none ${errors.type ? 'text-red-500' : 'text-stone-500 peer-focus:text-emerald-600'} ${!type && 'peer-focus:text-xs top-4 text-sm peer-focus:top-2'}`}>
                                Food Category <span className="text-stone-300 font-normal">*</span>
                            </label>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-400 group-hover:text-emerald-600 transition-colors">▾</div>
                            {errors.type && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-1 font-medium">{errors.type.message}</p>}
                            {type && !errors.type && <div className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500 animate-fade-in scale-110">✓</div>}

                            <div className={`overflow-hidden transition-all duration-300 ${focusedField === 'type' ? 'max-h-10 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                <p className="text-xs text-stone-500 italic ml-1">Select the broad category of your donation.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8 pt-2">
                            <div className="relative group">
                                <input
                                    id="quantity"
                                    type="number"
                                    step="any"
                                    placeholder=" "
                                    aria-label="Quantity"
                                    onFocus={() => setFocusedField('quantity')}
                                    onBlur={() => setFocusedField(null)}
                                    {...register('quantity', {
                                        required: 'Quantity is required',
                                        min: { value: 0.1, message: 'Quantity must be > 0' }
                                    })}
                                    className={`peer block w-full rounded-xl border px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${errors.quantity ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-stone-200 focus:border-emerald-500 hover:border-stone-300'}`}
                                />
                                <label htmlFor="quantity" className={`absolute left-4 top-4 z-10 origin-[0] -translate-y-2 scale-75 transform text-sm duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2 peer-focus:scale-75 pointer-events-none font-medium ${errors.quantity ? 'text-red-500' : 'text-stone-500 peer-focus:text-emerald-600'}`}>
                                    Amount <span className="text-stone-300 font-normal">*</span>
                                </label>
                                {errors.quantity && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-1 font-medium">{errors.quantity.message}</p>}
                                <div className={`overflow-hidden transition-all duration-300 ${focusedField === 'quantity' ? 'max-h-10 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-xs text-stone-500 italic ml-1">Approximate total amount being donated.</p>
                                </div>
                            </div>

                            <div className="relative group">
                                <select
                                    id="unit"
                                    aria-label="Unit"
                                    onFocus={() => setFocusedField('unit')}
                                    onBlur={() => setFocusedField(null)}
                                    {...register('unit', { required: 'Unit is required' })}
                                    className={`peer block w-full rounded-xl border appearance-none px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${errors.unit ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-stone-200 focus:border-emerald-500 hover:border-stone-300'}`}
                                >
                                    <option value="" disabled hidden></option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="portions">Portions/Plates</option>
                                    <option value="boxes">Boxes/Packets</option>
                                    <option value="liters">Liters</option>
                                </select>
                                <label htmlFor="unit" className={`absolute left-4 top-2 text-xs font-medium transition-all pointer-events-none ${errors.unit ? 'text-red-500' : 'text-stone-500 peer-focus:text-emerald-600'} ${!unit && 'top-4 text-sm peer-focus:top-2 peer-focus:text-xs'}`}>
                                    Measurement <span className="text-stone-300 font-normal">*</span>
                                </label>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-400 group-hover:text-emerald-600 transition-colors">▾</div>
                                {errors.unit && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-1 font-medium">{errors.unit.message}</p>}
                            </div>
                        </div>

                        <div className="relative mt-8 pt-4">
                            <textarea
                                id="description"
                                rows="2"
                                placeholder=" "
                                aria-label="Description"
                                onFocus={() => setFocusedField('description')}
                                onBlur={() => setFocusedField(null)}
                                {...register('description', {
                                    required: 'Description is required',
                                    minLength: { value: 3, message: 'Min 3 characters' }
                                })}
                                className={`peer block w-full rounded-xl border px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none ${errors.description ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-stone-200 focus:border-emerald-500 hover:border-stone-300'}`}
                            />
                            <label htmlFor="description" className={`absolute left-4 top-4 z-10 origin-[0] -translate-y-2 scale-75 transform text-sm duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2 peer-focus:scale-75 pointer-events-none font-medium ${errors.description ? 'text-red-500' : 'text-stone-500 peer-focus:text-emerald-600'}`}>
                                What's in the donation? <span className="text-stone-300 font-normal">*</span>
                            </label>
                            {errors.description && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-1 font-medium">{errors.description.message}</p>}

                            <div className={`overflow-hidden transition-all duration-300 ${focusedField === 'description' ? 'max-h-10 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                <p className="text-xs text-stone-500 italic ml-1">E.g., "Mixed vegetable curry and steamed rice"</p>
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION 2: Expiry & Location --- */}
                    <div id="step-2" ref={step2Ref} className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition-shadow scroll-mt-36">
                        <h2 className="text-base font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-stone-100 pb-3">
                            <span className="text-xl">⏳</span> Expiry & Location
                        </h2>

                        <div className="relative group">
                            <input
                                id="expiresAt"
                                type="datetime-local"
                                placeholder=" "
                                aria-label="Expires At"
                                onFocus={() => setFocusedField('expiresAt')}
                                onBlur={() => setFocusedField(null)}
                                {...register('expiresAt', { required: 'Expiration time is required' })}
                                className={`peer block w-full md:w-2/3 rounded-xl border px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${errors.expiresAt ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-stone-200 focus:border-emerald-500 hover:border-stone-300'}`}
                            />
                            <label htmlFor="expiresAt" className={`absolute left-4 top-2 text-xs font-medium transition-all pointer-events-none ${errors.expiresAt ? 'text-red-500' : 'text-stone-500 peer-focus:text-emerald-600'}`}>
                                Best Before Deadline <span className="text-stone-300 font-normal">*</span>
                            </label>
                            {errors.expiresAt && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-1 font-medium">{errors.expiresAt.message}</p>}
                            <div className={`overflow-hidden transition-all duration-300 ${focusedField === 'expiresAt' ? 'max-h-10 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                <p className="text-xs text-stone-500 italic ml-1">The listing will automatically be hidden after this time.</p>
                            </div>
                        </div>

                        <div className="pt-8">
                            <label id="lat" tabIndex="-1" className="block text-sm font-semibold text-stone-700 mb-3 ml-1 focus:outline-none focus:text-emerald-600 transition-colors">
                                Pickup Coordinates <span className="text-stone-300 font-normal">*</span>
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    aria-label="Use Current Location"
                                    onClick={handleUseCurrentLocation}
                                    disabled={isLocating}
                                    className="flex-1 py-3.5 text-sm font-bold border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-emerald-700 hover:border-emerald-200 shadow-sm transition-all focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500"
                                >
                                    {isLocating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                            Locating...
                                        </span>
                                    ) : '📍 Device GPS'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    aria-label="Choose on Map"
                                    onClick={() => setIsMapOpen(true)}
                                    className="flex-1 py-3.5 text-sm font-bold border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-amber-200 hover:text-amber-700 shadow-sm transition-all focus:ring-2 focus:ring-offset-1 focus:ring-amber-500"
                                >
                                    🗺️ Interactive Map
                                </Button>
                            </div>

                            <input type="hidden" {...register('lat', { required: 'Please bind a pickup location' })} />
                            <input type="hidden" {...register('lng')} />
                            {errors.lat && <p className="text-red-500 font-medium text-xs mt-2 ml-1 animate-fade-in">⚠️ {errors.lat.message}</p>}

                            {selectedAddress && (
                                <div className="mt-4 bg-emerald-50/50 p-4 rounded-xl flex items-start gap-3 border border-emerald-100 transition-all text-sm shadow-inner animate-fade-in">
                                    <span className="text-xl mt-0.5 text-emerald-600">✓</span>
                                    <div>
                                        <p className="font-bold text-stone-900 mb-0.5 text-[10px] uppercase tracking-widest text-emerald-800">Verified Binding</p>
                                        <p className="text-stone-700 leading-relaxed font-medium">{selectedAddress}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- SECTION 3: Contact Info --- */}
                    <div id="step-3" ref={step3Ref} className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition-shadow scroll-mt-36">
                        <h2 className="text-base font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-stone-100 pb-3">
                            <span className="text-xl">📞</span> Contact Identity
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative group">
                                <input
                                    id="donorName"
                                    placeholder=" "
                                    aria-label="Name"
                                    {...register('donorName', { required: 'Name is required' })}
                                    className={`peer block w-full rounded-xl border px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${errors.donorName ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-stone-200 focus:border-emerald-500 hover:border-stone-300'}`}
                                />
                                <label htmlFor="donorName" className={`absolute left-4 top-4 z-10 origin-[0] -translate-y-2 scale-75 transform text-sm duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2 peer-focus:scale-75 pointer-events-none font-medium ${errors.donorName ? 'text-red-500' : 'text-stone-500 peer-focus:text-emerald-600'}`}>
                                    Lister Name <span className="text-stone-300 font-normal">*</span>
                                </label>
                                {errors.donorName && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-1 font-medium">{errors.donorName.message}</p>}
                            </div>

                            <div className="relative group">
                                <input
                                    id="donorContact"
                                    type="tel"
                                    placeholder=" "
                                    aria-label="Phone Number"
                                    {...register('donorContact', {
                                        required: 'Phone number is required',
                                        pattern: { value: /^[0-9+\-\s()]+$/, message: 'Invalid phone format' }
                                    })}
                                    className={`peer block w-full rounded-xl border px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${errors.donorContact ? 'border-red-300 focus:border-red-500 bg-red-50/30' : 'border-stone-200 focus:border-emerald-500 hover:border-stone-300'}`}
                                />
                                <label htmlFor="donorContact" className={`absolute left-4 top-4 z-10 origin-[0] -translate-y-2 scale-75 transform text-sm duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2 peer-focus:scale-75 pointer-events-none font-medium ${errors.donorContact ? 'text-red-500' : 'text-stone-500 peer-focus:text-emerald-600'}`}>
                                    Direct Phone <span className="text-stone-300 font-normal">*</span>
                                </label>
                                {errors.donorContact && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-1 font-medium">{errors.donorContact.message}</p>}
                            </div>
                        </div>

                        <div className="relative mt-8 pt-4">
                            <input
                                id="donorEmail"
                                type="email"
                                placeholder=" "
                                aria-label="Email Address"
                                {...register('donorEmail', {
                                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' }
                                })}
                                className={`peer block w-full md:w-1/2 rounded-xl border px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${errors.donorEmail ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-emerald-500 hover:border-stone-300'}`}
                            />
                            <label htmlFor="donorEmail" className={`absolute left-4 top-4 z-10 origin-[0] -translate-y-2 scale-75 transform text-sm duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2 peer-focus:scale-75 pointer-events-none font-medium ${errors.donorEmail ? 'text-red-500' : 'text-stone-500 peer-focus:text-emerald-600'}`}>
                                Communication Email <span className="text-stone-400 font-normal opacity-60">(Optional)</span>
                            </label>
                            {errors.donorEmail && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-1 font-medium">{errors.donorEmail.message}</p>}
                        </div>

                        <div className="relative mt-8 pt-4">
                            <textarea
                                id="notes"
                                rows="2"
                                placeholder=" "
                                aria-label="Additional Notes"
                                {...register('notes')}
                                className="peer block w-full rounded-xl border px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all border-stone-200 resize-none hover:border-stone-300"
                            />
                            <label htmlFor="notes" className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2 scale-75 transform text-sm duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2 peer-focus:scale-75 pointer-events-none font-medium text-stone-500 peer-focus:text-emerald-600">
                                Rider / Access Instructions <span className="text-stone-400 font-normal opacity-60">(Optional)</span>
                            </label>
                        </div>
                    </div>

                    {/* --- IMPACT PREVIEW --- */}
                    {impact && (
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-6 border border-emerald-200 shadow-[0_4px_20px_-5px_rgba(16,185,129,0.2)] transition-all duration-700 animate-fade-in hover:scale-[1.01] hover:shadow-[0_8px_30px_-5px_rgba(16,185,129,0.3)]">
                            <h4 className="text-[10px] items-center flex gap-1.5 font-extrabold text-emerald-800 uppercase tracking-[0.2em] mb-4 opacity-80">
                                <span className="animate-pulse">🟢</span> Live Impact Forecast
                            </h4>
                            <div className="flex flex-col sm:flex-row gap-5 sm:items-center justify-around">
                                <div className="flex items-center gap-4 bg-white/60 p-3 rounded-xl shadow-sm w-full">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-md">🥡</div>
                                    <div>
                                        <p className="text-emerald-900/60 text-xs font-bold uppercase tracking-wider">Provides</p>
                                        <p className="text-emerald-950 font-black text-2xl truncate"><span className="text-emerald-600">{impact.meals}</span> meals</p>
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-12 bg-emerald-200/60"></div>
                                <div className="flex items-center gap-4 bg-white/60 p-3 rounded-xl shadow-sm w-full">
                                    <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md">🌍</div>
                                    <div>
                                        <p className="text-emerald-900/60 text-xs font-bold uppercase tracking-wider">Carbon Offset</p>
                                        <p className="text-emerald-950 font-black text-2xl truncate"><span className="text-amber-600">{impact.co2}kg</span> CO2e</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- CTA STICKY BAR --- */}
                    {/* Fixed to bottom of viewport uniformly on mobile, sticky on desktop */}
                    <div className="fixed sm:absolute bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto sm:w-full z-40 bg-white/95 sm:bg-transparent backdrop-blur-xl sm:backdrop-blur-none p-4 sm:p-0 border-t border-stone-200 sm:border-none shadow-[0_-10px_30px_rgba(0,0,0,0.05)] sm:shadow-none">
                        <button
                            type="submit"
                            aria-label="Publish Live Donation"
                            disabled={loading}
                            className={`w-full max-w-2xl mx-auto sm:w-full py-4 sm:py-5 text-base sm:text-[15px] tracking-wide font-extrabold rounded-2xl sm:rounded-xl shadow-[0_6px_20px_0_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3 relative overflow-hidden group focus:outline-none focus:ring-4 focus:ring-emerald-500/50 ${loading ? 'bg-emerald-400 text-white cursor-not-allowed shadow-none' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-[0_8px_30px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-md'}`}
                        >
                            {/* Hover highlight effect */}
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>

                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Transmitting to ResQMeal Engine...</span>
                                </>
                            ) : (
                                <>
                                    <span>🚀</span>
                                    <span>Publish into the Grid</span>
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>

            <Suspense fallback={<div className="fixed inset-0 z-50 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>
                {isMapOpen && (
                    <MapPickerModal
                        isOpen={isMapOpen}
                        onClose={() => setIsMapOpen(false)}
                        onConfirm={handleMapConfirm}
                        initialPosition={lat && watch('lng') ? [lat, watch('lng')] : null}
                    />
                )}
            </Suspense>

            {/* Login Required Modal */}
            <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
                <div className="p-8 text-center space-y-5">
                    <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl">
                        🔒
                    </div>
                    <h3 className="text-xl font-bold text-stone-900 tracking-tight">
                        Login Required to Donate Food
                    </h3>
                    <p className="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
                        Please sign in to your account before submitting a donation. Your form data will be preserved.
                    </p>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowLoginModal(false)}
                            className="flex-1 py-3 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all focus:outline-none focus:ring-2 focus:ring-stone-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                            Login →
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AddFoodPage;

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { assignmentAPI } from '../../api';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ScoreVisualization from '../../components/ScoreVisualization';

// ---------------------------------------------------------------------------
// AssignmentCountdown — real-time MM:SS countdown for pending assignments
// ---------------------------------------------------------------------------
function AssignmentCountdown({ expiresAt, onExpire }) {
    const [remaining, setRemaining] = useState(() =>
        Math.max(0, new Date(expiresAt) - Date.now())
    );
    const alertPlayedRef = useRef(false);
    const expiredRef = useRef(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            const ms = Math.max(0, new Date(expiresAt) - Date.now());
            setRemaining(ms);

            // Play alert exactly once when dropping below 10 seconds
            if (ms < 10000 && !alertPlayedRef.current) {
                alertPlayedRef.current = true;
                try {
                    const audio = new Audio('/alert.mp3');
                    audio.play().catch(() => { });
                } catch (_) { }
            }

            // Trigger expiry callback exactly once, with a 2s delay to let backend settle
            if (ms <= 0 && !expiredRef.current) {
                expiredRef.current = true;
                clearInterval(intervalRef.current);
                setTimeout(() => {
                    onExpire && onExpire();
                }, 2000);
            }
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [expiresAt, onExpire]);

    if (remaining <= 0) {
        return (
            <span className="font-mono text-sm font-bold text-red-600 tracking-widest">
                Expired
            </span>
        );
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    const isUrgent = remaining < 30000;   // < 30 s
    const isCritical = remaining < 10000; // < 10 s

    const colorClass = isCritical
        ? 'text-red-700 animate-pulse'
        : isUrgent
            ? 'text-red-500'
            : 'text-green-700';

    return (
        <span className={`font-mono text-sm font-bold tracking-widest ${colorClass}`}>
            {minutes}:{seconds}
        </span>
    );
}

// Derive border style for the whole card based on remaining time
function useCardUrgency(expiresAt, isPending) {
    const [remaining, setRemaining] = useState(() =>
        isPending ? Math.max(0, new Date(expiresAt) - Date.now()) : Infinity
    );

    useEffect(() => {
        if (!isPending || !expiresAt) return;
        const id = setInterval(() => {
            setRemaining(Math.max(0, new Date(expiresAt) - Date.now()));
        }, 1000);
        return () => clearInterval(id);
    }, [expiresAt, isPending]);

    if (!isPending) return '';
    if (remaining < 10000) return 'border-red-500 ring-2 ring-red-400/60 animate-pulse';
    if (remaining < 30000) return 'border-red-300 ring-1 ring-red-300/50';
    return '';
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const NGOAssignmentsPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [expandedAssignment, setExpandedAssignment] = useState(null);

    const isAutoRefresh = useRef(false);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const response = await assignmentAPI.getMyAssignments();
            setAssignments(response.assignments || []);
        } catch (error) {
            if (isAutoRefresh.current) {
                // Silent retry once after 1 second — no toast
                await new Promise((resolve) => setTimeout(resolve, 1000));
                try {
                    const retryResponse = await assignmentAPI.getMyAssignments();
                    setAssignments(retryResponse.assignments || []);
                } catch (_) {
                    // Silent failure — do not show toast during auto-expire refresh
                } finally {
                    isAutoRefresh.current = false;
                }
            } else {
                console.error('Fetch assignments error:', error);
                toast.error(error.response?.data?.message || error.message || 'Failed to load assignments');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    const handleRefresh = () => {
        isAutoRefresh.current = true;
        fetchAssignments();
    };

    const handleStatusUpdate = async (assignmentId, status) => {
        try {
            setActionLoading((prev) => ({ ...prev, [assignmentId]: true }));
            await assignmentAPI.updateStatus(assignmentId, status);
            toast.success(`Assignment ${status} successfully`);
            await fetchAssignments();
        } catch (error) {
            console.error('Update assignment error:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to update assignment');
        } finally {
            setActionLoading((prev) => ({ ...prev, [assignmentId]: false }));
        }
    };

    const toggleAnalysis = (id) => {
        setExpandedAssignment(expandedAssignment === id ? null : id);
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: 'badge badge-warning',
            accepted: 'badge badge-info',
            rejected: 'badge badge-error',
            completed: 'badge badge-success',
            expired: 'badge badge-error',
        };
        return <span className={statusMap[status] || 'badge'}>{status || 'unknown'}</span>;
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
                    <h1 className="text-4xl font-bold text-neutral-900 mb-2">My Pickups</h1>
                    <p className="text-neutral-600">
                        Manage your food pickup assignments
                    </p>
                </div>

                {assignments.length === 0 ? (
                    <div className="card text-center py-16 border-2 border-dashed border-neutral-200">
                        <div className="text-7xl mb-6">No assignments</div>
                        <h3 className="text-2xl font-bold text-neutral-800 mb-3">
                            No active assignments
                        </h3>
                        <p className="text-neutral-500 mb-8 max-w-md mx-auto">
                            You currently have no assignments. Check the feed for available updates.
                        </p>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/ngo/feed')}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 px-8"
                        >
                            Go to Feed
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {assignments.map((assignment) => (
                            <AssignmentCard
                                key={assignment._id}
                                assignment={assignment}
                                expandedAssignment={expandedAssignment}
                                actionLoading={actionLoading}
                                onToggleAnalysis={toggleAnalysis}
                                onStatusUpdate={handleStatusUpdate}
                                onRefresh={handleRefresh}
                                getStatusBadge={getStatusBadge}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// LifecycleTimeline — horizontal progress tracker showing assignment stages
// ---------------------------------------------------------------------------
const LIFECYCLE_STAGES = [
    { key: 'created', label: 'Created', getDate: (a) => a.createdAt },
    { key: 'assigned', label: 'Assigned', getDate: (a) => a.lifecycle?.assignedAt || a.assignedAt },
    { key: 'accepted', label: 'Accepted', getDate: (a) => a.lifecycle?.acceptedAt },
    { key: 'completed', label: 'Done', getDate: (a) => a.lifecycle?.completedAt || a.completedAt },
];

function LifecycleTimeline({ assignment }) {
    return (
        <div className="mb-6 px-1">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Pickup Lifecycle</p>
            <div className="flex items-start">
                {LIFECYCLE_STAGES.map((stage, i) => {
                    const date = stage.getDate(assignment);
                    const done = !!date;
                    const isLast = i === LIFECYCLE_STAGES.length - 1;
                    return (
                        <div key={stage.key} className="flex flex-1 flex-col items-center">
                            <div className="flex items-center w-full">
                                {/* Circle */}
                                <div
                                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${done
                                        ? 'bg-green-500 text-white'
                                        : 'bg-neutral-200 text-neutral-400'
                                        }`}
                                >
                                    {done ? '✓' : i + 1}
                                </div>
                                {/* Connector line */}
                                {!isLast && (
                                    <div
                                        className={`flex-1 h-0.5 ${done ? 'bg-green-400' : 'bg-neutral-200'
                                            }`}
                                    />
                                )}
                            </div>
                            {/* Label + timestamp */}
                            <div className="mt-1.5 text-center">
                                <p className={`text-xs font-semibold ${done ? 'text-green-700' : 'text-neutral-400'
                                    }`}>
                                    {stage.label}
                                </p>
                                {date && (
                                    <p className="text-[10px] text-neutral-400 mt-0.5">
                                        {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// AssignmentCard — split out so the useCardUrgency hook is per-card
// ---------------------------------------------------------------------------
function AssignmentCard({
    assignment,
    expandedAssignment,
    actionLoading,
    onToggleAnalysis,
    onStatusUpdate,
    onRefresh,
    getStatusBadge,
}) {
    const isPending = assignment.status === 'pending';
    const isAccepted = assignment.status === 'accepted';
    const urgencyClass = useCardUrgency(assignment.expiresAt, isPending);
    // [HARDENING] toast is needed for geolocation error feedback inside this card
    const toast = useToast();

    const [isTracking, setIsTracking] = useState(false);
    const watcherRef = useRef(null);
    const lastSentRef = useRef(0);
    const THROTTLE_MS = 10000; // send at most once every 10 seconds

    const stopTracking = () => {
        // [HARDENING] Clear watcher and reset state — safe to call multiple times
        if (watcherRef.current != null) {
            navigator.geolocation.clearWatch(watcherRef.current);
            watcherRef.current = null;
        }
        setIsTracking(false);
    };

    const startTracking = () => {
        // [HARDENING] Geolocation API availability check
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser.');
            return;
        }
        // [HARDENING] Duplicate tracker guard — prevent stacking multiple watchers
        if (watcherRef.current != null) return;

        setIsTracking(true);
        watcherRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const now = Date.now();
                if (now - lastSentRef.current < THROTTLE_MS) return;
                lastSentRef.current = now;
                assignmentAPI.updateLocation(
                    assignment._id,
                    pos.coords.latitude,
                    pos.coords.longitude
                ).catch((err) => {
                    // [HARDENING] Stop tracking if backend rejects (e.g., completed assignment)
                    const status = err?.response?.status;
                    console.warn('[tracking] location update rejected:', status, err?.response?.data?.message);
                    if (status === 409 || status === 403 || status === 404) {
                        stopTracking();
                        toast.error('Location tracking stopped — assignment may have changed.');
                    }
                });
            },
            (geoError) => {
                // [HARDENING] Geolocation permission denied or unavailable — stop cleanly
                console.warn('[tracking] geolocation error:', geoError.message);
                stopTracking();
                toast.error('Location access denied or unavailable. Tracking stopped.');
            },
            { enableHighAccuracy: true, maximumAge: 5000 }
        );
    };

    // [HARDENING] Stop watcher automatically when status leaves 'accepted'
    useEffect(() => {
        if (!isAccepted) stopTracking();
    }, [isAccepted]);

    // [HARDENING] Stop watcher on component unmount (navigation away)
    useEffect(() => {
        return () => stopTracking();
    }, []);

    return (
        <div
            className={`relative card group hover:shadow-lg transition-all border ${urgencyClass || 'border-neutral-100/50'}`}
        >
            {/* Live pickup badge — only shown when geolocation tracking is active */}
            {isTracking && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm animate-pulse z-10">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    LIVE PICKUP IN PROGRESS
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-neutral-50 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-neutral-900 leading-tight">
                        {assignment.food?.description || 'Food Item'}
                    </h3>
                    <p className="text-sm text-neutral-500 font-medium">
                        Assigned {formatDistanceToNow(new Date(assignment.assignedAt), { addSuffix: true })}
                    </p>
                </div>
                {getStatusBadge(assignment.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-neutral-50 p-4 rounded-xl">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Details</p>
                    <div className="flex items-center gap-3 text-neutral-700">
                        <span className="font-medium text-lg">
                            {assignment.food?.quantity || 0} {assignment.food?.unit || ''} ({assignment.food?.type || 'n/a'})
                        </span>
                    </div>
                </div>

                <div className="bg-neutral-50 p-4 rounded-xl">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                        {isPending ? 'Decision Deadline' : 'Expires'}
                    </p>
                    <div className="flex items-center gap-3 text-neutral-700">
                        {isPending && assignment.expiresAt ? (
                            <AssignmentCountdown
                                expiresAt={assignment.expiresAt}
                                onExpire={onRefresh}
                            />
                        ) : (
                            <span className="font-medium">
                                {assignment.food?.expiresAt
                                    ? formatDistanceToNow(new Date(assignment.food.expiresAt), { addSuffix: true })
                                    : 'N/A'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {expandedAssignment === assignment._id && (
                <div className="mb-6">
                    <ScoreVisualization assignment={assignment} />
                </div>
            )}

            {/* Lifecycle Timeline */}
            <LifecycleTimeline assignment={assignment} />

            {/* Donor Contact Details */}
            {assignment.food?.donor && (
                <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Donor Contact</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-neutral-700 mb-4">
                        {assignment.food.donor.name && (
                            <div className="flex items-center gap-2">
                                <span className="text-blue-400">👤</span>
                                <span className="font-medium">{assignment.food.donor.name}</span>
                            </div>
                        )}
                        {assignment.food.donor.email && (
                            <div className="flex items-center gap-2">
                                <span className="text-blue-400">✉️</span>
                                <a href={`mailto:${assignment.food.donor.email}`} className="text-blue-600 hover:underline">
                                    {assignment.food.donor.email}
                                </a>
                            </div>
                        )}
                        {assignment.food.donor.contact && (
                            <div className="flex items-center gap-2">
                                <span className="text-blue-400">📞</span>
                                <span>{assignment.food.donor.contact}</span>
                            </div>
                        )}
                        {assignment.food.lat != null && assignment.food.lng != null && (
                            <div className="flex items-center gap-2">
                                <span className="text-blue-400">📍</span>
                                <span className="text-neutral-500 text-xs">{assignment.food.lat.toFixed(4)}, {assignment.food.lng.toFixed(4)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {assignment.food.donor.contact && (
                            <a
                                href={`tel:${assignment.food.donor.contact}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                            >
                                📞 Call Donor
                            </a>
                        )}
                        {assignment.food.lat != null && assignment.food.lng != null && (
                            <a
                                href={`https://www.google.com/maps?q=${assignment.food.lat},${assignment.food.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                🗺️ Open in Maps
                            </a>
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-3 justify-end border-t border-neutral-100 pt-6">
                <Button
                    size="sm"
                    variant="outline"
                    className="text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    onClick={() => onToggleAnalysis(assignment._id)}
                >
                    {expandedAssignment === assignment._id ? 'Hide Analysis' : 'View AI Analysis'}
                </Button>

                {isPending && (
                    <>
                        <Button
                            size="sm"
                            variant="primary"
                            loading={actionLoading[assignment._id]}
                            onClick={() => onStatusUpdate(assignment._id, 'accepted')}
                        >
                            Accept
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            loading={actionLoading[assignment._id]}
                            onClick={() => onStatusUpdate(assignment._id, 'rejected')}
                        >
                            Reject
                        </Button>
                    </>
                )}

                {isAccepted && (
                    <>
                        {!isTracking ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-green-700 border-green-300 hover:bg-green-50 font-semibold"
                                onClick={startTracking}
                            >
                                📍 Start Pickup
                            </Button>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Tracking Live
                            </span>
                        )}
                        <Button
                            size="sm"
                            variant="primary"
                            loading={actionLoading[assignment._id]}
                            onClick={() => {
                                stopTracking();
                                onStatusUpdate(assignment._id, 'completed');
                            }}
                        >
                            Mark as Completed
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

export default NGOAssignmentsPage;

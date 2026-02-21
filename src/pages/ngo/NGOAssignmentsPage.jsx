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
    const urgencyClass = useCardUrgency(assignment.expiresAt, isPending);

    return (
        <div
            className={`card group hover:shadow-lg transition-all border ${urgencyClass || 'border-neutral-100/50'
                }`}
        >
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

                {assignment.status === 'accepted' && (
                    <Button
                        size="sm"
                        variant="primary"
                        loading={actionLoading[assignment._id]}
                        onClick={() => onStatusUpdate(assignment._id, 'completed')}
                    >
                        Mark as Completed
                    </Button>
                )}
            </div>
        </div>
    );
}

export default NGOAssignmentsPage;

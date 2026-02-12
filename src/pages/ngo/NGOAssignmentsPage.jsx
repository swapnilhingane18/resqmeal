import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { assignmentAPI } from '../../api';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ScoreVisualization from '../../components/ScoreVisualization';

const NGOAssignmentsPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [expandedAssignment, setExpandedAssignment] = useState(null);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const response = await assignmentAPI.getMyAssignments();
            setAssignments(response.assignments || []);
        } catch (error) {
            console.error('Fetch assignments error:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

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
                            <div key={assignment._id} className="card group hover:shadow-lg transition-all border border-neutral-100/50">
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
                                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Expires</p>
                                        <div className="flex items-center gap-3 text-neutral-700">
                                            <span className="font-medium">
                                                {assignment.food?.expiresAt
                                                    ? formatDistanceToNow(new Date(assignment.food.expiresAt), { addSuffix: true })
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {expandedAssignment === assignment._id && (
                                    <div className="mb-6">
                                        <ScoreVisualization assignment={assignment} />
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3 justify-end border-t border-neutral-100 pt-6">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                                        onClick={() => toggleAnalysis(assignment._id)}
                                    >
                                        {expandedAssignment === assignment._id ? 'Hide Analysis' : 'View AI Analysis'}
                                    </Button>

                                    {assignment.status === 'pending' && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                loading={actionLoading[assignment._id]}
                                                onClick={() => handleStatusUpdate(assignment._id, 'accepted')}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                loading={actionLoading[assignment._id]}
                                                onClick={() => handleStatusUpdate(assignment._id, 'rejected')}
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
                                            onClick={() => handleStatusUpdate(assignment._id, 'completed')}
                                        >
                                            Mark as Completed
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NGOAssignmentsPage;

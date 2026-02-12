import ScoreVisualization from '../../components/ScoreVisualization';

const NGOAssignmentsPage = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [expandedAssignment, setExpandedAssignment] = useState(null);
    const toast = useToast();

    // ... existing fetchAssignments ...

    const toggleAnalysis = (id) => {
        setExpandedAssignment(expandedAssignment === id ? null : id);
    };

    // ... existing useEffect and handleStatusUpdate ...

    // ... existing getStatusBadge ...

    // ... existing loading check ...

    return (
        <div className="min-h-screen bg-neutral-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-neutral-900 mb-2">
                        📋 My Pickups
                    </h1>
                    <p className="text-neutral-600">
                        Manage your accepted food pickup assignments
                    </p>
                </div>

                {assignments.length === 0 ? (
                    // ... existing empty state ...
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-2xl font-semibold text-neutral-700 mb-2">
                            No active assignments
                        </h3>
                        <p className="text-neutral-500 mb-6">
                            You haven't accepted any pickups yet.
                        </p>
                        <Button
                            variant="primary"
                            onClick={() => window.location.href = '/ngo/feed'}
                        >
                            Browse Available Food
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {assignments.map((assignment) => (
                            <div key={assignment._id} className="card hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-neutral-900">
                                            {assignment.food?.description || 'Food Item'}
                                        </h3>
                                        <p className="text-sm text-neutral-500">
                                            Assigned {formatDistanceToNow(new Date(assignment.assignedAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {getStatusBadge(assignment.status)}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {assignment.food && (
                                        <div className="flex items-center gap-2 text-neutral-700">
                                            <span className="text-xl">🍽️</span>
                                            <span>
                                                <strong>{assignment.food.quantity}</strong> {assignment.food.unit} ({assignment.food.type})
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-neutral-700">
                                        <span className="text-xl">📍</span>
                                        <span>
                                            Pickup Location
                                        </span>
                                    </div>
                                </div>

                                {/* Score Visualization Toggle */}
                                {expandedAssignment === assignment._id && (
                                    <div className="mb-4 animate-fadeIn">
                                        <ScoreVisualization assignment={assignment} />
                                    </div>
                                )}

                                <div className="flex gap-3 justify-end border-t pt-4">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => toggleAnalysis(assignment._id)}
                                    >
                                        {expandedAssignment === assignment._id ? 'Hide Analysis' : 'View AI Analysis'}
                                    </Button>

                                    {['assigned', 'accepted'].includes(assignment.status) && (
                                        <Button
                                            size="sm"
                                            variant="success"
                                            className="bg-green-600 hover:bg-green-700 text-white"
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

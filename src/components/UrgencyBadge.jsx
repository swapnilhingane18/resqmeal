
const UrgencyBadge = ({ level, autoTriggered }) => {
    const getStyle = () => {
        switch (level) {
            case "EMERGENCY":
                return "bg-red-900 text-red-100 border-red-700 animate-pulse";
            case "CRITICAL":
                return "bg-red-600 text-white border-red-500";
            case "HIGH":
                return "bg-orange-500 text-white border-orange-400";
            case "WATCH":
                return "bg-yellow-400 text-yellow-900 border-yellow-300";
            case "STABLE":
                return "bg-green-600 text-white border-green-500";
            default:
                return "bg-gray-500 text-white";
        }
    };

    return (
        <div className="flex flex-col gap-1 items-end">
            {autoTriggered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm animate-bounce">
                    ⚡ Auto-Rescued
                </span>
            )}
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-sm ${getStyle()}`}
            >
                {level}
            </span>
        </div>
    );
};

export default UrgencyBadge;

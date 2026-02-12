import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="text-9xl mb-6">🔍</div>
                <h1 className="text-6xl font-bold text-neutral-900 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-neutral-700 mb-4">
                    Page Not Found
                </h2>
                <p className="text-neutral-600 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={() => navigate(-1)} variant="outline">
                        Go Back
                    </Button>
                    <Button onClick={() => navigate('/')} variant="primary">
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;

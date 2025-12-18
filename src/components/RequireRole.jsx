
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export function RequireRole({ children, role }) {
    const { user, isAuthenticated, isLoadingAuth } = useAuth();
    const location = useLocation();

    if (isLoadingAuth) {
        return <div className="p-4 text-center">Loading permissions...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If role is required, check if user has it
    // Assuming hierarchy: admin > vendor > user
    // Or simple strict equality. Let's start with strict equality for safety.

    if (role && user?.role !== role) {
        // If asking for 'vendor' but user is 'admin', maybe allow? 
        // For now, let's keep it strict: strict role match, 
        // OR explicitly allow admins to access everything if we want.

        // Allow admin to access everything
        if (user?.role === 'admin') {
            return children;
        }

        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
                <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
                <p className="text-sm text-gray-400 mt-1">Required: {role}, Current: {user?.role || 'none'}</p>
            </div>
        );
    }

    return children;
}

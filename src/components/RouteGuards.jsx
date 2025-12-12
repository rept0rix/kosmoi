
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedAdminRoute = () => {
    const { user, isLoadingAuth } = useAuth();
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const location = useLocation();

    if (isLoadingAuth) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    // STRICT: Only allow access if user exists AND email matches the ENV variable
    // Allow bypass in DEV mode for easier testing
    if (import.meta.env.DEV) {
        return <Outlet />;
    }

    if (!user || !adminEmail || user.email !== adminEmail) {
        console.warn(`Unauthorized Admin Access Attempt by: ${user?.email || 'Guest'}`);
        // Redirect to 404 to hide existence, or home
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export const ProtectedUserRoute = () => {
    const { user, isLoadingAuth } = useAuth();
    const location = useLocation();

    if (isLoadingAuth) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!user) {
        // Redirect to login, saving the location they tried to access
        // Ideally this should trigger the Auth Modal, but detailed redirect logic 
        // depends on your auth system. For now, we redirect to home or login page.
        // If you have a specific /login route, use it. Otherwise, home.
        return <Navigate to="/" state={{ from: location, authTrigger: true }} replace />;
    }

    return <Outlet />;
};

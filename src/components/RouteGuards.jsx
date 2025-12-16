
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
        // Redirect to login if not logged in, or home if logged in but not admin
        if (!user) {
            const returnUrl = encodeURIComponent(location.pathname + location.search);
            return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
        }
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
        const returnUrl = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
    }

    return <Outlet />;
};

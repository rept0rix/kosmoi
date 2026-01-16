
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
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

    // RBAC: Role-Based Access Control
    // Allow access if the user has the 'admin' role in the database.
    // This allows for multiple admins to be managed dynamically.
    const hasAdminRole = user?.role === 'admin' || user?.user_metadata?.role === 'admin';

    if (!user || !hasAdminRole) {
        console.warn(`Unauthorized Admin Access Attempt by: ${user?.email || 'Guest'} (Role: ${user?.role})`);

        // Redirect logic
        if (!user) {
            const returnUrl = encodeURIComponent(location.pathname + location.search);
            return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
        }

        // Logged in but not admin -> home
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '@/api/supabaseClient';
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle } from 'lucide-react';

export default function UpdatePassword() {
    const navigate = useNavigate();
    const location = useLocation();

    // Auth State
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Extract Access Token from URL
    useEffect(() => {
        // Supabase sends tokens as hash: #access_token=...&type=recovery
        const hash = location.hash;
        if (!hash || !hash.includes('access_token')) {
            // Wait a moment, sometimes auth context handles it
        } else {
            console.log("Recovery Token Detected");
        }
    }, [location]);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await db.auth.updateUser({ password: password });
            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            console.error("Update password failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Update Password</h1>
                    <p className="text-slate-400 text-sm">Enter your new secure password below.</p>
                </div>

                {success ? (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-200 px-4 py-6 rounded-xl text-center">
                        <p className="font-semibold text-lg">Password Updated!</p>
                        <p className="text-sm opacity-80 mt-2">Redirecting to login...</p>
                    </div>
                ) : (
                    <form onSubmit={handlePasswordUpdate} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider ml-1">New Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all rounded-xl"
                        >
                            {loading ? "Updating..." : "Set New Password"}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}

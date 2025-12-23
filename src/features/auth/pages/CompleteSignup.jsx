
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { db } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CompleteSignup() {
    const navigate = useNavigate();
    const { user, isAuthenticated, checkAppState } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, processing, creating_business, success

    // Redirect if not authenticated (should be handled by RouteGuard but extra safety)
    useEffect(() => {
        if (!isAuthenticated && !loading) {
            // Wait a bit to ensure auth loads
            const timer = setTimeout(() => {
                if (!isAuthenticated) navigate('/login');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, navigate, loading]);

    const handleSetPassword = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("סיסמאות לא תואמות");
            return;
        }

        if (password.length < 6) {
            setError("הסיסמה חייבת להכיל לפחות 6 תווים");
            return;
        }

        setLoading(true);
        setStatus('processing');

        try {
            // 1. Update Password
            // Note: updateMe throws error if it fails
            await db.auth.updateMe({ password });

            // 2. Create Business (from Metadata)
            setStatus('creating_business');
            const metadata = user?.user_metadata || {};

            // Check if we have business data to process
            if (metadata.business_name) {
                const { error: providerError } = await db.entities.ServiceProvider.create({
                    business_name: metadata.business_name,
                    category: metadata.category || 'Service',
                    description: metadata.description || '',
                    location: metadata.location || '',
                    owner_name: metadata.owner_name || '',
                    contact_info: metadata.contact_info || user.email,
                    created_by: user.id,
                    status: 'new_lead', // Start as new lead
                    average_rating: 0,
                    review_count: 0
                });

                if (providerError) {
                    // Normalize error: if it's a duplicate (Constraint violation), we might ignore or warn
                    console.error("Provider creation error:", providerError);
                    // If it already exists, maybe just proceed? 
                    // Let's assume critical failure for now, or maybe they already created it?
                }

                // 3. Clear pending flag (optional, but good for cleanup)
                await db.auth.updateMe({
                    data: { ...metadata, signup_step: 'complete' }
                });
            }

            setStatus('success');
            setTimeout(() => {
                navigate('/provider-dashboard'); // Or business dashboard
            }, 2000);

        } catch (err) {
            console.error("Completion error:", err);
            setError(err.message || "An error occurred during setup.");
            setStatus('idle');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans" dir="rtl">
                <div className="text-center space-y-4 animate-in fade-in zoom-in">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">החשבון הוגדר בהצלחה!</h2>
                    <p className="text-slate-500">מעביר אותך ללוח הבקרה...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans" dir="rtl">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mb-4">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">קביעת סיסמה</h1>
                    <p className="text-slate-500 mt-2">
                        ברוכים הבאים! כדי להשלים את ההרשמה, אנא בחר סיסמה לחשבון שלך.
                    </p>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">סיסמה חדשה</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="לפחות 6 תווים"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">אישור סיסמה</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="הקלד שוב את הסיסמה"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-6 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="animate-spin w-5 h-5" />
                                {status === 'creating_business' ? 'מקים את העסק שלך...' : 'שומר סיסמה...'}
                            </span>
                        ) : 'שמור והתחל'}
                    </Button>
                </form>
            </div>
        </div>
    );
}

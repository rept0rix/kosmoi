import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { db } from '@/api/supabaseClient';
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get return URL from query params
    const searchParams = new URLSearchParams(location.search);
    const returnUrl = searchParams.get('returnUrl') || '/board-room';

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await db.auth.getSession();
            if (session) {
                handleRedirect();
            }
        };
        checkSession();

        const { data: { subscription } } = db.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || session) {
                handleRedirect();
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate, returnUrl]);

    const handleRedirect = () => {
        try {
            const url = new URL(returnUrl, window.location.origin);
            if (url.origin === window.location.origin) {
                navigate(url.pathname + url.search + url.hash);
            } else {
                window.location.href = returnUrl;
            }
        } catch (e) {
            navigate(returnUrl);
        }
    };

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await db.auth.signIn({
                email,
                password
            });
            if (error) throw error;

            // Successful login will trigger onAuthStateChange
            // We can rely on that or force redirect if needed.
            // But strict redirect is safer here:
            const url = new URL(returnUrl, window.location.origin);
            if (url.origin === window.location.origin) {
                navigate(url.pathname + url.search + url.hash);
            } else {
                window.location.href = returnUrl;
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'אירעה שגיאה בהתחברות. אנא נסה שוב.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError(null);

            const currentOrigin = window.location.origin;
            const redirectUrl = `${currentOrigin}/login?returnUrl=${encodeURIComponent(returnUrl)}`;

            await db.auth.signInWithOAuth('google', {
                redirectTo: redirectUrl
            });
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'אירעה שגיאה בהתחברות. אנא נסה שוב.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
            {/* Left Side: Visual / Brand */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-purple-900/90 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=2888&auto=format&fit=crop"
                    alt="Samui Lifestyle"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
                />

                <div className="relative z-20 flex flex-col justify-between h-full p-12 text-white">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                            <span className="font-bold">K</span>
                        </div>
                        <span className="font-semibold tracking-wide uppercase text-sm opacity-80">Kosmoi Services</span>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <h1 className="text-5xl font-bold leading-tight">
                            התחבר לחוויה איים <br /> נוחה ומתקדמת.
                        </h1>
                        <p className="text-lg text-blue-100/80 font-light leading-relaxed">
                            הצטרף לאלפי תושבים ותיירים בקוסמוי שכבר חוסכים זמן וכסף עם המערכת החכמה שלנו לאיתור והזמנת שירותים.
                        </p>

                        <div className="flex flex-col gap-3 pt-4">
                            {[
                                'הזמנת שירותים בקליק אחד',
                                'ניהול יומן ומעקב אחר הזמנות',
                                'גישה לספקים מוסמכים בלבד'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm font-medium text-white/90">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-xs text-white/40">
                        © 2024 Kosmoi Services. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center lg:text-right space-y-2">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto lg:mx-0">
                            <div className="w-6 h-6 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/30" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            ברוכים השבים
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            התחבר כדי להמשיך מהיכן שעצרת
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4 pt-4">
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">דוא״ל</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    placeholder="name@company.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">סיסמה</label>
                                    <a href="#" className="text-sm text-blue-600 hover:text-blue-500">שכחת סיסמה?</a>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg transition-all rounded-xl"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'התחבר'}
                            </Button>
                        </form>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-50 dark:bg-slate-900 px-2 text-slate-500">או המשך עם</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            variant="outline"
                            className="w-full h-14 text-base font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-3 rounded-xl transition-all hover:scale-[1.01]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            )}
                            המשך באמצעות Google
                        </Button>

                        <div className="text-center">
                            <Button variant="ghost" className="text-slate-500 hover:text-slate-900 dark:hover:text-white" onClick={() => navigate('/vendor-signup')}>
                                רוצה להצטרף כספק שירות? <ArrowRight className="w-4 h-4 mr-1" />
                            </Button>
                        </div>
                    </div>

                    <p className="px-8 text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                        בלחיצה על המשך, אתה מסכים ל<Link to="/legal/terms" className="underline hover:text-slate-600 dark:hover:text-slate-300">תנאי השימוש</Link> ו<Link to="/legal/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300">מדיניות הפרטיות</Link> שלנו.
                    </p>
                </div>

                {/* Mobile Logo Overlay - Only visible on small screens */}
                <div className="lg:hidden absolute top-6 right-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <span className="font-bold text-white">K</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

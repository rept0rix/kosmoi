import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { db } from '@/api/supabaseClient';
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import translation hook

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();
    const { isAuthenticated, user, checkAppState } = useAuth(); // Use Global Auth

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [verifying, setVerifying] = useState(false);

    // Thai Street Vibes
    const BG_IMAGE = "https://images.unsplash.com/photo-1535189043414-47a3c49a0bed?q=80&w=2832&auto=format&fit=crop";

    // Get return URL
    const searchParams = new URLSearchParams(location.search);
    const returnUrl = searchParams.get('returnUrl') || '/board-room';

    // Force English/LTR
    useEffect(() => {
        if (i18n.language !== 'en') {
            i18n.changeLanguage('en');
        }
    }, [i18n]);

    const processingOAuth = React.useRef(false);

    // Handle OAuth Hash - Passive Polling Mode
    useEffect(() => {
        let isChecking = false;
        let pollInterval;

        const checkSession = async () => {
            if (isChecking) return;
            isChecking = true;

            try {
                const { data: { session } } = await db.auth.getSession();

                if (session) {
                    console.log("✅ OAuth Success: Session detected via polling!", session.user.email);

                    // Clear interval immediately
                    if (pollInterval) clearInterval(pollInterval);

                    // Provide visual feedback
                    setVerifying(false);

                    // SYNC STATE: Force triggers AuthContext to update 'isAuthenticated'
                    await checkAppState();

                    // SOFT REDIRECT: Use navigate instead of window.location.href
                    // This preserves the session in memory without reloading the page
                    // The main useEffect monitoring 'isAuthenticated' will also kick in, 
                    // but we do this here to be sure.
                    const role = session.user?.user_metadata?.role || 'user';
                    // Check strict admin role from DB if possible, but metadata is a good first hint
                    // for the immediate redirect.
                    const target = (role === 'admin' || session.user.email === 'na0ryank0@gmail.com')
                        ? '/admin/wallet'
                        : '/profile';

                    console.log(`🚀 Soft Redirecting to ${target}`);
                    navigate(target, { replace: true });

                    return true;
                }
            } catch (err) {
                console.error("Polling check failed:", err);
            } finally {
                isChecking = false;
            }
            return false;
        };

        if (location.hash && location.hash.includes('access_token')) {
            console.log("🔐 OAuth Hash Detected - Starting Passive Polling...");
            setVerifying(true);

            // Poll every 500ms
            pollInterval = setInterval(checkSession, 500);

            // Give Supabase client 1s to digest the hash before expecting session
            setTimeout(() => {
                checkSession();
            }, 1000);

            // Safety timeout: 10 seconds
            const timeoutTimer = setTimeout(() => {
                clearInterval(pollInterval);
                if (verifying) {
                    console.warn("⚠️ OAuth polling timed out.");
                    setError("Login seems slow. If you are not redirected, please refresh.");
                    setVerifying(false);
                }
            }, 10000);

            return () => {
                clearInterval(pollInterval);
                clearTimeout(timeoutTimer);
            };
        }
    }, [location.hash]);

    // 2. React to Auth Success (from Context)
    useEffect(() => {
        if (isAuthenticated && user) {
            console.log("✅ Authenticated (Global), Redirecting...");
            handleRedirect();
        }
    }, [isAuthenticated, user]);


    const handleRedirect = () => {
        try {
            console.log("Handling redirect...", { returnUrl, userRole: user?.role });

            // 1. If returnUrl is specific (not default), use it
            const isDefaultUrl = returnUrl === '/board-room' || returnUrl.includes('board-room');

            if (!isDefaultUrl) {
                const url = new URL(returnUrl, window.location.origin);
                if (url.origin === window.location.origin) {
                    navigate(url.pathname + url.search);
                } else {
                    window.location.href = returnUrl;
                }
                return;
            }

            // 2. Role-Based Routing (Default Landing)
            const role = user?.role || 'user';

            if (role === 'admin') {
                navigate('/admin/command-center');
            } else if (role === 'vendor') {
                navigate('/provider-dashboard');
            } else {
                // Regular User -> Profile (Central Hub)
                navigate('/profile');
            }

        } catch (e) {
            console.error("Redirect Error:", e);
            // Fallback
            navigate('/profile');
        }
    };

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Registration State
    const [isLogin, setIsLogin] = useState(true);
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation for Register
        if (!isLogin && password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                // LOGIN
                const { error: signInError } = await db.auth.signIn(email, password);
                if (signInError) throw signInError;

                console.log("Sign in successful, updating state...");
            } else {
                // REGISTER
                const { user: newUser, session } = await db.auth.signUp(email, password, {
                    role: 'user',
                    registered_at: new Date().toISOString()
                });

                if (!session && !newUser) {
                    // Should verify email if configured
                    alert("Registration successful! Please check your email to confirm your account.");
                    setIsLogin(true); // Switch to login
                    setLoading(false);
                    return;
                }

                console.log("Registration successful", newUser);
            }

            // Common Success Flow
            console.log("Triggering global state update...");
            checkAppState().catch(err => console.error("Background auth check failed:", err));

            // IMMEDIATE ACTION: Force redirect if session exists
            // We do not wait for the global context to update because it seems to be hanging.
            const { data: { session } } = await db.auth.getSession();

            if (session) {
                console.log("✅ Session confirmed immediately after login.");
                setLoading(false);

                // Determine target
                // If we are admin, go to admin wallet directly to verify the fix
                const role = session.user?.user_metadata?.role || 'user';
                const targetPath = role === 'admin' ? '/admin/wallet' : '/profile';

                console.log(`🚀 Forcing redirect to ${targetPath}`);
                window.location.href = targetPath;
            } else {
                console.warn("❌ Login reported success but no session found in post-check.");
                // It's possible the session needs a split second to persist?
                // Let's retry once after short delay
                setTimeout(async () => {
                    const { data: { session: retrySession } } = await db.auth.getSession();
                    if (retrySession) {
                        window.location.href = '/admin/wallet';
                    } else {
                        setError("Login succeeded but session failed to persist. Please retry.");
                        setLoading(false);
                    }
                }, 1000);
            }

        } catch (err) {
            console.error('Auth error:', err);

            // Helpful message for rate limits
            if (err.message && err.message.toLowerCase().includes('rate limit')) {
                setError("Too many attempts. Please wait a moment or try a different email.");
            } else {
                setError(err.message || (isLogin ? 'Login failed.' : 'Registration failed.'));
            }

            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError(null);

            // Ensure we redirect back correctly to process hash
            const redirectUrl = `${window.location.origin}/login`;

            await db.auth.signInWithOAuth('google', {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            });
        } catch (err) {
            console.error('Google Login error:', err);
            setError(err.message || 'Google sign-in failed. Please try again.');
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden bg-slate-900">
                <div className="text-white flex flex-col items-center gap-4 relative z-50">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-lg font-light">Completing secure sign-in...</p>
                    <button
                        onClick={() => {
                            setVerifying(false);
                            if (window.location.hash) {
                                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                            }
                        }}
                        className="mt-4 text-sm text-slate-400 hover:text-white underline"
                    >
                        Stuck? Click here to cancel
                    </button>
                    {/* Add invisible button for tests if needed */}
                </div>
            </div>
        )
    }

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        const emailToReset = email || prompt("Please enter your email address for password reset:");

        if (emailToReset) {
            setLoading(true);
            try {
                const { error } = await db.auth.resetPasswordForEmail(emailToReset, {
                    redirectTo: `${window.location.origin}/update-password`,
                });
                if (error) throw error;
                alert("Password reset email sent! Check your inbox.");
            } catch (err) {
                console.error("Reset password error:", err);
                alert("Error sending reset email: " + err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    // DEV ONLY: Quick Login
    const handleDevLogin = async (e) => {
        if (e) e.preventDefault();
        const devEmail = 'admin@kosmoi.site';
        const devPass = 'password';

        setEmail(devEmail);
        setPassword(devPass);

        // Auto-submit
        setLoading(true);
        try {
            await db.auth.signIn(devEmail, devPass);
            console.log("Dev Login successful");
            await checkAppState(); // This will trigger the redirect effect
        } catch (err) {
            console.error('Dev Login error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden" dir="ltr">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={BG_IMAGE}
                    alt="Thai Street Atmosphere"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
            </div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-5xl mx-auto p-6 flex flex-col md:flex-row items-stretch gap-8 md:gap-16">

                {/* Left Side: Brand & Value Props (Glassmorphism) */}
                <div className="flex-1 flex flex-col justify-center text-white space-y-2 md:space-y-8">
                    <div>
                        {/* KOSMOI OS Badge Removed */}
                        <h1 className="text-xl md:text-5xl font-bold leading-tight mb-1 md:mb-4">
                            Your Intelligent <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                                Island Companion
                            </span>
                        </h1>
                        <p className="text-xs md:text-lg text-slate-200/90 font-light max-w-md">
                            Join the exclusive network of travelers and locals unlocking the best of Koh Samui with AI.
                        </p>
                    </div>
                    <div className="hidden md:block space-y-4">
                        {[
                            { icon: ShieldCheck, text: "Verified Listings & Services", sub: "No scams, just quality." },
                            { icon: Sparkles, text: "AI Travel Concierge", sub: "Itinerary planning in seconds." },
                            { icon: MapPin, text: "Exclusive Local Deals", sub: "Prices you won't find online." }
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <item.icon className="w-5 h-5 text-blue-300" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{item.text}</h3>
                                    <p className="text-sm text-slate-300">{item.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Login Form (Glass Card) */}
                <div className="w-full md:w-[420px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
                    {/* Decorative Gradient Blob */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {isLogin ? 'Sign In' : 'Create Account'}
                            </h2>
                            <p className="text-slate-300 text-sm">
                                {isLogin ? 'Access your account' : 'Join the community'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* DEV SHORTCUT (Only in Login Mode) */}
                        {import.meta.env.DEV && isLogin && (
                            <button
                                onClick={handleDevLogin}
                                className="w-full mb-4 py-2 text-xs font-mono bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/30 rounded-lg transition-colors"
                            >
                                [DEV] Fill Admin Creds
                            </button>
                        )}

                        <Button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            variant="outline"
                            className="w-full py-6 border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white flex items-center justify-center gap-3 rounded-xl transition-all mb-6"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                            {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
                        </Button>

                        <div className="relative py-2 mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-transparent px-2 text-slate-400">Or with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleAuthSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider ml-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-400/50 transition-all outline-none"
                                    placeholder="name@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Password</label>
                                    {isLogin && (
                                        <button
                                            type="button"
                                            onClick={handleForgotPassword}
                                            className="text-xs text-blue-300 hover:text-blue-200 transition-colors"
                                        >
                                            Forgot?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-400/50 transition-all outline-none"
                                        placeholder="••••••••"
                                    />
                                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                </div>
                            </div>

                            {!isLogin && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-medium text-slate-300 uppercase tracking-wider ml-1">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-400/50 transition-all outline-none"
                                            placeholder="••••••••"
                                        />
                                        <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 text-base font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-lg transition-all rounded-xl"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    isLogin ? 'Log In' : 'Create Account'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                    setConfirmPassword('');
                                }}
                                className="text-slate-400 text-sm hover:text-white transition-colors"
                            >
                                {isLogin ? (
                                    <>Don't have an account? <span className="text-blue-300 font-medium">Sign Up</span></>
                                ) : (
                                    <>Already have an account? <span className="text-blue-300 font-medium">Sign In</span></>
                                )}
                            </button>
                        </div>

                        <div className="mt-4 text-center border-t border-white/5 pt-4">
                            <p className="text-slate-500 text-xs">
                                Want to join as a professional?{' '}
                                <button onClick={() => navigate('/vendor-signup')} className="text-slate-400 hover:text-white transition-colors underline">
                                    Apply as Vendor
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

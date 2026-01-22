import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, supabase } from '@/api/supabaseClient';
import { ActivityLogService } from '@/services/ActivityLogService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true); // Keeping state for compatibility but setting to false
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();

    // Listen for auth state changes
    const { data: authListener } = db.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Use standard getUser()
        const { data: { user: currentUser } } = await db.auth.getUser();

        // Fetch Role
        let userRole = 'user';
        if (currentUser) {
          const { data: roleData, error: roleError } = await supabase.from('users')
            .select('role')
            .eq('id', currentUser.id)
            .single();
          if (roleData) {
            userRole = roleData.role;
          }
        }

        setUser({ ...currentUser, role: userRole });
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
    // Safety timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => {
      console.warn("Auth check timed out, forcing load completion");
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }, 10000); // 10s timeout

    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // FAST PATH: If we are on a PUBLIC route, UNBLOCK immediately!
      const isPublicRoute =
        window.location.pathname === '/' ||
        window.location.pathname.startsWith('/he') ||
        window.location.pathname.startsWith('/th') ||
        window.location.pathname.startsWith('/ru') ||
        ['/about', '/contact', '/pricing', '/blog', '/terms', '/privacy', '/login'].some(p => window.location.pathname.includes(p));

      // 0. Screenshot Agent Bypass (DEV Only)
      if (import.meta.env.DEV && navigator.userAgent.includes('ScreenshotAgent')) {
        console.log("📸 Screenshot Agent Detected: Granting Admin Access");
        setUser({
          id: 'agent-mock',
          email: 'agent@kosmoi.site',
          role: 'admin',
          app_metadata: { provider: 'email' },
          user_metadata: { full_name: 'Screenshot Agent' }
        });
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setIsLoadingPublicSettings(false);
        return;
      }

      // 1. Optimistic Check: Get session from Supabase Client (memory/storage) with Timeout
      // Fixes hanging getSession() issue
      const getSessionPromise = db.auth.getSession();
      const sessionTimeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 1000)
      );

      const { data: { session } } = await Promise.race([getSessionPromise, sessionTimeoutPromise]);

      // If we got a session (either from race win or slow load eventually)
      if (session?.user) {
        console.log("⚡ Optimistic Auth: Found session User -> Unblocking UI");
        setUser(session.user);
        setIsAuthenticated(true);

        // CRITICAL FIX: For Admin/Protected routes, we MUST wait for the role check (checkUserAuth) 
        // before unblocking, otherwise RequireRole will redirect immediately because session.user lacks the 'role' field.
        const isProtectedPath = window.location.pathname.startsWith('/admin') ||
          window.location.pathname.startsWith('/business') ||
          window.location.pathname.includes('/provider-dashboard');

        if (isProtectedPath) {
          console.log("🛡️ Protected Route Detected: Waiting for Role Verification...");
          await checkUserAuth(true, false); // Run in foreground (blocking)
        } else {
          setIsLoadingAuth(false); // Unblock immediately for public/app
          // 2. Background Verification (non-blocking)
          checkUserAuth(true, true);
        }
      } else {
        // No session found or timeout
        if (isPublicRoute) {
          setIsLoadingAuth(false); // Unblock for public pages
        }
        // Still try to verify in background in case race timed out but session exists
        await checkUserAuth(false, isPublicRoute);
      }

      setAppPublicSettings({ public_settings: {} });
      setIsLoadingPublicSettings(false);

    } catch (error) {
      // ... existing error handling
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    } finally {
      clearTimeout(safetyTimer);
    }
  };

  const checkUserAuth = async (hasOptimisticSession, runInBackground = false) => {
    try {
      // PRO TIP: If we already have a user from local storage, don't show "Loading..." spinner again.
      // Just verify in the background.
      if (!runInBackground) {
        setIsLoadingAuth(true);
      }

      // Create a promise that handles BOTH user and role fetching
      const fetchUserAndRole = async () => {
        const { data: { user: currentUser }, error: userError } = await db.auth.getUser();
        if (userError) throw userError;

        if (!currentUser) return null;

        // Fetch Role
        let userRole = 'user';
        const { data: roleData, error: roleError } = await supabase.from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (roleData) {
          userRole = roleData.role;
        } else if (roleError) {
          console.warn("Failed to fetch user role, defaulting to user", roleError);
        }

        return { ...currentUser, role: userRole };
      };

      // Race the entire operation against a timeout
      // Increased timeout to 10s to account for potential Supabase cold starts
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth verification timed out")), 10000)
      );

      const authenticatedUser = await Promise.race([
        fetchUserAndRole(),
        timeoutPromise
      ]);

      if (authenticatedUser) {
        setUser(authenticatedUser);
        setIsAuthenticated(true);
        // Log Login (Only if not just refreshing/background)
        if (!hasOptimisticSession && !runInBackground) {
          ActivityLogService.logAction(authenticatedUser.id, 'LOGIN', 'User logged in');
        }
      } else {
        // CRITICAL FIX: If we have an optimistic session but fetchUserAndRole returns null (e.g. network blip or race),
        // DO NOT log out immediately. Trust the session for a bit longer.
        if (hasOptimisticSession) {
          console.warn("⚠️ User fetch failed but optimistic session exists. Retaining session.");
          // We don't nullify user here. We hope the optimistic one is good enough.
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }

    } catch (error) {
      console.error('User auth check failed:', error);

      const isSessionInvalid = error.message?.includes('Invalid session') || error.message?.includes('refresh_token_not_found') || error.message?.includes('JWT expired');

      if (hasOptimisticSession && !isSessionInvalid) {
        console.warn("⚠️ Auth check failed but keeping optimistic session (Stability Mode). Error:", error.message);
      } else {
        console.warn("❌ Session invalid, logging out.");
        setIsAuthenticated(false);
        setUser(null);
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const getLanguagePrefix = () => {
    const path = window.location.pathname;
    const languages = ['/he', '/th', '/ru', '/fr', '/de', '/es', '/zh'];
    const prefix = languages.find(lang => path.startsWith(lang));
    return prefix || '';
  };

  const logout = async (shouldRedirect = true) => {
    try {
      if (user?.id) {
        // Attempt logging, but don't block
        ActivityLogService.logAction(user.id, 'LOGOUT', 'User logged out').catch(console.error);
      }

      // Race signOut against a 2-second timeout to prevent hanging
      const signOutPromise = db.auth.signOut();
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));

      await Promise.race([signOutPromise, timeoutPromise]);

    } catch (error) {
      console.error("Logout error (non-blocking):", error);
    } finally {
      // Force clear state regardless of signOut success
      setUser(null);
      setIsAuthenticated(false);

      // Clear all Supabase-related local storage to be safe
      Object.keys(localStorage).forEach(key => {
        if (key.includes('sb-') && key.includes('-auth-token')) {
          localStorage.removeItem(key);
        }
      });

      if (shouldRedirect) {
        // Manual redirect with language awareness
        const prefix = getLanguagePrefix();
        window.location.href = `${prefix}/login`;
      }
    }
  };

  const navigateToLogin = () => {
    // Manual redirect with language awareness
    const prefix = getLanguagePrefix();
    window.location.href = `${prefix}/login?returnUrl=${encodeURIComponent(window.location.href)}`;
  };

  const contextValue = React.useMemo(() => ({
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    logout,
    navigateToLogin,
    checkAppState
  }), [user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, appPublicSettings]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, supabase } from '@/api/supabaseClient';

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
          const { data: roleData, error: roleError } = await supabase.from('user_roles')
            .select('role')
            .eq('user_id', currentUser.id)
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
    }, 5000); // Reduced to 5s as we are now optimistic

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

      // 1. Optimistic Check: Get session from LocalStorage first
      const { data: { session } } = await db.auth.getSession();

      if (session?.user) {
        console.log("⚡ Optimistic Auth: Found session User -> Unblocking UI");
        // IMMEDIATE UPDATE
        setUser(session.user);
        setIsAuthenticated(true);
        setIsLoadingAuth(false); // <--- KEY CHANGE: Unblock immediately

        // 2. Background Verification
        // We verify the token and role in the background. 
        // If it fails, we will handle it gracefully without blocking the user now.
        checkUserAuth(true, true);
      } else {
        // No session found
        if (isPublicRoute) {
          setIsLoadingAuth(false); // Unblock for public pages
        }
        // If protected route and no session, we still wait for strict check just in case, 
        // or we could redirect immediately. For now, let's run strict check.
        await checkUserAuth(false, isPublicRoute);
      }

      setAppPublicSettings({ public_settings: {} });
      setIsLoadingPublicSettings(false);

    } catch (error) {
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
        const { data: roleData, error: roleError } = await supabase.from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
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
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

    } catch (error) {
      console.error('User auth check failed:', error);

      // Improved: Offline Support
      // If we have an optimistic session and this is a network error, DO NOT LOGOUT.
      const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('timeout') || error.status === 500;

      if (hasOptimisticSession && isNetworkError) {
        console.warn("Network error during auth check. Keeping optimistic session (Offline Mode).");
        // Keep existing user and isAuthenticated=true
      } else {
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
    await db.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      // Manual redirect with language awareness
      const prefix = getLanguagePrefix();
      window.location.href = `${prefix}/login`;
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

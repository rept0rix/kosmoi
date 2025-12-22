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
    }, 10000); // Improved: Increased to 10s

    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // 0. Screenshot Agent Bypass (DEV Only)
      // Injects a valid admin session to allow Puppeteer to capture protected routes
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
      // This prevents the "Login Loop" where Login page sees session but AuthContext waits for server
      const { data: { session } } = await db.auth.getSession();
      if (session?.user) {
        console.log("Hyperspeed/Optimistic Auth: Found session User");
        setUser(session.user);
        setIsAuthenticated(true);
      }

      setAppPublicSettings({ public_settings: {} });
      setIsLoadingPublicSettings(false);

      // 2. Strict / Server Verification (can happen in background or parallel)
      await checkUserAuth(!!session?.user);

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

  const checkUserAuth = async (hasOptimisticSession) => {
    try {
      setIsLoadingAuth(true);
      // Use standard getUser()
      const { data: { user: currentUser }, error } = await db.auth.getUser();

      if (error) throw error;

      if (currentUser) {
        // Fetch Role
        let userRole = 'user';
        if (currentUser) {
          const { data: roleData, error: roleError } = await supabase.from('user_roles')
            .select('role')
            .eq('user_id', currentUser.id)
            .single();
          
           if (roleData) {
            userRole = roleData.role;
          } else if (roleError) {
             console.warn("Failed to fetch user role, defaulting to user", roleError);
          }
        }
        setUser({ ...currentUser, role: userRole });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      
      // Improved: Offline Support
      // If we have an optimistic session and this is a network error, DO NOT LOGOUT.
      const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network') || error.status === 500;
      
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

  const logout = async (shouldRedirect = true) => {
    await db.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      // Manual redirect
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    // Manual redirect
    window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.href)}`;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
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

import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, supabase } from '@/api/supabaseClient';

const AuthContext = createContext(null);

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
          const { data: roleData } = await supabase.from('user_roles')
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
    }, 5000);

    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

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
      await checkUserAuth();

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

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      // Use standard getUser()
      const { data: { user: currentUser } } = await db.auth.getUser();
      if (currentUser) {
        // Fetch Role
        let userRole = 'user';
        if (currentUser) {
          const { data: roleData } = await supabase.from('user_roles')
            .select('role')
            .eq('user_id', currentUser.id)
            .single();
          if (roleData) {
            userRole = roleData.role;
          }
        }
        setUser({ ...currentUser, role: userRole });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
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

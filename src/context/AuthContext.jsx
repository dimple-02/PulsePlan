import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * 
 * Manages user authentication state, session restoration on refresh,
 * login, signup, and logout operations backed by HTTP-only session cookies.
 * 
 * Viva Concepts:
 * - Session restoration via asynchronous API call on mount
 * - Secure cookie credentials without storing JWT tokens in localStorage (XSS prevention)
 * - Lifting auth state to React Context
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check current session on mount (restores logged-in user after page refresh)
  const checkSession = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      // 401 just means no active session, which is normal for logged-out visitors
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Signup action
  const signup = useCallback(async ({ name, email, password }) => {
    setAuthError(null);
    try {
      const newUser = await api.signupUser({ name, email, password });
      setUser(newUser);
      return newUser;
    } catch (err) {
      setAuthError(err.message || 'Failed to sign up');
      throw err;
    }
  }, []);

  // Login action
  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    try {
      const loggedInUser = await api.loginUser({ email, password });
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setAuthError(err.message || 'Failed to log in');
      throw err;
    }
  }, []);

  // Logout action
  const logout = useCallback(async () => {
    try {
      await api.logoutUser();
    } catch (err) {
      console.warn('[Auth] Logout warning:', err.message);
    } finally {
      setUser(null);
      setAuthError(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    authError,
    setAuthError,
    signup,
    login,
    logout,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

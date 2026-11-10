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
      const result = await api.signupUser({ name, email, password });
      // When email verification is mandatory, unverified user has no session cookie yet
      if (result?.requiresVerification) {
        setUser(null);
        return result;
      }
      if (result?.user) {
        setUser(result.user);
      }
      return result;
    } catch (err) {
      setAuthError(err.message || 'Failed to sign up');
      throw err;
    }
  }, []);

  // Verify email OTP action
  const verifyEmailOtp = useCallback(async ({ email, otp }) => {
    setAuthError(null);
    try {
      const verifiedUser = await api.verifyEmail({ email, otp });
      setUser(verifiedUser);
      return verifiedUser;
    } catch (err) {
      setAuthError(err.message || 'Email verification failed');
      throw err;
    }
  }, []);

  // Resend verification OTP action
  const resendVerificationOtp = useCallback(async (email) => {
    setAuthError(null);
    try {
      const res = await api.resendVerification(email);
      return res;
    } catch (err) {
      setAuthError(err.message || 'Failed to resend verification code');
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

  // Update or skip onboarding action
  const updateOnboarding = useCallback(async (data) => {
    setAuthError(null);
    try {
      const updatedUser = await api.saveOnboarding(data);
      if (updatedUser) {
        setUser(updatedUser);
      }
      return updatedUser;
    } catch (err) {
      setAuthError(err.message || 'Failed to update onboarding preferences');
      throw err;
    }
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    authError,
    setAuthError,
    signup,
    verifyEmailOtp,
    resendVerificationOtp,
    login,
    logout,
    updateOnboarding,
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

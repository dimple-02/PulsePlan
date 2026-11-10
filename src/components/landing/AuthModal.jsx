import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Layers,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  X,
  CheckCircle2,
  Shield,
  KeyRound,
  RotateCcw,
} from 'lucide-react';

/**
 * AuthModal Component
 * 
 * Provides unified centered Login & Signup modal above the landing page:
 * - Smooth dark backdrop blur keeping the landing page visible behind
 * - Fade-and-scale entrance animation
 * - Close button, backdrop click, and Escape-key support
 * - Prevents background scrolling when open
 * - Preserves existing fields, validation, and real API endpoints:
 *   - Login: login({ email, password })
 *   - Signup: signup({ name, email, password })
 * - Smooth toggle between Login and Signup modes
 */
export default function AuthModal({ isOpen, initialMode = 'login', onClose }) {
  const { login, signup, verifyEmailOtp, resendVerificationOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'verify-email'

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sync mode when initialMode changes
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [initialMode, isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle ESC key and scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
    setAttemptsRemaining(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      onClose();
      const searchParams = new URLSearchParams(location.search);
      const redirectParam = searchParams.get('redirect');
      const fromPath = location.state?.from?.pathname
        ? `${location.state.from.pathname}${location.state.from.search || ''}`
        : (typeof location.state?.from === 'string' ? location.state.from : null);
      const destination = fromPath || redirectParam || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      if (err.details?.code === 'EMAIL_NOT_VERIFIED' || err.code === 'EMAIL_NOT_VERIFIED') {
        setSuccessMessage('Your email is not verified yet. A verification code is required.');
        setResendCooldown(60);
        setMode('verify-email');
      } else {
        setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter your work email.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      // After signup, user must verify their email with 6-digit OTP
      setSuccessMessage('Account created! A 6-digit verification code was sent to your email.');
      setResendCooldown(60);
      setMode('verify-email');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const verifiedUser = await verifyEmailOtp({ email: email.trim().toLowerCase(), otp: cleanOtp });
      setSuccessMessage('Email verified successfully! Opening your workspace...');
      setTimeout(() => {
        onClose();
        const searchParams = new URLSearchParams(location.search);
        const redirectParam = searchParams.get('redirect');
        const fromPath = location.state?.from?.pathname
          ? `${location.state.from.pathname}${location.state.from.search || ''}`
          : (typeof location.state?.from === 'string' ? location.state.from : null);
        const rawDest = fromPath || redirectParam || '/';

        const isInvite = rawDest.startsWith('/invitations/') || rawDest.startsWith('/invite/');
        const needsOnboarding = Boolean(
          verifiedUser?.onboarding &&
          verifiedUser.onboarding.completed === false &&
          verifiedUser.onboarding.skipped === false
        );

        let finalDest = rawDest;
        if (isInvite) {
          finalDest = rawDest;
        } else if (needsOnboarding) {
          const destParam = rawDest && rawDest !== '/' ? `?redirect=${encodeURIComponent(rawDest)}` : '';
          finalDest = `/onboarding${destParam}`;
        }

        navigate(finalDest, { replace: true });
      }, 900);
    } catch (err) {
      const details = err.details || {};
      if (details.attemptsRemaining !== undefined) {
        setAttemptsRemaining(details.attemptsRemaining);
      }
      setErrorMessage(
        err.message || 'Verification failed. Please check the code and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage('');
    setSuccessMessage('');
    setAttemptsRemaining(null);
    setIsSubmitting(true);
    try {
      const res = await resendVerificationOtp(email.trim().toLowerCase());
      setSuccessMessage(res?.message || 'A new verification code has been dispatched.');
      setResendCooldown(60);
      setOtp('');
    } catch (err) {
      if (err.details?.code === 'COOLDOWN_ACTIVE' && err.details?.remainingSeconds) {
        setResendCooldown(err.details.remainingSeconds);
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to resend verification code.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 dark:bg-black/55 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Modal Dialog Card (Stops backdrop click propagation) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-[#14121C] border border-[#E5E1EE] dark:border-[#C9B8FF]/25 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(201,184,255,0.12)] p-5 sm:p-8 animate-in zoom-in-95 duration-200 max-h-[94dvh] overflow-y-auto my-auto"
      >
        {/* Subtle Top Glowing Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#7C5CFC] dark:via-[#C9B8FF] to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF] hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B8FF]"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#EFEAFE] dark:bg-[#1C1926] border border-[#7C5CFC]/30 dark:border-[#C9B8FF]/30 text-[#5935D6] dark:text-[#C9B8FF] shadow-[0_0_20px_rgba(89,53,214,0.15)] dark:shadow-[0_0_20px_rgba(201,184,255,0.15)] mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h2
            id="auth-modal-title"
            className="text-xl sm:text-2xl font-bold tracking-tight text-[#14121C] dark:text-[#F8F6EF]"
          >
            {mode === 'login'
              ? 'Sign in to PulsePlan'
              : mode === 'signup'
              ? 'Create your workspace'
              : 'Verify your email'}
          </h2>
          <p className="mt-1 text-xs text-[#5C576C] dark:text-[#A6A1B5]">
            {mode === 'login'
              ? 'Multi-Tenant Workspace & Project Management'
              : mode === 'signup'
              ? 'Launch your dedicated, isolated team environment'
              : 'Enter the 6-digit verification code sent to your email'}
          </p>
        </div>

        {/* Segmented Mode Toggle Tabs (Hidden during verification step) */}
        {mode !== 'verify-email' && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F4F2F8] dark:bg-[#100E17] border border-[#E5E1EE] dark:border-white/5 mb-5">
            <button
              type="button"
              onClick={() => handleModeSwitch('login')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#1C1829] text-[#5935D6] dark:text-[#C9B8FF] shadow-sm border border-[#E5E1EE] dark:border-[#C9B8FF]/20'
                  : 'text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('signup')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-[#1C1829] text-[#5935D6] dark:text-[#C9B8FF] shadow-sm border border-[#E5E1EE] dark:border-[#C9B8FF]/20'
                  : 'text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium">{errorMessage}</div>
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <p className="mt-1 font-bold text-rose-800 dark:text-rose-200">
                  {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining.
                </p>
              )}
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#5C576C] dark:text-[#A6A1B5] uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5C576C] dark:text-[#A6A1B5]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-[#F9F8FC] dark:bg-[#100E17] border border-[#E5E1EE] dark:border-white/10 rounded-xl text-[#14121C] dark:text-[#F8F6EF] placeholder-[#5C576C]/50 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] focus:ring-1 focus:ring-[#7C5CFC] dark:focus:ring-[#C9B8FF] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono font-medium text-[#5C576C] dark:text-[#A6A1B5] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/forgot-password');
                  }}
                  className="text-xs text-[#5935D6] dark:text-[#C9B8FF] hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5C576C] dark:text-[#A6A1B5]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-base sm:text-sm bg-[#F9F8FC] dark:bg-[#100E17] border border-[#E5E1EE] dark:border-white/10 rounded-xl text-[#14121C] dark:text-[#F8F6EF] placeholder-[#5C576C]/50 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] focus:ring-1 focus:ring-[#7C5CFC] dark:focus:ring-[#C9B8FF] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#5935D6] hover:bg-[#4828b8] dark:bg-[#C9B8FF] dark:hover:bg-[#ded2ff] text-white dark:text-[#0B0A0F] font-semibold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(89,53,214,0.25)] dark:shadow-[0_0_20px_rgba(201,184,255,0.25)] hover:shadow-[0_0_30px_rgba(89,53,214,0.4)] dark:hover:shadow-[0_0_30px_rgba(201,184,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B8FF]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* SIGNUP FORM */}
        {mode === 'signup' && (
          <form className="space-y-3.5" onSubmit={handleSignupSubmit}>
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#5C576C] dark:text-[#A6A1B5] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5C576C] dark:text-[#A6A1B5]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-[#F9F8FC] dark:bg-[#100E17] border border-[#E5E1EE] dark:border-white/10 rounded-xl text-[#14121C] dark:text-[#F8F6EF] placeholder-[#5C576C]/50 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] focus:ring-1 focus:ring-[#7C5CFC] dark:focus:ring-[#C9B8FF] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#5C576C] dark:text-[#A6A1B5] uppercase tracking-wider mb-1">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5C576C] dark:text-[#A6A1B5]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@company.com"
                  className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-[#F9F8FC] dark:bg-[#100E17] border border-[#E5E1EE] dark:border-white/10 rounded-xl text-[#14121C] dark:text-[#F8F6EF] placeholder-[#5C576C]/50 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] focus:ring-1 focus:ring-[#7C5CFC] dark:focus:ring-[#C9B8FF] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#5C576C] dark:text-[#A6A1B5] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5C576C] dark:text-[#A6A1B5]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-10 py-2 text-base sm:text-sm bg-[#F9F8FC] dark:bg-[#100E17] border border-[#E5E1EE] dark:border-white/10 rounded-xl text-[#14121C] dark:text-[#F8F6EF] placeholder-[#5C576C]/50 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] focus:ring-1 focus:ring-[#7C5CFC] dark:focus:ring-[#C9B8FF] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#5C576C] dark:text-[#A6A1B5] uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5C576C] dark:text-[#A6A1B5]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-[#F9F8FC] dark:bg-[#100E17] border border-[#E5E1EE] dark:border-white/10 rounded-xl text-[#14121C] dark:text-[#F8F6EF] placeholder-[#5C576C]/50 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] focus:ring-1 focus:ring-[#7C5CFC] dark:focus:ring-[#C9B8FF] transition-all"
                />
              </div>
            </div>

            {/* Tenant Isolation Notice */}
            <div className="p-2.5 rounded-lg bg-[#F4F2F8] dark:bg-[#100E17] border border-[#7C5CFC]/20 dark:border-[#C9B8FF]/15 text-[11px] text-[#5C576C] dark:text-[#A6A1B5] flex items-start gap-2">
              <Shield className="w-4 h-4 text-[#5935D6] dark:text-[#C9B8FF] shrink-0 mt-0.5" />
              <span>
                Your account will be provisioned with a private workspace isolated from all other organizations.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#5935D6] hover:bg-[#4828b8] dark:bg-[#C9B8FF] dark:hover:bg-[#ded2ff] text-white dark:text-[#0B0A0F] font-semibold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(89,53,214,0.25)] dark:shadow-[0_0_20px_rgba(201,184,255,0.25)] hover:shadow-[0_0_30px_rgba(89,53,214,0.4)] dark:hover:shadow-[0_0_30px_rgba(201,184,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B8FF]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Workspace...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* VERIFY EMAIL FORM */}
        {mode === 'verify-email' && (
          <form className="space-y-4" onSubmit={handleVerifyOtpSubmit}>
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#5C576C] dark:text-[#A6A1B5] uppercase tracking-wider mb-1.5">
                Target Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5C576C] dark:text-[#A6A1B5]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-[#F9F8FC] dark:bg-[#100E17] border border-[#E5E1EE] dark:border-white/10 rounded-xl text-[#14121C] dark:text-[#F8F6EF] placeholder-[#5C576C]/50 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono font-medium text-[#5C576C] dark:text-[#A6A1B5] uppercase tracking-wider">
                  6-Digit Security Code
                </label>
                <span className="text-[10px] text-[#5C576C] dark:text-[#A6A1B5]">
                  Valid for 5 mins
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5C576C] dark:text-[#A6A1B5]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  required
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                  }}
                  placeholder="123456"
                  className="w-full pl-9 pr-3 py-2 text-center font-mono text-xl tracking-[0.4em] font-bold bg-[#F9F8FC] dark:bg-[#100E17] border border-[#E5E1EE] dark:border-white/10 rounded-xl text-[#14121C] dark:text-[#F8F6EF] placeholder-[#5C576C]/30 focus:outline-none focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.length !== 6}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#5935D6] hover:bg-[#4828b8] dark:bg-[#C9B8FF] dark:hover:bg-[#ded2ff] text-white dark:text-[#0B0A0F] font-semibold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(89,53,214,0.25)] dark:shadow-[0_0_20px_rgba(201,184,255,0.25)] hover:shadow-[0_0_30px_rgba(89,53,214,0.4)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Activate Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
              <span className="text-[#5C576C] dark:text-[#A6A1B5]">Didn't get the code?</span>
              {resendCooldown > 0 ? (
                <span className="font-mono text-[#5935D6] dark:text-[#C9B8FF] font-semibold">
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 font-semibold text-[#5935D6] dark:text-[#C9B8FF] hover:underline disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resend Code</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* Footer switch prompt */}
        <div className="mt-5 text-center">
          {mode === 'verify-email' ? (
            <p className="text-xs text-[#5C576C] dark:text-[#A6A1B5]">
              Want to use another email?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('signup')}
                className="font-semibold text-[#5935D6] hover:text-[#4828b8] dark:text-[#C9B8FF] dark:hover:text-[#ded2ff] hover:underline focus:outline-none"
              >
                Back to Sign Up
              </button>
            </p>
          ) : (
            <p className="text-xs text-[#5C576C] dark:text-[#A6A1B5]">
              {mode === 'login' ? "Don't have an account yet? " : 'Already have a workspace? '}
              <button
                type="button"
                onClick={() => handleModeSwitch(mode === 'login' ? 'signup' : 'login')}
                className="font-semibold text-[#5935D6] hover:text-[#4828b8] dark:text-[#C9B8FF] dark:hover:text-[#ded2ff] hover:underline focus:outline-none"
              >
                {mode === 'login' ? 'Create new workspace' : 'Sign in to workspace'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Layers,
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import { useAuth } from '../context/AuthContext';

/**
 * VerifyEmailPage Component
 *
 * Mandatory Email Verification Screen:
 * - 6-digit OTP code entry with auto-formatting
 * - 60-second live resend countdown timer
 * - Remaining attempts tracking (max 5)
 * - Auto-redirection upon verification to intended destination (e.g. project invitation)
 * - Light and Dark theme support matching PulsePlan's design identity
 */
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmailOtp, resendVerificationOtp, isAuthenticated, isLoading: authLoading } = useAuth();

  // Read initial email from navigation state or URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const initialEmail = location.state?.email || searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(
    location.state?.fromSignup
      ? 'A 6-digit verification code has been dispatched to your email address.'
      : ''
  );
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  // 60-second resend countdown timer
  const [resendCooldown, setResendCooldown] = useState(location.state?.fromSignup ? 60 : 0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // If already authenticated and not loading, redirect to target
  useEffect(() => {
    if (!authLoading && isAuthenticated && isVerified) {
      const searchParams = new URLSearchParams(location.search);
      const redirectParam = searchParams.get('redirect');
      const fromPath = location.state?.from?.pathname
        ? `${location.state.from.pathname}${location.state.from.search || ''}`
        : (typeof location.state?.from === 'string' ? location.state.from : null);
      const destination = fromPath || redirectParam || '/';
      const timeout = setTimeout(() => {
        navigate(destination, { replace: true });
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [authLoading, isAuthenticated, isVerified, location.state, location.search, navigate]);

  // Handle OTP verification submission
  const handleVerify = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessInfo('');

    const trimmedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please provide your email address.');
      return;
    }

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('Please enter the 6-digit numeric verification code.');
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmailOtp({ email: trimmedEmail, otp: cleanOtp });
      setIsVerified(true);
      setSuccessInfo('Email successfully verified! Signing you in...');

      const searchParams = new URLSearchParams(location.search);
      const redirectParam = searchParams.get('redirect');
      const fromPath = location.state?.from?.pathname
        ? `${location.state.from.pathname}${location.state.from.search || ''}`
        : (typeof location.state?.from === 'string' ? location.state.from : null);
      const destination = fromPath || redirectParam || '/';
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 1000);
    } catch (err) {
      const details = err.details || {};
      if (details.attemptsRemaining !== undefined) {
        setAttemptsRemaining(details.attemptsRemaining);
      }
      setErrorMessage(
        err.message || 'Verification failed. Please check the code and try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle OTP Resend
  const handleResend = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address to receive a new code.');
      return;
    }

    if (resendCooldown > 0) return;

    setErrorMessage('');
    setSuccessInfo('');
    setAttemptsRemaining(null);
    setIsResending(true);

    try {
      const res = await resendVerificationOtp(trimmedEmail);
      setSuccessInfo(res?.message || 'A new 6-digit verification code has been dispatched.');
      setResendCooldown(60);
      setOtp('');
    } catch (err) {
      if (err.details?.code === 'COOLDOWN_ACTIVE' && err.details?.remainingSeconds) {
        setResendCooldown(err.details.remainingSeconds);
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to resend verification code. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0A0F] text-[#14121C] dark:text-[#F8F6EF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-150">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#5935D6] dark:bg-gradient-to-br dark:from-[#C9B8FF] dark:to-[#FFD6E8] text-white dark:text-[#0B0A0F] shadow-lg shadow-[#5935D6]/20 dark:shadow-[0_0_20px_rgba(201,184,255,0.25)] mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#14121C] dark:text-[#F8F6EF] sm:text-3xl">
          Verify Your Email
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#5C576C] dark:text-[#A6A1B5]">
          PulsePlan Workspace Security & Authentication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#14121C] py-8 px-5 sm:px-8 shadow-xl shadow-slate-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] sm:rounded-2xl border border-slate-200 dark:border-[#C9B8FF]/20 relative overflow-hidden">
          {/* Subtle top brand glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#7C5CFC] via-[#C9B8FF] to-[#FFD6E8]" />

          {/* Success banner */}
          {successInfo && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successInfo}</div>
            </div>
          )}

          {/* Error banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-medium">{errorMessage}</span>
                {attemptsRemaining !== null && attemptsRemaining > 0 && (
                  <p className="mt-1 font-bold text-rose-800 dark:text-rose-200">
                    {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining before OTP is invalidated.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* VERIFIED SUCCESS VIEW */}
          {isVerified ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-2">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8F6EF]">
                Email Verified Successfully!
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A6A1B5]">
                Your account is activated and your session is initialized. Redirecting...
              </p>
              <div className="flex justify-center pt-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#5935D6] dark:text-[#C9B8FF]" />
              </div>
            </div>
          ) : (
            /* VERIFICATION FORM */
            <form onSubmit={handleVerify} className="space-y-5">
              {/* Email Address Display / Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#A6A1B5]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#100E17] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-[#F8F6EF] placeholder-slate-400 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/20 dark:focus:ring-[#C9B8FF]/20 focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] transition-all"
                  />
                </div>
              </div>

              {/* 6-Digit OTP Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-[#A6A1B5]">
                    Expires in 5 minutes
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#A6A1B5]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                    }}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2.5 text-center font-mono text-xl tracking-[0.5em] font-bold bg-slate-50 dark:bg-[#100E17] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-[#F8F6EF] placeholder-slate-300 dark:placeholder-[#A6A1B5]/30 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/20 dark:focus:ring-[#C9B8FF]/20 focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] transition-all"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-[#A6A1B5]">
                  Check your inbox and spam folder for the email from PulsePlan.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isVerifying || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#5935D6] hover:bg-[#4828b8] dark:bg-[#C9B8FF] dark:hover:bg-[#ded2ff] text-white dark:text-[#0B0A0F] font-semibold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7C5CFC] dark:focus:ring-[#C9B8FF] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Activate Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend OTP Section */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-[#A6A1B5]">
                  Didn't receive the code?
                </span>
                {resendCooldown > 0 ? (
                  <span className="font-mono text-indigo-600 dark:text-[#C9B8FF] font-semibold">
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-[#C9B8FF] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {isResending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Back to Login link */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-[#A6A1B5] hover:text-[#5935D6] dark:hover:text-[#C9B8FF] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

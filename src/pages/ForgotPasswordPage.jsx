import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  Mail,
  Lock,
  Eye,
  EyeOff,
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
import { forgotPassword, verifyResetOtp, resetPassword } from '../services/api';

/**
 * ForgotPasswordPage Component
 *
 * Full production-ready 3-step OTP password reset flow:
 * 1. Email entry & cryptographically secure 6-digit OTP generation
 * 2. OTP entry with 5-minute expiry & 60-second resend cooldown timer
 * 3. New password creation & session invalidation confirmation
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Steps: 'email' | 'otp' | 'new-password' | 'success'
  const [step, setStep] = useState('email');

  // Form Fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  // 60-Second Resend Countdown
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessInfo('');

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setSuccessInfo(res.message || 'Verification code sent to your email.');
      setResendCooldown(60);
      setStep('otp');
    } catch (err) {
      if (err.details?.code === 'COOLDOWN_ACTIVE' && err.details?.remainingSeconds) {
        setResendCooldown(err.details.remainingSeconds);
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to dispatch verification code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyResetOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
      setStep('new-password');
      setErrorMessage('');
    } catch (err) {
      if (err.details?.attemptsRemaining !== undefined) {
        setAttemptsRemaining(err.details.attemptsRemaining);
      }
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and re-type.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        newPassword,
        resetToken,
        otp: otp.trim(),
      });
      setStep('success');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password. Please start over.');
    } finally {
      setIsLoading(false);
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
          {step === 'success'
            ? 'Password Reset Complete'
            : step === 'new-password'
            ? 'Set New Password'
            : step === 'otp'
            ? 'Enter Verification Code'
            : 'Reset Your Password'}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#5C576C] dark:text-[#A6A1B5]">
          {step === 'otp'
            ? `We sent a 6-digit security code to ${email}`
            : step === 'new-password'
            ? 'Create a secure new password for your account'
            : 'Enter your work email to receive a secure one-time verification code'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#14121C] py-8 px-5 sm:px-8 shadow-xl shadow-slate-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] sm:rounded-2xl border border-slate-200 dark:border-[#C9B8FF]/20 relative overflow-hidden">
          {/* Subtle top glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#7C5CFC] via-[#C9B8FF] to-[#FFD6E8]" />

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Info Banner */}
          {successInfo && step === 'otp' && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successInfo}</div>
            </div>
          )}

          {/* STEP 1: EMAIL ENTRY */}
          {step === 'email' && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider mb-1.5">
                  Registered Work Email
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

              <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-[#1C182A] border border-indigo-100 dark:border-[#C9B8FF]/20 text-[11px] text-slate-600 dark:text-[#A6A1B5] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#5935D6] dark:text-[#C9B8FF] shrink-0 mt-0.5" />
                <span>
                  A 6-digit one-time code will be dispatched to this email. The code expires in 5 minutes.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#5935D6] hover:bg-[#4828b8] dark:bg-[#C9B8FF] dark:hover:bg-[#ded2ff] text-white dark:text-[#0B0A0F] font-semibold text-sm shadow-md transition-all focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#A6A1B5] hover:text-[#5935D6] dark:hover:text-[#C9B8FF] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider mb-1.5">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#A6A1B5]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2.5 text-center font-mono text-lg tracking-[8px] bg-slate-50 dark:bg-[#100E17] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-[#F8F6EF] placeholder-slate-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/20 dark:focus:ring-[#C9B8FF]/20 focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] transition-all"
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-[#A6A1B5]">
                  <span>Code expires in 5 minutes</span>
                  {attemptsRemaining !== null && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {attemptsRemaining} attempts left
                    </span>
                  )}
                </div>
              </div>

              {/* Resend Cooldown Section */}
              <div className="text-center pt-1">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-slate-500 dark:text-[#A6A1B5]">
                    Resend code in <span className="font-semibold text-[#5935D6] dark:text-[#C9B8FF]">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5935D6] dark:text-[#C9B8FF] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resend verification code</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#5935D6] hover:bg-[#4828b8] dark:bg-[#C9B8FF] dark:hover:bg-[#ded2ff] text-white dark:text-[#0B0A0F] font-semibold text-sm shadow-md transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setErrorMessage('');
                  }}
                  className="text-xs text-slate-500 dark:text-[#A6A1B5] hover:text-[#5935D6] dark:hover:text-[#C9B8FF]"
                >
                  Change email address
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 'new-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#A6A1B5]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 dark:bg-[#100E17] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-[#F8F6EF] placeholder-slate-400 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/20 dark:focus:ring-[#C9B8FF]/20 focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-[#A6A1B5] hover:text-slate-600 dark:hover:text-[#F8F6EF] focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#A6A1B5]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#100E17] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-[#F8F6EF] placeholder-slate-400 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/20 dark:focus:ring-[#C9B8FF]/20 focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] transition-all"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300">
                Notice: Resetting your password will automatically sign out all existing active sessions on other devices for your security.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#5935D6] hover:bg-[#4828b8] dark:bg-[#C9B8FF] dark:hover:bg-[#ded2ff] text-white dark:text-[#0B0A0F] font-semibold text-sm shadow-md transition-all focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8F6EF]">
                Password Successfully Reset!
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A6A1B5] max-w-sm mx-auto">
                Your password has been securely updated and all previous sessions were revoked. You can now log in with your new credentials.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#5935D6] hover:bg-[#4828b8] dark:bg-[#C9B8FF] dark:hover:bg-[#ded2ff] text-white dark:text-[#0B0A0F] font-semibold text-sm shadow-md transition-all"
              >
                <span>Sign In with New Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

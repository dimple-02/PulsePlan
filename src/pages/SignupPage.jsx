import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';

/**
 * SignupPage Component
 * 
 * Creates a new user account with:
 * - Real bcrypt password hashing on backend
 * - Full Dark & Light mode theme support
 * - Automatic dedicated personal workspace generation
 * - Immediate session cookie authentication
 * - Strict multi-tenant isolation from existing tenant accounts
 */
export default function SignupPage() {
  const { signup, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already authenticated and not loading, redirect to home
  if (!authLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
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
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0A0F] text-[#14121C] dark:text-[#F8F6EF] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-150">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#5935D6] dark:bg-gradient-to-br dark:from-[#C9B8FF] dark:to-[#FFD6E8] text-white dark:text-[#0B0A0F] shadow-lg shadow-[#5935D6]/20 dark:shadow-[0_0_20px_rgba(201,184,255,0.25)] mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#14121C] dark:text-[#F8F6EF] sm:text-3xl">
          Get started with PulsePlan
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#5C576C] dark:text-[#A6A1B5]">
          Create an account to launch your dedicated isolated workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-[#14121C] py-8 px-4 sm:px-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl sm:rounded-2xl border border-slate-200 dark:border-white/10">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#A6A1B5]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#100E17] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-[#F8F6EF] placeholder-slate-400 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/20 dark:focus:ring-[#C9B8FF]/20 focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] focus:bg-white dark:focus:bg-[#100E17] transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider mb-1.5">
                Work Email
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
                  placeholder="jordan@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#100E17] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-[#F8F6EF] placeholder-slate-400 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/20 dark:focus:ring-[#C9B8FF]/20 focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] focus:bg-white dark:focus:bg-[#100E17] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#A6A1B5]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 dark:bg-[#100E17] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-[#F8F6EF] placeholder-slate-400 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/20 dark:focus:ring-[#C9B8FF]/20 focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] focus:bg-white dark:focus:bg-[#100E17] transition-all"
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

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider mb-1.5">
                Confirm Password
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
                  placeholder="Repeat your password"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#100E17] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-[#F8F6EF] placeholder-slate-400 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/20 dark:focus:ring-[#C9B8FF]/20 focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] focus:bg-white dark:focus:bg-[#100E17] transition-all"
                />
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Multi-tenant data partitioning enabled by default</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#5935D6] hover:bg-[#4828b8] dark:bg-[#C9B8FF] dark:hover:bg-[#ded2ff] text-white dark:text-[#0B0A0F] font-semibold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7C5CFC] dark:focus:ring-[#C9B8FF] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating workspace...</span>
                </>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Navigation to Login */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-[#A6A1B5]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 dark:text-[#C9B8FF] hover:text-indigo-700 dark:hover:text-[#ded2ff] hover:underline"
              >
                Sign in to your workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

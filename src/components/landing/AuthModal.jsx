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
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync mode when initialMode changes
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
      setErrorMessage('');
    }
  }, [initialMode, isOpen]);

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
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      onClose();
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

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
      onClose();
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Modal Dialog Card (Stops backdrop click propagation) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#14121C] border border-[#C9B8FF]/25 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(201,184,255,0.12)] p-6 sm:p-8 animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Subtle Top Glowing Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C9B8FF] to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#A6A1B5] hover:text-[#F8F6EF] hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B8FF]"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#1C1926] border border-[#C9B8FF]/30 text-[#C9B8FF] shadow-[0_0_20px_rgba(201,184,255,0.15)] mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h2
            id="auth-modal-title"
            className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8F6EF]"
          >
            {mode === 'login' ? 'Sign in to PulsePlan' : 'Create your workspace'}
          </h2>
          <p className="mt-1 text-xs text-[#A6A1B5]">
            {mode === 'login'
              ? 'Multi-Tenant Workspace & Project Management'
              : 'Launch your dedicated, isolated team environment'}
          </p>
        </div>

        {/* Segmented Mode Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#100E17] border border-white/5 mb-5">
          <button
            type="button"
            onClick={() => handleModeSwitch('login')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-[#1C1829] text-[#C9B8FF] shadow-sm border border-[#C9B8FF]/20'
                : 'text-[#A6A1B5] hover:text-[#F8F6EF]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('signup')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-[#1C1829] text-[#C9B8FF] shadow-sm border border-[#C9B8FF]/20'
                : 'text-[#A6A1B5] hover:text-[#F8F6EF]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#A6A1B5] uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A6A1B5]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#100E17] border border-white/10 rounded-xl text-[#F8F6EF] placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#C9B8FF] focus:ring-1 focus:ring-[#C9B8FF] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#A6A1B5] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A6A1B5]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-sm bg-[#100E17] border border-white/10 rounded-xl text-[#F8F6EF] placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#C9B8FF] focus:ring-1 focus:ring-[#C9B8FF] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A6A1B5] hover:text-[#F8F6EF] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#C9B8FF] hover:bg-[#ded2ff] text-[#0B0A0F] font-semibold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(201,184,255,0.25)] hover:shadow-[0_0_30px_rgba(201,184,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B8FF]"
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
              <label className="block text-[11px] font-mono font-medium text-[#A6A1B5] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A6A1B5]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#100E17] border border-white/10 rounded-xl text-[#F8F6EF] placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#C9B8FF] focus:ring-1 focus:ring-[#C9B8FF] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#A6A1B5] uppercase tracking-wider mb-1">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A6A1B5]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#100E17] border border-white/10 rounded-xl text-[#F8F6EF] placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#C9B8FF] focus:ring-1 focus:ring-[#C9B8FF] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#A6A1B5] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A6A1B5]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-10 py-2 text-sm bg-[#100E17] border border-white/10 rounded-xl text-[#F8F6EF] placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#C9B8FF] focus:ring-1 focus:ring-[#C9B8FF] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A6A1B5] hover:text-[#F8F6EF] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#A6A1B5] uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A6A1B5]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#100E17] border border-white/10 rounded-xl text-[#F8F6EF] placeholder-[#A6A1B5]/50 focus:outline-none focus:border-[#C9B8FF] focus:ring-1 focus:ring-[#C9B8FF] transition-all"
                />
              </div>
            </div>

            {/* Tenant Isolation Notice */}
            <div className="p-2.5 rounded-lg bg-[#100E17] border border-[#C9B8FF]/15 text-[11px] text-[#A6A1B5] flex items-start gap-2">
              <Shield className="w-4 h-4 text-[#C9B8FF] shrink-0 mt-0.5" />
              <span>
                Your account will be provisioned with a private workspace isolated from all other organizations.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#C9B8FF] hover:bg-[#ded2ff] text-[#0B0A0F] font-semibold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(201,184,255,0.25)] hover:shadow-[0_0_30px_rgba(201,184,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B8FF]"
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

        {/* Footer switch prompt */}
        <div className="mt-5 text-center">
          <p className="text-xs text-[#A6A1B5]">
            {mode === 'login' ? "Don't have an account yet? " : 'Already have a workspace? '}
            <button
              type="button"
              onClick={() => handleModeSwitch(mode === 'login' ? 'signup' : 'login')}
              className="font-semibold text-[#C9B8FF] hover:text-[#ded2ff] hover:underline focus:outline-none"
            >
              {mode === 'login' ? 'Create new workspace' : 'Sign in to workspace'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

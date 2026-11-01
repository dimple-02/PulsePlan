import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  Home,
  ArrowLeft,
  LayoutDashboard,
  Compass,
  Sparkles,
  AlertCircle,
  FileQuestion,
  Kanban,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';

/**
 * Custom 404 Page Component for PulsePlan SaaS
 * 
 * Features:
 * - Native PulsePlan aesthetic matching dark & light mode tokens
 * - Inline lightweight vector illustration of a floating, disconnected Kanban task card
 * - Graceful browser history 'Go Back' with fallback
 * - Conditional 'Open Dashboard' CTA for authenticated team members
 * - Accessible, responsive, and respectful of prefers-reduced-motion
 */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGoBack = () => {
    // Safely check history stack length; fallback to root if arrived directly
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0A0F] text-[#191528] dark:text-[#F8F6EF] flex flex-col justify-between transition-colors duration-200 selection:bg-[#C9B8FF]/30 relative overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-br from-[#7C5CFC]/15 via-[#C9B8FF]/10 to-[#FFD6E8]/10 dark:from-[#C9B8FF]/15 dark:via-[#7C5CFC]/10 dark:to-[#FFD6E8]/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#C9B8FF]/10 dark:bg-[#C9B8FF]/5 blur-3xl pointer-events-none rounded-full" />

      {/* Minimal Top Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-inherit group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC] dark:focus-visible:ring-[#C9B8FF] rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-xl bg-[#EFEAFE] dark:bg-[#14121C] border border-[#7C5CFC]/30 dark:border-white/10 flex items-center justify-center text-[#5935D6] dark:text-[#C9B8FF] shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-[#191528] dark:text-[#F8F6EF]">
            Pulse<span className="text-[#5935D6] dark:text-[#C9B8FF]">Plan</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#EFEAFE]/60 dark:bg-white/5 border border-[#7C5CFC]/20 dark:border-white/10 text-[#5C576C] dark:text-[#A6A1B5]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Uncharted Route</span>
          </div>
          <ThemeToggle variant="navbar" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 text-center max-w-3xl mx-auto">
        {/* Central Visual: Floating Disconnected Kanban Card */}
        <div className="mb-8 relative w-full max-w-xs sm:max-w-sm">
          {/* Subtle dashed connector line showing detached path */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              className="w-full h-36 text-slate-300 dark:text-white/10"
              viewBox="0 0 320 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 10 60 C 90 10, 230 110, 310 60"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
              <circle cx="10" cy="60" r="4" fill="#7C5CFC" className="dark:fill-[#C9B8FF]" />
              <circle cx="310" cy="60" r="4" fill="#FFD6E8" />
            </svg>
          </div>

          {/* Elevated Floating Project Card */}
          <div className="relative mx-auto w-64 sm:w-72 bg-white dark:bg-[#14121C] border border-[#E4E0EC] dark:border-white/10 rounded-2xl p-4 shadow-[0_15px_35px_rgba(20,18,28,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] motion-reduce:hover:scale-100">
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50">
                  LOST-404
                </span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-[#A6A1B5]">
                  Sprint 0
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                Off Board
              </span>
            </div>

            {/* Card Body */}
            <div className="py-3 text-left">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-[#F8F6EF] leading-snug">
                Locate Requested SaaS View
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#A6A1B5] mt-1 line-clamp-2">
                URL coordinate not found in routing table. Node signal detached from active workspace.
              </p>
            </div>

            {/* Card Progress / Status */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-[#A6A1B5]">
              <div className="flex items-center gap-1 text-slate-500 dark:text-[#A6A1B5]">
                <FileQuestion className="w-3.5 h-3.5 text-[#5935D6] dark:text-[#C9B8FF]" />
                <span>0/1 Subtasks</span>
              </div>
              <div className="flex -space-x-1.5">
                <div className="w-5 h-5 rounded-full bg-[#EFEAFE] dark:bg-[#1C1926] border border-white dark:border-[#14121C] text-[9px] font-bold text-[#5935D6] dark:text-[#C9B8FF] flex items-center justify-center">
                  ?
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Eyebrow Label */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#EFEAFE] dark:bg-white/5 border border-[#7C5CFC]/20 dark:border-white/10 text-[#5935D6] dark:text-[#C9B8FF] mb-3">
          <Compass className="w-3.5 h-3.5" />
          <span>404 ERROR • RESOURCE NOT FOUND</span>
        </div>

        {/* Headline with Gradient Accent */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#191528] dark:text-[#F8F6EF] mb-3">
          Looks like this task went{' '}
          <span className="bg-gradient-to-r from-[#5935D6] via-[#7C5CFC] to-pink-500 dark:from-[#C9B8FF] dark:via-[#E2D4FF] dark:to-[#FFD6E8] bg-clip-text text-transparent">
            off the board.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-sm sm:text-base text-[#5C576C] dark:text-[#A6A1B5] max-w-xl mb-8 leading-relaxed">
          This page doesn't exist or may have moved. Check the URL for typos, or let's get you back on track to your projects.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
          {/* Back to Home CTA */}
          <Link
            to="/"
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-[#5935D6] hover:bg-[#4D2EC2] text-white dark:bg-gradient-to-r dark:from-[#C9B8FF] dark:to-[#FFD6E8] dark:text-[#0B0A0F] dark:hover:opacity-95 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#5935D6] dark:focus-visible:ring-[#C9B8FF]"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          {/* Safe Go Back CTA */}
          <button
            type="button"
            onClick={handleGoBack}
            className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-white dark:bg-[#14121C] text-[#191528] dark:text-[#F8F6EF] border border-[#E4E0EC] dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC] dark:focus-visible:ring-[#C9B8FF]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          {/* Conditional Open Dashboard CTA for Authenticated Users */}
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-[#EFEAFE] text-[#5935D6] hover:bg-[#E4DBFD] dark:bg-white/10 dark:text-[#C9B8FF] dark:hover:bg-white/15 border border-[#7C5CFC]/30 dark:border-[#C9B8FF]/20 shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC] dark:focus-visible:ring-[#C9B8FF]"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Open Dashboard</span>
            </Link>
          )}
        </div>

        {/* Helpful Shortcut Destinations */}
        <div className="mt-10 pt-6 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-[#A6A1B5]">
          <span className="font-medium text-slate-600 dark:text-slate-400">Quick destinations:</span>
          {isAuthenticated ? (
            <>
              <Link to="/kanban" className="hover:text-[#5935D6] dark:hover:text-[#C9B8FF] underline underline-offset-4 decoration-slate-300 dark:decoration-white/20 transition-colors">
                Kanban Board
              </Link>
              <span>•</span>
              <Link to="/projects" className="hover:text-[#5935D6] dark:hover:text-[#C9B8FF] underline underline-offset-4 decoration-slate-300 dark:decoration-white/20 transition-colors">
                Projects
              </Link>
              <span>•</span>
              <Link to="/team" className="hover:text-[#5935D6] dark:hover:text-[#C9B8FF] underline underline-offset-4 decoration-slate-300 dark:decoration-white/20 transition-colors">
                Team Workspace
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-[#5935D6] dark:hover:text-[#C9B8FF] underline underline-offset-4 decoration-slate-300 dark:decoration-white/20 transition-colors">
                Log In
              </Link>
              <span>•</span>
              <Link to="/signup" className="hover:text-[#5935D6] dark:hover:text-[#C9B8FF] underline underline-offset-4 decoration-slate-300 dark:decoration-white/20 transition-colors">
                Create Free Account
              </Link>
              <span>•</span>
              <Link to="/landing" className="hover:text-[#5935D6] dark:hover:text-[#C9B8FF] underline underline-offset-4 decoration-slate-300 dark:decoration-white/20 transition-colors">
                Product Tour
              </Link>
            </>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-400 dark:text-[#A6A1B5]/60">
        PulsePlan SaaS • Multi-Tenant Project Management System
      </footer>
    </div>
  );
}

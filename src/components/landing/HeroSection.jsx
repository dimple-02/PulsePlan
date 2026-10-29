import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2, ChevronDown } from 'lucide-react';
import Workspace3DVisual from './Workspace3DVisual';

/**
 * HeroSection Component
 * 
 * - Eyebrow label: "PROJECT MANAGEMENT, REIMAGINED"
 * - Headline: "Your projects. In sync." with lavender-to-pink text accent
 * - Supporting copy: "Bring projects, tasks and teams together in one organized workspace. Less chaos, clearer priorities, better progress."
 * - Two CTAs: "Get Started Free" and "Explore the Workspace"
 * - 3D minimal workspace composition
 */
export default function HeroSection({ onOpenSignup, onExploreWorkspace }) {
  return (
    <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 overflow-hidden">
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#C9B8FF]/[0.06] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-[#FFD6E8]/[0.04] rounded-full blur-[110px] pointer-events-none" />

      {/* Grid pattern with mask */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        {/* Eyebrow Label */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14121C]/90 border border-[#C9B8FF]/25 shadow-[0_0_15px_rgba(201,184,255,0.08)] mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9B8FF] animate-pulse" />
          <span className="text-[11px] sm:text-xs font-semibold tracking-widest text-[#C9B8FF] uppercase font-mono">
            Project Management, Reimagined
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F8F6EF] font-sans max-w-4xl mx-auto leading-[1.08] sm:leading-[1.1] mb-6">
          Your projects.{' '}
          <span className="inline-block bg-gradient-to-r from-[#C9B8FF] via-[#E2D5FF] to-[#FFD6E8] bg-clip-text text-transparent">
            In sync.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg lg:text-xl text-[#A6A1B5] max-w-2xl mx-auto font-normal leading-relaxed mb-9 sm:mb-11">
          Bring projects, tasks and teams together in one organized workspace.
          Less chaos, clearer priorities, better progress.
        </p>

        {/* Two CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-14 sm:mb-16">
          <button
            type="button"
            onClick={onOpenSignup}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-[#0B0A0F] bg-[#C9B8FF] hover:bg-[#ded2ff] px-6 py-3.5 rounded-xl transition-all duration-200 shadow-[0_0_25px_rgba(201,184,255,0.3)] hover:shadow-[0_0_35px_rgba(201,184,255,0.5)] hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B8FF]"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onExploreWorkspace}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm sm:text-base font-medium text-[#F8F6EF] bg-[#14121C] hover:bg-[#1C1926] border border-[#C9B8FF]/20 hover:border-[#C9B8FF]/40 px-6 py-3.5 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B8FF]/50"
          >
            <span>Explore the Workspace</span>
            <ChevronDown className="w-4 h-4 text-[#A6A1B5]" />
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#A6A1B5] mb-12 sm:mb-16">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C9B8FF]" />
            <span>Strict multi-tenant data boundaries</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C9B8FF]" />
            <span>Zero configuration required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C9B8FF]" />
            <span>Encrypted HTTP-only auth</span>
          </div>
        </div>

        {/* Main 3D Minimal Workspace Visual */}
        <div id="workspace-visual">
          <Workspace3DVisual />
        </div>
      </div>
    </section>
  );
}

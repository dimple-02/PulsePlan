import React, { useState, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Circle,
  MoreHorizontal,
  Plus,
} from 'lucide-react';

/**
 * Workspace3DVisual Component
 * 
 * An original, tasteful 3D-inspired composition communicating project management.
 * 
 * Features:
 * - Layered HTML interface panels in a 3D perspective environment
 * - Central project board with To Do, In Progress, Done columns
 * - Realistic task cards with priority badges and status chips
 * - Floating circular progress ring indicator (84% complete)
 * - Minimal abstract 3D faceted geometric elements
 * - Subtle status lights and depth shadows
 * - Mouse-tracking subtle tilt effect with smooth decay
 */
export default function Workspace3DVisual() {
  const containerRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 9, y: -7 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    // Restrained tilt angles: x controls Y rotation (-14 to 0), y controls X rotation (4 to 16)
    setRotate({
      x: 9 - y * 12,
      y: -7 + x * 14,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smooth reset to natural angle
    setRotate({ x: 9, y: -7 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-5xl mx-auto py-6 sm:py-10 perspective-1200 cursor-default select-none"
      style={{ perspective: '1200px' }}
    >
      {/* Ambient Studio Lighting (Gradients with very low opacity) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[75%] bg-gradient-to-tr from-[#C9B8FF]/[0.07] via-transparent to-[#FFD6E8]/[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-[#C9B8FF]/[0.08] rounded-full blur-[90px] pointer-events-none animate-pulse-subtle" />

      {/* 3D Stage Container */}
      <div
        className="relative transition-transform duration-300 ease-out preserve-3d"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Deep Floor Cast Shadow */}
        <div
          className="absolute inset-x-8 -bottom-10 h-24 bg-black/80 blur-2xl rounded-full"
          style={{ transform: 'translateZ(-40px) scale(0.95)' }}
        />

        {/* ============================================================
            MAIN CENTRAL INTERFACE PANEL: PROJECT WORKSPACE BOARD
            ============================================================ */}
        <div
          className="relative bg-[#14121C]/95 backdrop-blur-xl border border-[#C9B8FF]/20 rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(201,184,255,0.06)] overflow-hidden"
          style={{ transform: 'translateZ(0px)' }}
        >
          {/* Subtle Glass Glare Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9B8FF]/40 to-transparent pointer-events-none" />

          {/* Board Topbar */}
          <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#100E17]/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Traffic Light Dots */}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 inline-block" />
              </div>

              <div className="h-4 w-px bg-white/10 hidden sm:block" />

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#1C1926] border border-[#C9B8FF]/20 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-[#C9B8FF]" />
                </div>
                <span className="text-xs font-semibold text-[#F8F6EF] tracking-tight">
                  Core Engineering
                </span>
                <span className="text-[10px] text-[#A6A1B5] font-mono bg-[#1C1926] px-1.5 py-0.5 rounded border border-white/5">
                  sprint-24
                </span>
              </div>
            </div>

            {/* Right Status Meta */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1C1926] border border-[#C9B8FF]/15 text-[11px] text-[#C9B8FF]">
                <Shield className="w-3 h-3 text-[#C9B8FF]" />
                <span className="font-mono text-[10px]">org_tenant_prod</span>
              </div>

              <div className="flex -space-x-1.5 items-center">
                <div className="w-5 h-5 rounded-full bg-[#C9B8FF] text-[#0B0A0F] font-bold text-[9px] flex items-center justify-center border border-[#14121C]">
                  JL
                </div>
                <div className="w-5 h-5 rounded-full bg-[#FFD6E8] text-[#0B0A0F] font-bold text-[9px] flex items-center justify-center border border-[#14121C]">
                  SK
                </div>
                <div className="w-5 h-5 rounded-full bg-[#262234] text-[#A6A1B5] font-bold text-[9px] flex items-center justify-center border border-[#14121C]">
                  +3
                </div>
              </div>
            </div>
          </div>

          {/* Kanban Columns Grid: To Do, In Progress, Done */}
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gradient-to-b from-[#14121C] to-[#0F0D16]">
            {/* COLUMN 1: TO DO */}
            <div className="bg-[#100E17]/70 rounded-xl p-3 border border-white/[0.05] flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-white/[0.04]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="font-medium text-[#F8F6EF]">To Do</span>
                  <span className="text-[10px] text-[#A6A1B5] px-1.5 py-0.2 rounded bg-white/5 font-mono">
                    2
                  </span>
                </div>
                <button type="button" className="text-[#A6A1B5] hover:text-[#F8F6EF] p-0.5">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Task Card 1 */}
              <div className="bg-[#171421] p-3 rounded-lg border border-white/[0.06] hover:border-[#C9B8FF]/30 transition-colors shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-medium text-[#F8F6EF] leading-snug">
                    Multi-Tenant Boundary Isolation
                  </h4>
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    High
                  </span>
                </div>
                <p className="text-[11px] text-[#A6A1B5] line-clamp-2">
                  Enforce strict tenant data boundaries across MongoDB schemas and controllers.
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[10px] text-[#A6A1B5]">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-[#C9B8FF]">
                    #security
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#A6A1B5]" />
                    <span>Tomorrow</span>
                  </div>
                </div>
              </div>

              {/* Task Card 2 */}
              <div className="bg-[#171421] p-3 rounded-lg border border-white/[0.06] hover:border-[#C9B8FF]/30 transition-colors shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-medium text-[#F8F6EF] leading-snug">
                    Role-Based Access Guardrails
                  </h4>
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Medium
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] text-[#A6A1B5]">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-[#A6A1B5]">
                    #rbac
                  </span>
                  <span>2 subtasks</span>
                </div>
              </div>
            </div>

            {/* COLUMN 2: IN PROGRESS */}
            <div className="bg-[#100E17]/70 rounded-xl p-3 border border-white/[0.05] flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-white/[0.04]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C9B8FF] animate-pulse" />
                  <span className="font-medium text-[#F8F6EF]">In Progress</span>
                  <span className="text-[10px] text-[#C9B8FF] px-1.5 py-0.2 rounded bg-[#C9B8FF]/10 font-mono">
                    2
                  </span>
                </div>
                <button type="button" className="text-[#A6A1B5] hover:text-[#F8F6EF] p-0.5">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Task Card 1 (Active Highlight) */}
              <div className="bg-[#1C1829] p-3 rounded-lg border border-[#C9B8FF]/35 shadow-[0_4px_16px_rgba(201,184,255,0.08)] flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C9B8FF] to-[#FFD6E8]" />
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold text-[#F8F6EF] leading-snug">
                    Real-time WebSocket Kanban Feed
                  </h4>
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-500/20 text-[#C9B8FF] border border-indigo-400/30">
                    Urgent
                  </span>
                </div>
                <p className="text-[11px] text-[#A6A1B5]">
                  Propagate task column drag events with instant sub-50ms sync.
                </p>

                {/* Progress bar */}
                <div className="w-full bg-[#100E17] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#C9B8FF] to-[#FFD6E8] h-full rounded-full w-[75%]" />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/[0.05] text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-[#C9B8FF]/10 text-[#C9B8FF] font-medium">
                    #platform
                  </span>
                  <div className="flex items-center gap-1.5 text-[#C9B8FF]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>3 of 4 done</span>
                  </div>
                </div>
              </div>

              {/* Task Card 2 */}
              <div className="bg-[#171421] p-3 rounded-lg border border-white/[0.06] hover:border-[#C9B8FF]/30 transition-colors shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-medium text-[#F8F6EF] leading-snug">
                    Worktree Pipeline Automation
                  </h4>
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    High
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] text-[#A6A1B5]">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-[#A6A1B5]">
                    #devops
                  </span>
                  <span>Branch: pr-104</span>
                </div>
              </div>
            </div>

            {/* COLUMN 3: DONE */}
            <div className="bg-[#100E17]/70 rounded-xl p-3 border border-white/[0.05] flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-white/[0.04]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-medium text-[#F8F6EF]">Done</span>
                  <span className="text-[10px] text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10 font-mono">
                    2
                  </span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80" />
              </div>

              {/* Completed Card 1 */}
              <div className="bg-[#171421]/60 p-3 rounded-lg border border-emerald-500/20 shadow-sm flex flex-col gap-1.5 opacity-90">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-medium text-[#F8F6EF] line-through text-[#A6A1B5] leading-snug">
                    HTTP-Only Session Cookies
                  </h4>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] text-emerald-400/80">
                  <span>Audit Verified</span>
                  <span className="font-mono">PR #92</span>
                </div>
              </div>

              {/* Completed Card 2 */}
              <div className="bg-[#171421]/60 p-3 rounded-lg border border-emerald-500/20 shadow-sm flex flex-col gap-1.5 opacity-90">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-medium text-[#F8F6EF] line-through text-[#A6A1B5] leading-snug">
                    Dynamic Tenant Database Seeders
                  </h4>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] text-emerald-400/80">
                  <span>Completed</span>
                  <span className="font-mono">PR #88</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            LAYER 2: FLOATING 3D PROGRESS RING WIDGET (Top-Right Offset)
            ============================================================ */}
        <div
          className="absolute -top-6 -right-3 sm:-right-6 bg-[#181523]/95 backdrop-blur-xl border border-[#C9B8FF]/30 rounded-2xl p-4 shadow-[0_20px_45px_rgba(0,0,0,0.7),0_0_25px_rgba(201,184,255,0.12)] hidden sm:flex items-center gap-4 transition-transform duration-300 hover:border-[#C9B8FF]/50"
          style={{ transform: 'translateZ(55px)' }}
        >
          {/* Subtle Pink/Lavender Corner Glow */}
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#FFD6E8]/20 rounded-full blur-md pointer-events-none" />

          {/* Circular SVG Progress Ring */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r="25"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="30"
                cy="30"
                r="25"
                stroke="url(#lavenderGradient)"
                strokeWidth="5"
                strokeDasharray={157}
                strokeDashoffset={157 - (157 * 0.84)}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C9B8FF" />
                  <stop offset="100%" stopColor="#FFD6E8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-[#F8F6EF] tracking-tight">84%</span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9B8FF] animate-ping" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C9B8FF]">
                Active Sprint
              </span>
            </div>
            <div className="text-sm font-bold text-[#F8F6EF]">28 of 33 Done</div>
            <div className="text-[10px] text-[#A6A1B5] flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Velocity +28%</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            LAYER 3: FLOATING STATUS LIGHT & TENANT BADGE (Top-Left Offset)
            ============================================================ */}
        <div
          className="absolute -top-4 -left-2 sm:-left-6 bg-[#161320]/95 backdrop-blur-xl border border-[#C9B8FF]/25 rounded-xl px-3.5 py-2 shadow-[0_15px_35px_rgba(0,0,0,0.6)] hidden sm:flex items-center gap-2.5 transition-transform duration-300"
          style={{ transform: 'translateZ(45px)' }}
        >
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400/40 animate-ping inline-block" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#A6A1B5]">
              Isolation State
            </span>
            <span className="text-[11px] font-medium text-[#F8F6EF] flex items-center gap-1">
              <span>Tenant Protected</span>
              <Shield className="w-3 h-3 text-[#C9B8FF]" />
            </span>
          </div>
        </div>

        {/* ============================================================
            LAYER 4: FLOATING VELOCITY CHIP (Bottom-Left Offset)
            ============================================================ */}
        <div
          className="absolute -bottom-5 -left-2 sm:-left-4 bg-[#181523]/95 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2 shadow-[0_15px_35px_rgba(0,0,0,0.6)] hidden md:flex items-center gap-3 transition-transform duration-300"
          style={{ transform: 'translateZ(50px)' }}
        >
          <div className="w-7 h-7 rounded-lg bg-[#C9B8FF]/15 border border-[#C9B8FF]/30 flex items-center justify-center text-[#C9B8FF]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-[#A6A1B5]">Workspace Sync</div>
            <div className="text-xs font-semibold text-[#F8F6EF] flex items-center gap-1">
              <span>0 latency conflicts</span>
              <span className="text-[10px] text-emerald-400 font-mono">100%</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            LAYER 5: MINIMAL 3D GEOMETRIC OBJECT (Faceted Isometric Prism)
            ============================================================ */}
        <div
          className="absolute -bottom-6 -right-2 sm:-right-4 w-12 h-12 pointer-events-none hidden md:block"
          style={{
            transform: 'translateZ(65px)',
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="relative w-full h-full animate-float-subtle">
            {/* Minimal Faceted 3D Geometric Cube with CSS 3D Transforms */}
            <div
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C9B8FF]/30 to-[#FFD6E8]/20 border border-[#C9B8FF]/40 backdrop-blur-md shadow-[0_0_20px_rgba(201,184,255,0.3)] flex items-center justify-center"
              style={{
                transform: 'rotateX(45deg) rotateY(45deg)',
              }}
            >
              <div className="w-4 h-4 rounded-sm bg-[#C9B8FF]/60 blur-[1px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

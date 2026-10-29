import React, { useState } from 'react';
import {
  Layers,
  FolderKanban,
  CheckCircle2,
  Shield,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
  Kanban,
  Check,
  ChevronRight,
  Filter,
} from 'lucide-react';

/**
 * FeaturesSection Component
 * 
 * Editorial layout presenting the real product capabilities:
 * 1. Workspaces & Teams (Isolated data & role-based access)
 * 2. Projects & Tasks (Priorities, deadlines, task details)
 * 3. Kanban Workflow (5-column workflow visualization)
 * 4. Access Control (Secure HTTP-only auth & multi-tenant isolation)
 */
export default function FeaturesSection({ onOpenSignup }) {
  const [selectedWorkspace, setSelectedWorkspace] = useState('eng');

  return (
    <section id="features" className="relative py-24 sm:py-32 bg-[#0B0A0F] border-t border-white/[0.06] overflow-hidden">
      {/* Background Soft Lighting */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#C9B8FF]/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#FFD6E8]/[0.03] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14121C] border border-[#C9B8FF]/20 text-[#C9B8FF] text-[11px] font-mono uppercase tracking-wider mb-4">
            <Sparkles className="w-3 h-3" />
            <span>Built For Precision</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F8F6EF] font-sans leading-tight mb-5">
            Everything your team needs to move forward.
          </h2>
          <p className="text-base sm:text-lg text-[#A6A1B5] leading-relaxed">
            Engineered with strict multi-tenant boundaries and clean visual workflows.
            Every tool maps directly to how engineering and product teams ship deliverables.
          </p>
        </div>

        {/* ============================================================
            FEATURE 1: WORKSPACES & TEAMS (Large Editorial Block)
            ============================================================ */}
        <div className="mb-12 bg-gradient-to-br from-[#14121C] to-[#100E17] border border-white/[0.08] hover:border-[#C9B8FF]/25 rounded-2xl p-6 sm:p-10 shadow-2xl transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#1C1926] border border-[#C9B8FF]/25 flex items-center justify-center text-[#C9B8FF]">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-[#F8F6EF] tracking-tight">
                Workspaces & Teams
              </h3>
              <p className="text-sm sm:text-base text-[#A6A1B5] leading-relaxed">
                Organize workspaces with isolated data and role-based access. Switch between teams
                effortlessly while maintaining airtight multi-tenant separation.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-[#F8F6EF]">
                  <CheckCircle2 className="w-4 h-4 text-[#C9B8FF] shrink-0" />
                  <span>Dedicated tenant IDs with automated data partitioning</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#F8F6EF]">
                  <CheckCircle2 className="w-4 h-4 text-[#C9B8FF] shrink-0" />
                  <span>Granular roles: Admin, Member, and Viewer permissions</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#F8F6EF]">
                  <CheckCircle2 className="w-4 h-4 text-[#C9B8FF] shrink-0" />
                  <span>Team member invitations with email verification</span>
                </div>
              </div>
            </div>

            {/* UI Preview: Workspace Switcher Simulation */}
            <div className="lg:col-span-7 bg-[#0E0C14] border border-white/[0.08] rounded-xl p-5 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
                <span className="text-xs font-mono text-[#A6A1B5] uppercase tracking-wider">
                  Active Workspaces
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Data Isolated
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'eng',
                    name: 'Engineering Core',
                    role: 'Workspace Admin',
                    tenant: 'tenant_org_4892',
                    projects: 6,
                    members: 12,
                  },
                  {
                    id: 'mobile',
                    name: 'Mobile Client Apps',
                    role: 'Lead Developer',
                    tenant: 'tenant_org_9103',
                    projects: 4,
                    members: 8,
                  },
                  {
                    id: 'infra',
                    name: 'Infrastructure & DevOps',
                    role: 'Team Member',
                    tenant: 'tenant_org_3310',
                    projects: 3,
                    members: 5,
                  },
                ].map((ws) => (
                  <div
                    key={ws.id}
                    onClick={() => setSelectedWorkspace(ws.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedWorkspace === ws.id
                        ? 'bg-[#1C1829] border-[#C9B8FF]/40 shadow-[0_0_20px_rgba(201,184,255,0.06)]'
                        : 'bg-[#14121C]/60 border-white/[0.05] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          selectedWorkspace === ws.id
                            ? 'bg-[#C9B8FF] text-[#0B0A0F]'
                            : 'bg-[#221E2F] text-[#A6A1B5]'
                        }`}
                      >
                        {ws.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-[#F8F6EF]">
                            {ws.name}
                          </h4>
                          <span className="text-[10px] font-mono text-[#A6A1B5] bg-white/5 px-1.5 py-0.2 rounded hidden sm:inline-block">
                            {ws.tenant}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#A6A1B5] mt-0.5">
                          <span>{ws.role}</span>
                          <span>•</span>
                          <span>{ws.projects} projects</span>
                          <span>•</span>
                          <span>{ws.members} members</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedWorkspace === ws.id && (
                        <span className="w-5 h-5 rounded-full bg-[#C9B8FF]/20 border border-[#C9B8FF]/50 flex items-center justify-center text-[#C9B8FF]">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            FEATURE 2 & 3: SPLIT EDITORIAL COLUMNS
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* FEATURE 2: PROJECTS & TASKS */}
          <div className="bg-gradient-to-br from-[#14121C] to-[#100E17] border border-white/[0.08] hover:border-[#C9B8FF]/25 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300">
            <div className="space-y-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#1C1926] border border-[#C9B8FF]/25 flex items-center justify-center text-[#C9B8FF]">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#F8F6EF] tracking-tight">
                Projects & Tasks
              </h3>
              <p className="text-sm text-[#A6A1B5] leading-relaxed">
                Manage projects, priorities, deadlines and task details. Keep every milestone on
                track with actionable statuses and granular metadata.
              </p>
            </div>

            {/* UI Preview: Project & Task Card */}
            <div className="bg-[#0E0C14] border border-white/[0.07] rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#C9B8FF] uppercase tracking-wider">
                    PRJ-2026-CORE
                  </span>
                  <h4 className="text-sm font-semibold text-[#F8F6EF]">
                    Next-Gen API Gateway
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  On Schedule
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#A6A1B5] text-[11px]">Sprint Completion</span>
                  <span className="text-[#F8F6EF] font-mono text-[11px] font-semibold">
                    18 / 24 Tasks (75%)
                  </span>
                </div>
                <div className="w-full bg-[#181523] h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[#C9B8FF] to-[#FFD6E8] h-full rounded-full w-[75%]" />
                </div>
              </div>

              {/* Nested Task Chips */}
              <div className="space-y-1.5 pt-1">
                <div className="p-2 rounded-lg bg-[#14121C] border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9B8FF]" />
                    <span className="text-[#F8F6EF] font-medium text-[11px]">
                      Rate Limiter Redis Middleware
                    </span>
                  </div>
                  <span className="text-[10px] text-rose-300 bg-rose-500/10 px-1.5 py-0.2 rounded">
                    Urgent
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#14121C] border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[#A6A1B5] text-[11px] line-through">
                      Schema Validation Refactor
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">Done</span>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 3: KANBAN WORKFLOW */}
          <div className="bg-gradient-to-br from-[#14121C] to-[#100E17] border border-white/[0.08] hover:border-[#C9B8FF]/25 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300">
            <div className="space-y-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#1C1926] border border-[#C9B8FF]/25 flex items-center justify-center text-[#C9B8FF]">
                <Kanban className="w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#F8F6EF] tracking-tight">
                Kanban Workflow
              </h3>
              <p className="text-sm text-[#A6A1B5] leading-relaxed">
                Visualize task progress across workflow columns: Backlog, To Do, In Progress, In
                Review, and Done. Move cards with seamless clarity.
              </p>
            </div>

            {/* UI Preview: Mini 5-Column Kanban Representation */}
            <div className="bg-[#0E0C14] border border-white/[0.07] rounded-xl p-4">
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center text-[10px]">
                {[
                  { title: 'Backlog', count: 4, color: 'bg-slate-500' },
                  { title: 'To Do', count: 6, color: 'bg-sky-400' },
                  { title: 'In Prog', count: 3, color: 'bg-[#C9B8FF]' },
                  { title: 'Review', count: 2, color: 'bg-amber-400' },
                  { title: 'Done', count: 15, color: 'bg-emerald-400' },
                ].map((col) => (
                  <div key={col.title} className="bg-[#14121C] p-2 rounded-lg border border-white/5 flex flex-col items-center">
                    <span className={`w-1.5 h-1.5 rounded-full ${col.color} mb-1`} />
                    <span className="font-semibold text-[#F8F6EF] text-[10px] truncate w-full">
                      {col.title}
                    </span>
                    <span className="text-[#A6A1B5] text-[9px] font-mono mt-0.5">
                      {col.count}
                    </span>
                  </div>
                ))}
              </div>

              {/* Sample Dropped Card Preview */}
              <div className="mt-3 p-3 bg-[#171421] rounded-lg border border-[#C9B8FF]/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#C9B8FF] font-mono">TASK-104</span>
                  <span className="text-[9px] bg-[#C9B8FF]/15 text-[#C9B8FF] px-1.5 py-0.2 rounded font-medium">
                    Moving to In Review
                  </span>
                </div>
                <div className="text-xs font-medium text-[#F8F6EF]">
                  Automated Security Scan Policy
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#A6A1B5] pt-1">
                  <span>Priority: High</span>
                  <div className="w-4 h-4 rounded-full bg-[#C9B8FF] text-[#0B0A0F] font-bold text-[8px] flex items-center justify-center">
                    AL
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            FEATURE 4: ACCESS CONTROL & MULTI-TENANCY
            ============================================================ */}
        <div className="bg-gradient-to-br from-[#14121C] to-[#100E17] border border-white/[0.08] hover:border-[#C9B8FF]/25 rounded-2xl p-6 sm:p-10 shadow-2xl transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#1C1926] border border-[#C9B8FF]/25 flex items-center justify-center text-[#C9B8FF]">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-[#F8F6EF] tracking-tight">
                Access Control & Security
              </h3>
              <p className="text-sm sm:text-base text-[#A6A1B5] leading-relaxed">
                Support secure authentication and permission-aware collaboration. Rest easy
                knowing your data never leaks outside your designated tenant perimeter.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-[#0E0C14] border border-white/5">
                  <div className="text-xs font-semibold text-[#F8F6EF] mb-1">HTTP-Only Cookies</div>
                  <div className="text-[11px] text-[#A6A1B5]">Immune to XSS script theft</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0E0C14] border border-white/5">
                  <div className="text-xs font-semibold text-[#F8F6EF] mb-1">Bcrypt Encryption</div>
                  <div className="text-[11px] text-[#A6A1B5]">Salted password hashing</div>
                </div>
              </div>
            </div>

            {/* Architecture Preview Diagram */}
            <div className="lg:col-span-7 bg-[#0E0C14] border border-white/[0.08] rounded-xl p-5">
              <div className="text-xs font-mono text-[#A6A1B5] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#C9B8FF]" />
                <span>Multi-Tenant Request Pipeline</span>
              </div>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="p-2.5 rounded bg-[#14121C] border border-[#C9B8FF]/20 flex items-center justify-between text-[#F8F6EF]">
                  <span className="text-[#C9B8FF]">1. Incoming Request</span>
                  <span className="text-[#A6A1B5]">Header: x-workspace-id</span>
                </div>
                <div className="flex justify-center text-[#A6A1B5]">↓</div>
                <div className="p-2.5 rounded bg-[#171421] border border-white/10 flex items-center justify-between text-[#F8F6EF]">
                  <span className="text-[#FFD6E8]">2. Tenant Guardrail</span>
                  <span className="text-emerald-400">Identity & Role Verified</span>
                </div>
                <div className="flex justify-center text-[#A6A1B5]">↓</div>
                <div className="p-2.5 rounded bg-[#14121C] border border-emerald-500/20 flex items-center justify-between text-[#F8F6EF]">
                  <span className="text-emerald-300">3. Isolated Database Query</span>
                  <span className="text-emerald-400 font-semibold">&#123; workspaceId: active &#125;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

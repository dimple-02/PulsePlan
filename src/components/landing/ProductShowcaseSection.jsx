import React, { useState } from 'react';
import {
  Layers,
  LayoutDashboard,
  FolderKanban,
  Kanban,
  Users,
  Settings,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  Shield,
  TrendingUp,
  MoreVertical,
  Plus,
  Filter,
} from 'lucide-react';

/**
 * ProductShowcaseSection Component
 * 
 * Features a high-fidelity interactive mockup of the existing PulsePlan interface:
 * - Tab 1: Dashboard Overview (KPI metrics, Project progress bars, Activity feed)
 * - Tab 2: Kanban Board (5 workflow columns with realistic cards)
 * - Tab 3: Team & Permissions (Member table with roles & security status)
 */
export default function ProductShowcaseSection({ onOpenSignup }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <section id="preview" className="relative py-24 sm:py-32 bg-[#0B0A0F] border-t border-white/[0.06] overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-[#C9B8FF]/[0.04] rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14121C] border border-[#C9B8FF]/20 text-[#C9B8FF] text-[11px] font-mono uppercase tracking-wider mb-4">
            <Sparkles className="w-3 h-3" />
            <span>Product Showcase</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F8F6EF] font-sans leading-tight mb-4">
            Crafted for deep focus and execution.
          </h2>
          <p className="text-base sm:text-lg text-[#A6A1B5] leading-relaxed">
            Experience the actual PulsePlan interface. Explore how your organization monitors sprint
            momentum, task transitions, and team access.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-xl bg-[#14121C] border border-white/[0.08] shadow-lg">
            {[
              { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
              { id: 'kanban', label: 'Kanban Board', icon: Kanban },
              { id: 'team', label: 'Team & Permissions', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#C9B8FF] text-[#0B0A0F] font-semibold shadow-[0_0_15px_rgba(201,184,255,0.3)]'
                      : 'text-[#A6A1B5] hover:text-[#F8F6EF] hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mockup Application Window Container */}
        <div className="bg-[#12101A] border border-[#C9B8FF]/25 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden">
          {/* Mock Window Titlebar */}
          <div className="bg-[#0E0C15] px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>

            <div className="flex items-center gap-2 bg-[#171422] border border-white/5 px-4 py-1 rounded-lg text-[11px] font-mono text-[#A6A1B5] max-w-sm w-full justify-center">
              <Shield className="w-3 h-3 text-[#C9B8FF]" />
              <span>pulseplan.app/workspace/engineering-core</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#A6A1B5]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="hidden sm:inline-block text-[11px] font-mono">Synced</span>
            </div>
          </div>

          {/* Application Layout: Sidebar + Content */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
            {/* Mock Sidebar */}
            <div className="hidden md:block md:col-span-3 lg:col-span-2 bg-[#100E17] border-r border-white/[0.06] p-4 space-y-6">
              {/* Workspace Selector */}
              <div className="p-2.5 rounded-xl bg-[#171422] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#C9B8FF] text-[#0B0A0F] font-bold text-[10px] flex items-center justify-center">
                    EC
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-[#F8F6EF]">Eng Core</div>
                    <div className="text-[9px] text-[#A6A1B5] font-mono">tenant_4892</div>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'projects', label: 'Projects', icon: FolderKanban },
                  { id: 'kanban', label: 'Kanban Board', icon: Kanban },
                  { id: 'team', label: 'Team Members', icon: Users },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isCurrent = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => ['dashboard', 'kanban', 'team'].includes(item.id) && setActiveTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                        isCurrent
                          ? 'bg-[#1C1829] text-[#C9B8FF] border border-[#C9B8FF]/20 font-semibold'
                          : 'text-[#A6A1B5] hover:text-[#F8F6EF] hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tenant Status Footer */}
              <div className="pt-8 border-t border-white/[0.05]">
                <div className="text-[10px] font-mono text-[#A6A1B5] uppercase mb-1">Security Audit</div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Isolation Verified</span>
                </div>
              </div>
            </div>

            {/* Mock Main Content Area */}
            <div className="col-span-1 md:col-span-9 lg:col-span-10 p-5 sm:p-6 bg-[#13111C] overflow-x-auto">
              {/* Topbar Inside Mock */}
              <div className="flex flex-wrap items-center justify-between pb-5 border-b border-white/[0.06] mb-6 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#F8F6EF] capitalize">
                    {activeTab === 'dashboard'
                      ? 'Workspace Dashboard'
                      : activeTab === 'kanban'
                      ? 'Sprint 24 Kanban Board'
                      : 'Team Directory & Roles'}
                  </h3>
                  <p className="text-xs text-[#A6A1B5]">
                    Active organization: Engineering Core (Strict Isolation)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative hidden sm:block">
                    <Search className="w-3.5 h-3.5 text-[#A6A1B5] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      readOnly
                      placeholder="Search tasks, projects..."
                      className="bg-[#191624] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F8F6EF] placeholder-[#A6A1B5] w-48 focus:outline-none"
                    />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#C9B8FF] text-[#0B0A0F] font-bold text-xs flex items-center justify-center">
                    JL
                  </div>
                </div>
              </div>

              {/* ============================================================
                  TAB 1: DASHBOARD VIEW
                  ============================================================ */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* KPI Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    {[
                      { label: 'Active Projects', value: '12', change: '+3 this month', color: 'text-[#C9B8FF]' },
                      { label: 'Total Tasks', value: '48', change: '34 completed', color: 'text-emerald-400' },
                      { label: 'Completion Rate', value: '84%', change: '+12% vs last sprint', color: 'text-[#FFD6E8]' },
                      { label: 'Team Members', value: '8', change: 'All active', color: 'text-sky-300' },
                    ].map((metric) => (
                      <div key={metric.label} className="bg-[#181524] border border-white/[0.06] rounded-xl p-3.5">
                        <div className="text-[11px] text-[#A6A1B5] mb-1">{metric.label}</div>
                        <div className={`text-xl sm:text-2xl font-bold ${metric.color} font-mono`}>
                          {metric.value}
                        </div>
                        <div className="text-[10px] text-[#A6A1B5] mt-1">{metric.change}</div>
                      </div>
                    ))}
                  </div>

                  {/* Active Projects List */}
                  <div className="bg-[#181524] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-[#F8F6EF]">Active Deliverables</span>
                      <span className="text-[10px] font-mono text-[#C9B8FF]">View all</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { name: 'Core Microservices v2', tasks: '18/20', pct: 90, status: 'On Track' },
                        { name: 'Mobile Push Notifications', tasks: '12/16', pct: 75, status: 'Active' },
                        { name: 'Security Audit & RBAC Tests', tasks: '14/14', pct: 100, status: 'Completed' },
                      ].map((p) => (
                        <div key={p.name} className="p-3 bg-[#13111C] rounded-lg border border-white/5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[#F8F6EF]">{p.name}</span>
                            <span className="text-[10px] font-mono text-[#A6A1B5]">{p.tasks}</span>
                          </div>
                          <div className="w-full bg-[#1A1727] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#C9B8FF] to-[#FFD6E8] h-full rounded-full"
                              style={{ width: `${p.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                  TAB 2: KANBAN BOARD VIEW
                  ============================================================ */}
              {activeTab === 'kanban' && (
                <div className="animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Column 1: To Do */}
                    <div className="bg-[#181524] p-3 rounded-xl border border-white/[0.06] space-y-2.5">
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
                        <span className="font-semibold text-[#F8F6EF]">To Do</span>
                        <span className="text-[10px] font-mono text-[#A6A1B5] bg-white/5 px-1.5 py-0.2 rounded">2</span>
                      </div>
                      <div className="bg-[#12101B] p-2.5 rounded-lg border border-white/5 space-y-1.5">
                        <div className="text-xs font-medium text-[#F8F6EF]">Session Cookie Rotation</div>
                        <span className="text-[9px] bg-rose-500/15 text-rose-300 px-1.5 py-0.2 rounded inline-block">Urgent</span>
                      </div>
                      <div className="bg-[#12101B] p-2.5 rounded-lg border border-white/5 space-y-1.5">
                        <div className="text-xs font-medium text-[#F8F6EF]">Workspace Slug Validator</div>
                        <span className="text-[9px] bg-amber-500/15 text-amber-300 px-1.5 py-0.2 rounded inline-block">Medium</span>
                      </div>
                    </div>

                    {/* Column 2: In Progress */}
                    <div className="bg-[#181524] p-3 rounded-xl border border-white/[0.06] space-y-2.5">
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
                        <span className="font-semibold text-[#C9B8FF]">In Progress</span>
                        <span className="text-[10px] font-mono text-[#C9B8FF] bg-[#C9B8FF]/10 px-1.5 py-0.2 rounded">1</span>
                      </div>
                      <div className="bg-[#1A1729] p-2.5 rounded-lg border border-[#C9B8FF]/30 space-y-1.5">
                        <div className="text-xs font-semibold text-[#F8F6EF]">Real-Time Drag & Drop Sync</div>
                        <div className="w-full bg-[#12101B] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-[#C9B8FF] to-[#FFD6E8] h-full w-[80%]" />
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-[#A6A1B5]">
                          <span>Sprint 24</span>
                          <span className="text-[#C9B8FF]">80%</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Done */}
                    <div className="bg-[#181524] p-3 rounded-xl border border-white/[0.06] space-y-2.5">
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
                        <span className="font-semibold text-emerald-400">Done</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">2</span>
                      </div>
                      <div className="bg-[#12101B] p-2.5 rounded-lg border border-emerald-500/20 space-y-1">
                        <div className="text-xs font-medium text-[#A6A1B5] line-through">Bcrypt Salt Hardening</div>
                        <span className="text-[9px] text-emerald-400 font-mono">Passed QA</span>
                      </div>
                      <div className="bg-[#12101B] p-2.5 rounded-lg border border-emerald-500/20 space-y-1">
                        <div className="text-xs font-medium text-[#A6A1B5] line-through">Tenant Query Scopes</div>
                        <span className="text-[9px] text-emerald-400 font-mono">Merged</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                  TAB 3: TEAM & PERMISSIONS VIEW
                  ============================================================ */}
              {activeTab === 'team' && (
                <div className="bg-[#181524] border border-white/[0.06] rounded-xl overflow-hidden animate-in fade-in duration-300">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#13111D] border-b border-white/5 text-[#A6A1B5] font-mono text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-4">Member</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Access Scope</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {[
                        { name: 'Jordan Lee', email: 'jordan@pulseplan.dev', role: 'Owner / Admin', scope: 'Full Tenant Read/Write', status: 'Active' },
                        { name: 'Sarah Kim', email: 'sarah@pulseplan.dev', role: 'Lead Engineer', scope: 'Projects & Tasks', status: 'Active' },
                        { name: 'Marcus Chen', email: 'marcus@pulseplan.dev', role: 'Member', scope: 'Assigned Tasks', status: 'Away' },
                      ].map((m) => (
                        <tr key={m.email} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <div className="font-medium text-[#F8F6EF]">{m.name}</div>
                            <div className="text-[10px] text-[#A6A1B5] font-mono">{m.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#C9B8FF]/15 text-[#C9B8FF] border border-[#C9B8FF]/30">
                              {m.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#A6A1B5] text-[11px] font-mono">{m.scope}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>{m.status}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#A6A1B5] mb-4">
            Ready to test drive PulsePlan with your organization?
          </p>
          <button
            type="button"
            onClick={onOpenSignup}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B0A0F] bg-[#C9B8FF] hover:bg-[#ded2ff] px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(201,184,255,0.25)] hover:shadow-[0_0_30px_rgba(201,184,255,0.45)]"
          >
            <span>Create Your Free Workspace</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

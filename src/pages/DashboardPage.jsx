import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../hooks/useWorkspace';
import MetricCard from '../components/dashboard/MetricCard';
import ProjectProgressList from '../components/dashboard/ProjectProgressList';
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed';
import QuickTaskSummary from '../components/dashboard/QuickTaskSummary';
import PersonalizedOnboardingCard from '../components/dashboard/PersonalizedOnboardingCard';
import { Card, CardHeader, CardTitle, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * DashboardPage Component
 * 
 * Central hub for the active tenant workspace.
 * Uses useMemo for computing KPI metrics dynamically from activeWorkspace state.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { activeWorkspace, isLoading } = useWorkspace();

  // Compute metrics dynamically for the active tenant
  const metrics = useMemo(() => {
    if (!activeWorkspace) {
      return { totalProjects: 0, totalTasks: 0, completedTasks: 0, membersCount: 0 };
    }

    const projects = activeWorkspace.projects || [];
    const tasks = activeWorkspace.tasks || [];
    const completedTasks = tasks.filter((t) => t.status === 'done').length;

    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      completedTasks,
      membersCount: activeWorkspace.members?.length || 0,
      completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
    };
  }, [activeWorkspace]);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 dark:border-[#C9B8FF] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500 dark:text-[#A6A1B5] font-medium">Loading workspace data...</p>
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-[#A6A1B5]">
        No active workspace selected. Please pick a workspace from the sidebar.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Tenant Scope Banner */}
      <div className="bg-[#1E1B4B] bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 dark:bg-[#14121C] dark:from-[#191528] dark:via-[#14121C] dark:to-[#0B0A0F] border border-transparent dark:border-white/10 rounded-2xl p-6 text-white dark:text-[#F8F6EF] shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 dark:bg-[#C9B8FF]/20 text-indigo-200 dark:text-[#C9B8FF] border border-indigo-400/30 dark:border-[#C9B8FF]/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-300 dark:text-[#C9B8FF]" />
                <span>Multi-Tenant Architecture</span>
              </span>
              <span className="text-xs text-indigo-200 dark:text-[#A6A1B5]">
                Tenant ID: <code className="bg-indigo-950/60 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-[11px] dark:text-[#C9B8FF]">{activeWorkspace.id}</code>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:text-[#F8F6EF]">
              {activeWorkspace.name}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 dark:text-[#A6A1B5] mt-1 max-w-2xl leading-relaxed">
              {activeWorkspace.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/kanban"
              className="inline-flex items-center justify-center font-semibold rounded-lg text-sm px-4 py-2.5 gap-2 bg-white text-indigo-950 hover:bg-slate-100 dark:bg-gradient-to-r dark:from-[#C9B8FF] dark:to-[#FFD6E8] dark:text-[#0B0A0F] dark:hover:opacity-90 shadow-md transition-all select-none"
            >
              <span>View Kanban Board</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Ambient background glow decoration */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Personalized Onboarding Guidance Banner */}
      <PersonalizedOnboardingCard user={user} />

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Projects"
          value={metrics.totalProjects}
          subtext="Under management"
          icon={FolderKanban}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <MetricCard
          title="Total Tasks"
          value={metrics.totalTasks}
          subtext="Across all pipelines"
          icon={Clock}
          iconBg="bg-sky-50 text-sky-600"
        />
        <MetricCard
          title="Completed Tasks"
          value={metrics.completedTasks}
          subtext={`${metrics.completionRate}% completion velocity`}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          title="Team Members"
          value={metrics.membersCount}
          subtext="Active in tenant"
          icon={Users}
          iconBg="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <ProjectProgressList
            projects={activeWorkspace.projects || []}
          />
          <QuickTaskSummary
            tasks={activeWorkspace.tasks || []}
          />
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          <RecentActivityFeed
            activities={activeWorkspace.activities || []}
          />
        </div>
      </div>
    </div>
  );
}

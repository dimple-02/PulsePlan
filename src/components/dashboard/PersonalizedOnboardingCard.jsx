import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Code2,
  Users2,
  Briefcase,
  Laptop,
  Sparkles,
  Compass,
  Zap,
  Sliders,
  CheckCircle2,
  ArrowRight,
  X,
  FolderPlus,
  Kanban,
  Users,
} from 'lucide-react';

const ROLE_CONFIGS = {
  Student: {
    badge: 'Student Setup',
    icon: GraduationCap,
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    title: 'Coursework & College Projects Hub',
    description: 'Optimized for class assignments, lab reports, and semester group collaboration.',
    tips: [
      'Organize separate courses and labs into distinct projects',
      'Invite classmates with project-level collaborator permissions',
      'Track assignments from To Do to Submitted on the Kanban board',
    ],
    primaryAction: { label: 'Explore Kanban Board', to: '/kanban' },
    secondaryAction: { label: 'View Projects', to: '/projects' },
  },
  Developer: {
    badge: 'Developer Workflow',
    icon: Code2,
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/40',
    title: 'Sprint Backlog & Feature Pipelines',
    description: 'Structured for sprint cycles, feature branches, bug tracking, and code shipping.',
    tips: [
      'Organize tasks into Backlog, In Progress, Review, and Done',
      'Tag tasks with priority levels to highlight blocking bugs',
      'Reference task titles in branch names and pull requests',
    ],
    primaryAction: { label: 'Open Sprint Board', to: '/kanban' },
    secondaryAction: { label: 'Manage Projects', to: '/projects' },
  },
  'Team Lead': {
    badge: 'Team Lead Workflow',
    icon: Users2,
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
    title: 'Team Velocity & Delivery Coordination',
    description: 'Designed for sprint oversight, member collaboration, and team task assignment.',
    tips: [
      'Monitor task completion rates directly from dashboard metrics',
      'Invite team members and assign appropriate Admin or Member roles',
      'Coordinate cross-project deadlines and backlog priorities',
    ],
    primaryAction: { label: 'Manage Team Members', to: '/team' },
    secondaryAction: { label: 'View Kanban Board', to: '/kanban' },
  },
  'Project Manager': {
    badge: 'Project Management',
    icon: Briefcase,
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
    title: 'Milestone Tracking & Resource Planning',
    description: 'Configured for high-level roadmaps, deliverables, and team collaboration.',
    tips: [
      'Track real-time completion velocity across all pipelines',
      'Maintain clear project boundaries and team responsibilities',
      'Review workspace activity feed for team progress updates',
    ],
    primaryAction: { label: 'View All Projects', to: '/projects' },
    secondaryAction: { label: 'Team Directory', to: '/team' },
  },
  Freelancer: {
    badge: 'Freelance Workspace',
    icon: Laptop,
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    title: 'Client Deliverables & Contract Tracking',
    description: 'Structured for isolated client engagements, deadlines, and independent delivery.',
    tips: [
      'Isolate each client engagement into a dedicated project board',
      'Set strict due dates on key deliverables to stay ahead of client expectations',
      'Invite clients as project collaborators with Viewer permissions',
    ],
    primaryAction: { label: 'Manage Client Projects', to: '/projects' },
    secondaryAction: { label: 'Open Kanban', to: '/kanban' },
  },
  Other: {
    badge: 'Custom Productivity',
    icon: Sparkles,
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-[#C9B8FF] border-slate-200 dark:border-white/10',
    title: 'Custom Workflow Hub',
    description: 'Tailored for flexible productivity workflows, task management, and project execution.',
    tips: [
      'Create dedicated projects for major goals and initiatives',
      'Use the Kanban board to visualize daily progress',
      'Invite collaborators to work together seamlessly',
    ],
    primaryAction: { label: 'Go to Kanban Board', to: '/kanban' },
    secondaryAction: { label: 'View Projects', to: '/projects' },
  },
};

export default function PersonalizedOnboardingCard({ user }) {
  const onboarding = user?.onboarding;
  const userId = user?.id || user?._id || 'default';
  const storageKey = `pulseplan_dismiss_onboarding_guide_${userId}`;

  const [isDismissed, setIsDismissed] = useState(true); // Default true to avoid flash

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(storageKey);
      setIsDismissed(dismissed === 'true');
    } catch {
      setIsDismissed(false);
    }
  }, [storageKey]);

  // Do not show if dismissed or user never completed onboarding
  if (isDismissed || !onboarding?.completed || onboarding?.skipped) {
    return null;
  }

  const role = onboarding.role || 'Other';
  const experience = onboarding.experience || 'Some experience';
  const roleConfig = ROLE_CONFIGS[role] || ROLE_CONFIGS.Other;
  const RoleIcon = roleConfig.icon;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {}
  };

  return (
    <div className="bg-white dark:bg-[#14121C] border border-[#7C5CFC]/20 dark:border-white/10 rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Top Banner Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5935D6]/10 dark:bg-[#7C5CFC]/20 text-[#5935D6] dark:text-[#C9B8FF] flex items-center justify-center shrink-0">
            <RoleIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleConfig.badgeColor}`}
              >
                {roleConfig.badge}
              </span>
              {experience && (
                <span className="text-[11px] text-[#5C576C] dark:text-[#A6A1B5] font-medium flex items-center gap-1">
                  {experience === 'Beginner' && <Compass className="w-3 h-3 text-[#7C5CFC]" />}
                  {experience === 'Some experience' && <Sliders className="w-3 h-3 text-[#7C5CFC]" />}
                  {experience === 'Experienced' && <Zap className="w-3 h-3 text-[#7C5CFC]" />}
                  <span>{experience} level</span>
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#14121C] dark:text-[#F8F6EF] mt-1">
              {roleConfig.title}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          title="Dismiss guidance"
          className="text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF] p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs sm:text-sm text-[#5C576C] dark:text-[#A6A1B5] mt-2 leading-relaxed">
        {roleConfig.description}
      </p>

      {/* Recommendations & Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        {roleConfig.tips.map((tip, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-xs text-[#14121C] dark:text-[#F8F6EF]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#5935D6] dark:text-[#C9B8FF] shrink-0 mt-0.5" />
            <span className="leading-snug">{tip}</span>
          </div>
        ))}
      </div>

      {/* Contextual Experience Guidance (Conditional) */}
      {experience === 'Beginner' && (
        <div className="mb-4 p-3 rounded-xl bg-[#F5F2FF] dark:bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-xs text-[#5935D6] dark:text-[#C9B8FF] flex items-center gap-2">
          <Compass className="w-4 h-4 shrink-0" />
          <span>
            <strong>Beginner Guide:</strong> 1. Open Kanban → 2. Click "+ New Task" to add your first to-do → 3. Drag cards between columns as work progresses.
          </span>
        </div>
      )}

      {experience === 'Experienced' && (
        <div className="mb-4 p-3 rounded-xl bg-[#F5F2FF] dark:bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-xs text-[#5935D6] dark:text-[#C9B8FF] flex items-center gap-2">
          <Zap className="w-4 h-4 shrink-0" />
          <span>
            <strong>Power-User Setup:</strong> Multi-tenant isolation active. Use workspace switching and project-level member scoping to manage separate initiatives.
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          to={roleConfig.primaryAction.to}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#5935D6] hover:bg-[#4927BC] text-white dark:bg-[#7C5CFC] dark:hover:bg-[#6844F0] shadow-sm transition-all"
        >
          <span>{roleConfig.primaryAction.label}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          to={roleConfig.secondaryAction.to}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-[#14121C] dark:text-[#F8F6EF] transition-colors"
        >
          <span>{roleConfig.secondaryAction.label}</span>
        </Link>
      </div>
    </div>
  );
}

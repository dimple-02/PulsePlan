import React from 'react';
import { ArrowRight, Sparkles, Building2, LayoutGrid, BarChart3, CheckCircle2 } from 'lucide-react';

/**
 * HowItWorksSection Component
 * 
 * Clean 3-step section:
 * 1. Create your workspace
 * 2. Organize projects and tasks
 * 3. Track progress in one place
 * 
 * Connected visual timeline on desktop, vertical stack on mobile.
 */
export default function HowItWorksSection({ onOpenSignup }) {
  const steps = [
    {
      number: '01',
      title: 'Create your workspace',
      description:
        'Provision your dedicated organization boundary with automated multi-tenant partitioning in seconds.',
      icon: Building2,
      badge: 'Instant Setup',
      meta: 'Tenant ID provisioned automatically',
    },
    {
      number: '02',
      title: 'Organize projects and tasks',
      description:
        'Structure deliverables, set priority tiers, invite team members with granular roles, and attach deadlines.',
      icon: LayoutGrid,
      badge: 'Structured Clarity',
      meta: 'Customizable Kanban workflow columns',
    },
    {
      number: '03',
      title: 'Track progress in one place',
      description:
        'Monitor sprint momentum across visual Kanban columns, status transitions, and dynamic completion metrics.',
      icon: BarChart3,
      badge: 'Real-time Visibility',
      meta: 'Comprehensive workspace KPI dashboard',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 bg-[#0B0A0F] border-t border-white/[0.06] overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C9B8FF]/[0.03] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14121C] border border-[#C9B8FF]/20 text-[#C9B8FF] text-[11px] font-mono uppercase tracking-wider mb-4">
            <Sparkles className="w-3 h-3" />
            <span>Structured Process</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F8F6EF] font-sans leading-tight mb-4">
            From setup to execution in three steps.
          </h2>
          <p className="text-base sm:text-lg text-[#A6A1B5] leading-relaxed">
            No convoluted setups or endless configuration wizards. Begin organizing high-velocity work in seconds.
          </p>
        </div>

        {/* 3-Step Horizontal Connected Timeline */}
        <div className="relative">
          {/* Desktop Horizontal Connector Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9B8FF]/20 to-transparent -translate-y-8 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="bg-gradient-to-b from-[#14121C] to-[#100E17] border border-white/[0.08] hover:border-[#C9B8FF]/30 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl transition-all duration-300 group hover:-translate-y-1"
                >
                  <div>
                    {/* Top Step Number and Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-3xl sm:text-4xl font-extrabold text-[#C9B8FF] font-mono tracking-tight group-hover:text-[#FFD6E8] transition-colors">
                        {step.number}
                      </span>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#C9B8FF] bg-[#1C1926] border border-[#C9B8FF]/20 px-2.5 py-1 rounded-full">
                        {step.badge}
                      </span>
                    </div>

                    {/* Icon container */}
                    <div className="w-12 h-12 rounded-xl bg-[#1C1926] border border-[#C9B8FF]/20 flex items-center justify-center text-[#C9B8FF] mb-5 group-hover:border-[#C9B8FF]/40 transition-all">
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-bold text-[#F8F6EF] tracking-tight mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#A6A1B5] leading-relaxed mb-6">
                      {step.description}
                    </p>
                  </div>

                  {/* Bottom Meta */}
                  <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-[#A6A1B5]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C9B8FF] shrink-0" />
                    <span className="font-mono text-[11px]">{step.meta}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-14 sm:mt-16 text-center">
          <button
            type="button"
            onClick={onOpenSignup}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B0A0F] bg-[#C9B8FF] hover:bg-[#ded2ff] px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(201,184,255,0.25)] hover:shadow-[0_0_30px_rgba(201,184,255,0.45)]"
          >
            <span>Launch Your Workspace Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

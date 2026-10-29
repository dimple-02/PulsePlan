import React from 'react';
import { Shield, Key, Database, Server, Lock, Cpu, Sparkles } from 'lucide-react';

/**
 * ArchitectureSection Component
 * 
 * Details the underlying multi-tenant architecture, security guarantees,
 * and data isolation design for engineering and security evaluators.
 */
export default function ArchitectureSection() {
  const specs = [
    {
      icon: Shield,
      title: 'Tenant Boundary Isolation',
      desc: 'All database queries automatically bind to the active tenant ID, completely isolating organization records.',
    },
    {
      icon: Lock,
      title: 'HTTP-Only Session Cookies',
      desc: 'Authentication relies on secure, HttpOnly session cookies — eliminating token theft via malicious XSS scripts.',
    },
    {
      icon: Key,
      title: 'Bcrypt Password Hashing',
      desc: 'Industry-standard salting and hashing protocols ensure credentials cannot be reversed or rainbow-table compromised.',
    },
    {
      icon: Database,
      title: 'Scoped Database Schemas',
      desc: 'Foreign key references and indexed workspace fields guarantee high-speed retrieval with zero multi-tenant leakage.',
    },
  ];

  return (
    <section id="architecture" className="relative py-20 sm:py-28 bg-[#0B0A0F] border-t border-white/[0.06] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14121C] border border-[#C9B8FF]/20 text-[#C9B8FF] text-[11px] font-mono uppercase tracking-wider mb-4">
            <Cpu className="w-3 h-3" />
            <span>Under The Hood</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F8F6EF] font-sans leading-tight mb-4">
            Multi-tenant architecture by default.
          </h2>
          <p className="text-base text-[#A6A1B5] leading-relaxed">
            PulsePlan was conceived from the ground up for teams that require strict data segregation without
            sacrificing responsiveness or developer experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {specs.map((spec) => {
            const Icon = spec.icon;
            return (
              <div
                key={spec.title}
                className="bg-[#14121C]/80 border border-white/[0.06] hover:border-[#C9B8FF]/30 rounded-xl p-5 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#1C1926] border border-[#C9B8FF]/20 flex items-center justify-center text-[#C9B8FF] mb-4 group-hover:border-[#C9B8FF]/40 transition-all">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#F8F6EF] mb-2">
                  {spec.title}
                </h3>
                <p className="text-xs text-[#A6A1B5] leading-relaxed">
                  {spec.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

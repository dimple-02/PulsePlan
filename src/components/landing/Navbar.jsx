import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, Menu, X, Shield, Sparkles } from 'lucide-react';

/**
 * Landing Page Sticky Navigation Bar
 * 
 * - PulsePlan logo and wordmark on the left
 * - Features, How It Works, and Product Preview links in the middle
 * - "Sign In" subtle text button + "Get Started" primary lavender CTA
 * - Transparent over hero, subtle dark backdrop on scroll
 * - Responsive mobile drawer navigation
 */
export default function Navbar({ onOpenLogin, onOpenSignup }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Product Preview', href: '#preview' },
    { label: 'Architecture', href: '#architecture' },
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const topOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0B0A0F]/85 backdrop-blur-md border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-3.5'
          : 'bg-transparent border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <a
            href="#"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B8FF] rounded-lg p-1"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#1C1926] to-[#14121C] border border-[#C9B8FF]/25 shadow-[0_0_15px_rgba(201,184,255,0.15)] group-hover:border-[#C9B8FF]/50 transition-all duration-300">
              <Layers className="w-5 h-5 text-[#C9B8FF]" />
              <div className="absolute inset-0 rounded-xl bg-[#C9B8FF]/10 blur-sm group-hover:bg-[#C9B8FF]/20 transition-all" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight text-[#F8F6EF] font-sans">
                PulsePlan
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1C1926] text-[#C9B8FF] border border-[#C9B8FF]/20">
                v2.0
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-sm font-medium text-[#A6A1B5] hover:text-[#F8F6EF] transition-colors duration-200 focus:outline-none focus-visible:text-[#F8F6EF]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenLogin}
              className="text-sm font-medium text-[#A6A1B5] hover:text-[#F8F6EF] px-3.5 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B8FF]/50"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={onOpenSignup}
              className="relative inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B0A0F] bg-[#C9B8FF] hover:bg-[#ded2ff] px-4 py-2 rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(201,184,255,0.25)] hover:shadow-[0_0_25px_rgba(201,184,255,0.45)] hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B8FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0A0F]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSignup}
              className="text-xs font-semibold text-[#0B0A0F] bg-[#C9B8FF] hover:bg-[#ded2ff] px-3 py-1.5 rounded-lg"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#A6A1B5] hover:text-[#F8F6EF] rounded-lg hover:bg-[#14121C] border border-transparent hover:border-white/10 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B0A0F]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 pt-3 pb-6 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-3 py-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-sm font-medium text-[#A6A1B5] hover:text-[#F8F6EF] px-3 py-2 rounded-lg hover:bg-[#14121C] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="h-px bg-white/[0.08] my-2" />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full text-left text-sm font-medium text-[#A6A1B5] hover:text-[#F8F6EF] px-3 py-2 rounded-lg hover:bg-[#14121C] transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSignup();
                }}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#0B0A0F] bg-[#C9B8FF] hover:bg-[#ded2ff] py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(201,184,255,0.25)]"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

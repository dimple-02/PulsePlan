import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import ProductShowcaseSection from '../components/landing/ProductShowcaseSection';
import ArchitectureSection from '../components/landing/ArchitectureSection';
import Footer from '../components/landing/Footer';
import AuthModal from '../components/landing/AuthModal';

/**
 * LandingPage Component
 * 
 * Redesigned SaaS landing page for PulsePlan:
 * - Visual identity: Dark #0B0A0F, elevated #14121C, cyber lavender #C9B8FF, soft pink #FFD6E8
 * - Memorable Hero section with 3D project workspace composition
 * - Editorial Features layout showcasing real product capabilities
 * - 3-Step How It Works visual timeline
 * - Realistic Product Showcase mockup
 * - Technical Architecture & Isolation section
 * - Polished footer
 * - Unified centered Authentication Modal with smooth backdrop blur
 */
export default function LandingPage({ defaultAuthModal = null }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [authModalOpen, setAuthModalOpen] = useState(Boolean(defaultAuthModal));
  const [authModalMode, setAuthModalMode] = useState(defaultAuthModal || 'login');

  // If defaultAuthModal prop is provided or changes (e.g., accessed via /login or /signup)
  useEffect(() => {
    if (defaultAuthModal) {
      setAuthModalMode(defaultAuthModal);
      setAuthModalOpen(true);
    }
  }, [defaultAuthModal]);

  const handleOpenLogin = () => {
    if (isAuthenticated) {
      navigate('/');
      return;
    }
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const handleOpenSignup = () => {
    if (isAuthenticated) {
      navigate('/');
      return;
    }
    setAuthModalMode('signup');
    setAuthModalOpen(true);
  };

  const handleCloseModal = () => {
    setAuthModalOpen(false);
  };

  const handleExploreWorkspace = () => {
    const previewEl = document.getElementById('preview');
    if (previewEl) {
      const topOffset = 80;
      const elementPosition = previewEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0A0F] text-[#F8F6EF] antialiased selection:bg-[#C9B8FF] selection:text-[#0B0A0F] overflow-x-hidden font-sans">
      {/* Sticky Navigation Bar */}
      <Navbar
        onOpenLogin={handleOpenLogin}
        onOpenSignup={handleOpenSignup}
      />

      {/* Hero Section with 3D Workspace */}
      <HeroSection
        onOpenSignup={handleOpenSignup}
        onExploreWorkspace={handleExploreWorkspace}
      />

      {/* Editorial Features Section */}
      <FeaturesSection onOpenSignup={handleOpenSignup} />

      {/* 3-Step Connected Progression Timeline */}
      <HowItWorksSection onOpenSignup={handleOpenSignup} />

      {/* High-Fidelity Product Showcase */}
      <ProductShowcaseSection onOpenSignup={handleOpenSignup} />

      {/* Architecture & Multi-Tenant Security Section */}
      <ArchitectureSection />

      {/* Polished Compact Footer */}
      <Footer
        onOpenLogin={handleOpenLogin}
        onOpenSignup={handleOpenSignup}
      />

      {/* Centered Auth Modal with Backdrop Blur */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={handleCloseModal}
      />
    </div>
  );
}

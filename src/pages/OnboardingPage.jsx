import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';
import {
  Layers,
  GraduationCap,
  Code2,
  Users2,
  Briefcase,
  Laptop,
  Sparkles,
  CheckSquare,
  BookOpen,
  Users,
  Terminal,
  Target,
  User,
  Building,
  Building2,
  Globe,
  Compass,
  Sliders,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const ROLES = [
  {
    id: 'Student',
    title: 'Student',
    description: 'Coursework, assignments, lab work, and college group projects.',
    icon: GraduationCap,
  },
  {
    id: 'Developer',
    title: 'Developer',
    description: 'Feature development, sprint backlogs, bug tracking, and code shipping.',
    icon: Code2,
  },
  {
    id: 'Team Lead',
    title: 'Team Lead',
    description: 'Guiding engineering sprints, team velocity, and technical delivery.',
    icon: Users2,
  },
  {
    id: 'Project Manager',
    title: 'Project Manager',
    description: 'Timelines, resource planning, cross-functional roadmaps, and milestones.',
    icon: Briefcase,
  },
  {
    id: 'Freelancer',
    title: 'Freelancer',
    description: 'Client deliverables, multi-project contracts, and independent tasks.',
    icon: Laptop,
  },
  {
    id: 'Other',
    title: 'Other',
    description: 'Custom productivity workflows, operational tasks, and everyday planning.',
    icon: Sparkles,
  },
];

const GOALS = [
  {
    id: 'Personal task management',
    title: 'Personal task management',
    description: 'Organize personal to-dos, priorities, and daily checklists.',
    icon: CheckSquare,
  },
  {
    id: 'College projects',
    title: 'College projects',
    description: 'Collaborate with classmates on term papers, labs, and capstone projects.',
    icon: BookOpen,
  },
  {
    id: 'Team collaboration',
    title: 'Team collaboration',
    description: 'Coordinate shared tasks, updates, and member assignments across teams.',
    icon: Users,
  },
  {
    id: 'Software development',
    title: 'Software development',
    description: 'Manage agile sprints, feature backlogs, code reviews, and bug fixes.',
    icon: Terminal,
  },
  {
    id: 'Business and project management',
    title: 'Business and project management',
    description: 'Track strategic roadmaps, deadlines, client deliverables, and company goals.',
    icon: Target,
  },
];

const TEAM_SIZES = [
  {
    id: 'Just me',
    title: 'Just me',
    description: 'Solo productivity and personal task tracking.',
    icon: User,
  },
  {
    id: '2–5 people',
    title: '2–5 people',
    description: 'Small collaborative team or student project group.',
    icon: Users,
  },
  {
    id: '6–10 people',
    title: '6–10 people',
    description: 'Growing engineering squad or startup team.',
    icon: Building,
  },
  {
    id: '11–25 people',
    title: '11–25 people',
    description: 'Mid-sized department or cross-functional team.',
    icon: Building2,
  },
  {
    id: '25+ people',
    title: '25+ people',
    description: 'Large company, open-source organization, or enterprise.',
    icon: Globe,
  },
];

const EXPERIENCES = [
  {
    id: 'Beginner',
    title: 'Beginner',
    description: 'New to project management tools. Want clean, intuitive, guided workflows.',
    icon: Compass,
  },
  {
    id: 'Some experience',
    title: 'Some experience',
    description: 'Comfortable with Kanban boards, task lists, and sprint statuses.',
    icon: Sliders,
  },
  {
    id: 'Experienced',
    title: 'Experienced',
    description: 'Familiar with agile methodology, power-user shortcuts, and deep workflows.',
    icon: Zap,
  },
];

export default function OnboardingPage() {
  const { user, updateOnboarding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(user?.onboarding?.role || '');
  const [selectedGoals, setSelectedGoals] = useState(user?.onboarding?.goals || []);
  const [selectedTeamSize, setSelectedTeamSize] = useState(user?.onboarding?.teamSize || '');
  const [selectedExperience, setSelectedExperience] = useState(user?.onboarding?.experience || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Determine post-onboarding destination (e.g. pending redirect)
  const resolveDestination = () => {
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');
    const fromPath = location.state?.from?.pathname
      ? `${location.state.from.pathname}${location.state.from.search || ''}`
      : (typeof location.state?.from === 'string' ? location.state.from : null);

    const dest = fromPath || redirectParam || '/dashboard';
    // Prevent redirect loop to onboarding
    if (dest.startsWith('/onboarding')) {
      return '/dashboard';
    }
    return dest;
  };

  const handleNext = () => {
    setErrorMessage('');
    if (step < 4) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMessage('');
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const toggleGoal = (goalId) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await updateOnboarding({ skipped: true });
      navigate(resolveDestination(), { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to skip onboarding. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await updateOnboarding({
        skipped: false,
        role: selectedRole || undefined,
        goals: selectedGoals.length > 0 ? selectedGoals : undefined,
        teamSize: selectedTeamSize || undefined,
        experience: selectedExperience || undefined,
      });
      navigate(resolveDestination(), { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save preferences. Please try again.');
      setIsSubmitting(false);
    }
  };

  const canContinueStep1 = Boolean(selectedRole);
  const canContinueStep2 = selectedGoals.length > 0;
  const canContinueStep3 = Boolean(selectedTeamSize);
  const canFinishStep4 = Boolean(selectedExperience);

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0A0F] text-[#14121C] dark:text-[#F8F6EF] flex flex-col transition-colors duration-150">
      {/* Top Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#14121C]/70 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#5935D6] dark:bg-[#7C5CFC] flex items-center justify-center text-white shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">PulsePlan</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EFEAFE] dark:bg-[#7C5CFC]/20 text-[#5935D6] dark:text-[#C9B8FF] border border-[#7C5CFC]/20">
              Welcome
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="text-xs sm:text-sm font-medium text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 max-w-4xl mx-auto w-full">
        {/* Progress Bar & Step Header */}
        <div className="w-full max-w-2xl mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5C576C] dark:text-[#A6A1B5] uppercase tracking-wider mb-2">
            <span>Setup Progress</span>
            <span>Step {step} of 4</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#5935D6] to-[#7C5CFC] dark:from-[#7C5CFC] dark:to-[#C9B8FF] transition-all duration-300 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="w-full max-w-2xl mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: About You */}
        {step === 1 && (
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5935D6] dark:text-[#C9B8FF]">
                Step 1 · About You
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 mb-2">
                Let's get to know you
              </h1>
              <p className="text-sm sm:text-base text-[#5C576C] dark:text-[#A6A1B5]">
                What's your role? We'll tailor templates and sprint tools to how you work.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {ROLES.map((role) => {
                const IconComponent = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-4 rounded-xl text-left border transition-all flex items-start gap-3.5 relative select-none ${
                      isSelected
                        ? 'border-[#7C5CFC] bg-[#F5F2FF] dark:bg-[#7C5CFC]/15 dark:border-[#C9B8FF] ring-2 ring-[#7C5CFC]/30 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#14121C] hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#5935D6] text-white dark:bg-[#7C5CFC]'
                          : 'bg-slate-100 dark:bg-white/5 text-[#5C576C] dark:text-[#A6A1B5]'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pr-6">
                      <div className="font-semibold text-sm sm:text-base text-[#14121C] dark:text-[#F8F6EF]">
                        {role.title}
                      </div>
                      <div className="text-xs text-[#5C576C] dark:text-[#A6A1B5] mt-0.5 leading-relaxed">
                        {role.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#5935D6] dark:bg-[#7C5CFC] text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-sm font-medium text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canContinueStep1 || isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#5935D6] hover:bg-[#4927BC] text-white dark:bg-[#7C5CFC] dark:hover:bg-[#6844F0] disabled:opacity-40 disabled:pointer-events-none shadow-sm transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Your Goals */}
        {step === 2 && (
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5935D6] dark:text-[#C9B8FF]">
                Step 2 · Your Goals
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 mb-2">
                What brings you to PulsePlan?
              </h1>
              <p className="text-sm sm:text-base text-[#5C576C] dark:text-[#A6A1B5]">
                What will you primarily use PulsePlan for? Choose all that apply.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {GOALS.map((goal) => {
                const IconComponent = goal.icon;
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={`w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between relative select-none ${
                      isSelected
                        ? 'border-[#7C5CFC] bg-[#F5F2FF] dark:bg-[#7C5CFC]/15 dark:border-[#C9B8FF] ring-2 ring-[#7C5CFC]/30 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#14121C] hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 pr-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#5935D6] text-white dark:bg-[#7C5CFC]'
                            : 'bg-slate-100 dark:bg-white/5 text-[#5C576C] dark:text-[#A6A1B5]'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm sm:text-base text-[#14121C] dark:text-[#F8F6EF]">
                          {goal.title}
                        </div>
                        <div className="text-xs text-[#5C576C] dark:text-[#A6A1B5] mt-0.5">
                          {goal.description}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-[#5935D6] bg-[#5935D6] text-white dark:border-[#7C5CFC] dark:bg-[#7C5CFC]'
                          : 'border-slate-300 dark:border-white/20 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="text-sm font-medium text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canContinueStep2 || isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#5935D6] hover:bg-[#4927BC] text-white dark:bg-[#7C5CFC] dark:hover:bg-[#6844F0] disabled:opacity-40 disabled:pointer-events-none shadow-sm transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Team Size */}
        {step === 3 && (
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5935D6] dark:text-[#C9B8FF]">
                Step 3 · Team Size
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 mb-2">
                Who's working with you?
              </h1>
              <p className="text-sm sm:text-base text-[#5C576C] dark:text-[#A6A1B5]">
                How large is your team?
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {TEAM_SIZES.map((size) => {
                const IconComponent = size.icon;
                const isSelected = selectedTeamSize === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedTeamSize(size.id)}
                    className={`w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between relative select-none ${
                      isSelected
                        ? 'border-[#7C5CFC] bg-[#F5F2FF] dark:bg-[#7C5CFC]/15 dark:border-[#C9B8FF] ring-2 ring-[#7C5CFC]/30 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#14121C] hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 pr-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#5935D6] text-white dark:bg-[#7C5CFC]'
                            : 'bg-slate-100 dark:bg-white/5 text-[#5C576C] dark:text-[#A6A1B5]'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm sm:text-base text-[#14121C] dark:text-[#F8F6EF]">
                          {size.title}
                        </div>
                        <div className="text-xs text-[#5C576C] dark:text-[#A6A1B5] mt-0.5">
                          {size.description}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-[#5935D6] bg-[#5935D6] text-white dark:border-[#7C5CFC] dark:bg-[#7C5CFC]'
                          : 'border-slate-300 dark:border-white/20 bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="text-sm font-medium text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canContinueStep3 || isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#5935D6] hover:bg-[#4927BC] text-white dark:bg-[#7C5CFC] dark:hover:bg-[#6844F0] disabled:opacity-40 disabled:pointer-events-none shadow-sm transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Experience */}
        {step === 4 && (
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5935D6] dark:text-[#C9B8FF]">
                Step 4 · Experience
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 mb-2">
                How familiar are you with project management tools?
              </h1>
              <p className="text-sm sm:text-base text-[#5C576C] dark:text-[#A6A1B5]">
                We'll customize your dashboard onboarding hints and guidance level.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {EXPERIENCES.map((exp) => {
                const IconComponent = exp.icon;
                const isSelected = selectedExperience === exp.id;
                return (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setSelectedExperience(exp.id)}
                    className={`w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between relative select-none ${
                      isSelected
                        ? 'border-[#7C5CFC] bg-[#F5F2FF] dark:bg-[#7C5CFC]/15 dark:border-[#C9B8FF] ring-2 ring-[#7C5CFC]/30 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#14121C] hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 pr-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#5935D6] text-white dark:bg-[#7C5CFC]'
                            : 'bg-slate-100 dark:bg-white/5 text-[#5C576C] dark:text-[#A6A1B5]'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm sm:text-base text-[#14121C] dark:text-[#F8F6EF]">
                          {exp.title}
                        </div>
                        <div className="text-xs text-[#5C576C] dark:text-[#A6A1B5] mt-0.5">
                          {exp.description}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-[#5935D6] bg-[#5935D6] text-white dark:border-[#7C5CFC] dark:bg-[#7C5CFC]'
                          : 'border-slate-300 dark:border-white/20 bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="text-sm font-medium text-[#5C576C] dark:text-[#A6A1B5] hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={!canFinishStep4 || isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#5935D6] to-[#7C5CFC] hover:opacity-95 text-white dark:from-[#7C5CFC] dark:to-[#C9B8FF] dark:text-[#0B0A0F] disabled:opacity-40 disabled:pointer-events-none shadow-md transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving preferences...</span>
                    </>
                  ) : (
                    <>
                      <span>Finish Setup</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

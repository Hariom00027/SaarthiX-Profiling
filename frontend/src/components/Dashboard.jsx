import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  FaPlay,
  FaInfoCircle,
  FaCheck,
  FaBrain,
  FaChartLine,
  FaChartPie,
  FaCompass,
  FaGift,
  FaHeart,
  FaLightbulb,
  FaShieldAlt,
  FaUserCheck,
  FaChevronDown,
  FaBars,
  FaTimes,
} from 'react-icons/fa';

// Constants
const heroFeatures = [
  { icon: FaUserCheck, label: 'AI Based Profiling' },
  { icon: FaChartPie, label: 'Interest Analysis' },
  { icon: FaLightbulb, label: 'Psychometric Test' },
];

const featureCards = [
  {
    icon: FaBrain,
    title: 'Comprehensive Profiling',
    description:
      'Create detailed professional profiles with AI assistance. Build your complete career portfolio including skills, experience, and achievements for resumes and career planning.',
    items: [
      'AI-powered profile builder',
      'Multiple template options',
      'Cover letter generation',
      'Instant profile creation',
    ],
  },
  {
    icon: FaHeart,
    title: 'Interest Evaluation with Chatbot',
    description:
      'Engage with our intelligent chatbot to discover your genuine interests and passions. Get personalized guidance through interactive conversations about your career preferences.',
    items: [
      'Interactive AI chatbot',
      'Career interest discovery',
      'Personalized recommendations',
      'Real-time guidance',
    ],
  },
  {
    icon: FaCompass,
    title: 'Psychometric Assessment',
    description:
      'Take a comprehensive 120-question psychometric test that evaluates your aptitude, personality traits, and domain knowledge with AI-generated personalized insights.',
    items: [
      '3-section comprehensive test',
      'Aptitude & behavioral analysis',
      'AI-generated detailed report',
      'Career path recommendations',
    ],
  },
];

const processSteps = [
  {
    step: '1',
    title: 'Register',
    description:
      'Create your free account and provide basic information about your educational background.',
  },
  {
    step: '2',
    title: 'Assessment',
    description:
      'Complete our comprehensive questionnaire covering personality, interests, and preferences.',
  },
  {
    step: '3',
    title: 'Analysis',
    description:
      'Our system analyzes your responses using proven psychological frameworks and career models.',
  },
  {
    step: '4',
    title: 'Report',
    description:
      'Receive your detailed profile report with career recommendations and development suggestions.',
  },
];

const benefits = [
  {
    icon: FaGift,
    title: 'Completely Free',
    description:
      'No hidden costs or charges. Get comprehensive profiling insights at no cost to help you start your career journey.',
  },
  {
    icon: FaChartLine,
    title: 'Quick & Easy',
    description:
      'Complete the assessment in just 30-45 minutes and get instant results with detailed explanations.',
  },
  {
    icon: FaShieldAlt,
    title: 'Scientifically Backed',
    description:
      'Based on established psychological theories and validated assessment frameworks used by professionals.',
  },
  {
    icon: FaCheck,
    title: 'Actionable Insights',
    description:
      'Get specific recommendations for career paths, skill development, and next steps in your professional journey.',
  },
];

const faqItems = [
  {
    question: 'How long does the profiling assessment take?',
    answer:
      'The profiling assessment typically takes 30-45 minutes to complete. You can save your progress and return to finish it later if needed.',
  },
  {
    question: 'Is the profiling really free?',
    answer:
      'Yes, our profiling service is completely free with no hidden charges. You\'ll receive a comprehensive report at no cost.',
  },
  {
    question: 'How accurate are the career recommendations?',
    answer:
      'Our recommendations are based on scientifically validated assessment tools and extensive career data. While highly accurate, they should be considered as guidance alongside your own research and exploration.',
  },
  {
    question: 'Can I retake the assessment?',
    answer:
      'Yes, you can retake the assessment after 30 days. This allows you to see how your interests and preferences may evolve over time.',
  },
  {
    question: "What's the difference between basic and AI-based profiling?",
    answer:
      'Profiling provides fundamental insights into personality and interests. AI-based profiling offers more detailed analysis, predictive insights, and personalized recommendations using advanced algorithms.',
  },
];

const Dashboard = ({ onStartProfiling, onViewSaved, onPsychometricTest, onViewSavedReports }) => {
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = useCallback((index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleStart = () => {
    if (onStartProfiling) {
      onStartProfiling();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#151B54] via-[#1e2a7d] to-[#2d3e99] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.25),_transparent_60%)]" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16 md:py-20">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold tracking-wide uppercase">
                Profiling
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Profiling
              </h1>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-blue-100">
                Discover your strengths, interests, and career potential with our comprehensive profiling assessment. Get insights into your personality and career preferences.
              </p>
              <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {heroFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.label}
                      className="flex items-center gap-2 sm:gap-3 rounded-2xl bg-white/10 p-3 sm:p-4 backdrop-blur"
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold">{feature.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleStart}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-[#151B54] shadow-lg transition hover:bg-gray-100"
                >
                  <FaPlay className="h-4 w-4" />
                  Start Profiling
                </button>
                {isAuthenticated() && onViewSaved && (
                  <button
                    type="button"
                    onClick={onViewSaved}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/60 px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    📄 View Saved Profile
                  </button>
                )}
                <button
                  type="button"
                  onClick={onPsychometricTest}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/60 px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <FaLightbulb className="h-4 w-4" />
                  Psychometric Test
                </button>
                {isAuthenticated() && onViewSavedReports && (
                  <button
                    type="button"
                    onClick={onViewSavedReports}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/60 px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    📊 View Saved Reports
                  </button>
                )}
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/60 px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <FaInfoCircle className="h-4 w-4" />
                  How it works
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
          <div className="mb-8 sm:mb-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What's Included</h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600">
              Complete suite of tools to discover and develop your career potential
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-2xl sm:rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 shadow-sm">
                  <div className="mb-4 sm:mb-6 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{card.title}</h3>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">{card.description}</p>
                  <ul className="mt-4 sm:mt-6 space-y-2 text-xs sm:text-sm text-gray-700">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <FaCheck className="mt-0.5 sm:mt-1 h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-white py-12 sm:py-16" id="how-it-works">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 sm:mb-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How It Works</h2>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600">Simple 4-step process to complete your profiling</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {processSteps.map((step) => (
                <div
                  key={step.title}
                  className="relative rounded-2xl sm:rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-6 sm:p-8"
                >
                  <div className="mb-4 sm:mb-6 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-emerald-600 text-base sm:text-lg font-semibold text-white">
                    {step.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
          <div className="mb-8 sm:mb-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Why Choose Profiling?</h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600">Understand the advantages of our profiling service</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="flex flex-col sm:flex-row gap-4 rounded-2xl sm:rounded-3xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-sm"
                >
                  <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">{benefit.title}</h4>
                    <p className="mt-2 text-xs sm:text-sm text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 sm:mb-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600">Find answers to common questions about our profiling service</p>
            </div>
            <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
              {faqItems.map((item, index) => (
                <div
                  key={item.question}
                  className="overflow-hidden rounded-xl sm:rounded-2xl border border-emerald-100 bg-white transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left transition hover:bg-emerald-50"
                  >
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 pr-2">{item.question}</h3>
                      <FaChevronDown
                        className={`h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 transition flex-shrink-0 ${
                          openFaqIndex === index ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>
                  {openFaqIndex === index && (
                    <div className="border-t border-emerald-100 bg-emerald-50 px-4 sm:px-6 py-3 sm:py-4">
                      <p className="text-xs sm:text-sm text-gray-700">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;


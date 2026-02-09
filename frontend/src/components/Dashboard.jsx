import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  FaChevronDown,
  FaGift,
  FaChartLine,
  FaShieldAlt,
  FaCheck,
  FaRocket,
  FaArrowRight,
  FaStar,
  FaUsers,
  FaBolt,
} from 'react-icons/fa';

// Constants
const featureCards = [
  {
    icon: '📋',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    title: 'Comprehensive Profiling',
    description:
      'Build a detailed professional profile that reflects your skills, education, experience, and achievements helping you understand where you stand and where you can grow.',
    items: [
      'Guided profile creation',
      'Structured profile sections',
      'Cover letter support',
      'Quick and easy setup',
    ],
  },
  {
    icon: '💬',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    title: 'Interest Evaluation',
    description:
      'Discover what truly motivates you. Answer guided questions to identify your interests and preferences, and explore career paths that align naturally with them.',
    items: [
      'Guided interest questions',
      'Career discovery insights',
      'Personalized suggestions',
      'Clear next steps',
    ],
  },
  {
    icon: '🧠',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    title: 'Psychometric Assessment',
    description:
      'Gain deeper insight into your aptitude and working style. This assessment helps you understand your strengths, behaviour, and approach to learning and work.',
    items: [
      'Structured assessment questions',
      'Aptitude and behavioural insights',
      'Detailed evaluation report',
      'Career path suggestions',
    ],
  },
];

const processSteps = [
  {
    step: '1',
    title: 'Register',
    description: 'Create your free account and share basic details about your education and background.',
    icon: '👤',
    color: '#115FD5',
  },
  {
    step: '2',
    title: 'Assessment',
    description: 'Complete a structured questionnaire covering your interests, personality, and preferences.',
    icon: '📝',
    color: '#f59e0b',
  },
  {
    step: '3',
    title: 'Analysis',
    description: 'Your responses are carefully reviewed using proven assessment methods and career models.',
    icon: '⚡',
    color: '#8b5cf6',
  },
  {
    step: '4',
    title: 'Report',
    description: 'Receive a detailed profile report with clear insights, career suggestions, and next steps.',
    icon: '📊',
    color: '#10b981',
  },
];

const benefits = [
  {
    icon: FaGift,
    color: '#ec4899',
    title: 'Completely Free',
    description: 'No hidden charges. Access detailed profiling insights at no cost to help you begin your career journey.',
  },
  {
    icon: FaBolt,
    color: '#f59e0b',
    title: 'Quick & Easy',
    description: 'Complete the assessment in 30–45 minutes and receive clear results with simple explanations.',
  },
  {
    icon: FaShieldAlt,
    color: '#8b5cf6',
    title: 'Scientifically Backed',
    description: 'Built on established assessment frameworks used by professionals to ensure accuracy and reliability.',
  },
  {
    icon: FaRocket,
    color: '#10b981',
    title: 'Actionable Insights',
    description: 'Get practical recommendations for career paths, skill development, and future planning.',
  },
];

const faqItems = [
  {
    question: 'How long does the profiling assessment take?',
    answer: 'The assessment usually takes 30–45 minutes, depending on how thoughtfully you answer the questions.',
  },
  {
    question: 'Is the profiling really free?',
    answer: 'Yes. The profiling assessment is completely free, with no hidden charges or payment required.',
  },
  {
    question: 'How accurate are the career recommendations?',
    answer: 'The recommendations are based on your responses and proven assessment methods, making them reliable, practical, and relevant for career planning.',
  },
  {
    question: 'Can I retake the assessment?',
    answer: 'Yes. You can retake the assessment if your interests, goals, or preferences change over time.',
  },
  {
    question: "What's the difference between basic and advanced profiling?",
    answer: 'Basic profiling gives general insights, while advanced profiling provides deeper analysis, detailed reports, and clearer career direction.',
  },
];

const stats = [
  { value: '50K+', label: 'Students Profiled' },
  { value: '95%', label: 'Satisfaction Rate' },
  { value: '200+', label: 'Partner Institutes' },
  { value: '24/7', label: 'AI Support' },
];

const Dashboard = ({ onStartProfiling, onViewSaved, onPsychometricTest, onViewSavedReports }) => {
  const { isAuthenticated } = useAuth();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const toggleFaq = useCallback((index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleStart = () => {
    if (onStartProfiling) {
      onStartProfiling();
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a',
      color: 'white',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      overflowX: 'hidden',
    }}>
      {/* Inject Google Font, 3D Button Styles, and Responsive CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .hero-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
          pointer-events: none;
        }
        
        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        /* 3D Button Base Styles */
        .btn-3d {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 32px;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #fff;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transform-style: preserve-3d;
          transition: all 0.2s ease;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        
        .btn-3d::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s ease;
        }
        
        .btn-3d:hover::before {
          left: 100%;
        }
        
        .btn-3d:hover {
          transform: translateY(-4px);
        }
        
        .btn-3d:active {
          transform: translateY(2px);
        }
        
        /* Blue 3D Button */
        .btn-3d-blue {
          background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
          box-shadow: 
            0 6px 0 #1e40af,
            0 8px 20px rgba(59, 130, 246, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .btn-3d-blue:hover {
          box-shadow: 
            0 8px 0 #1e40af,
            0 12px 30px rgba(59, 130, 246, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .btn-3d-blue:active {
          box-shadow: 
            0 2px 0 #1e40af,
            0 4px 10px rgba(59, 130, 246, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        /* Yellow/Orange 3D Button */
        .btn-3d-yellow {
          background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%);
          color: #1f2937;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 6px 0 #d97706,
            0 8px 20px rgba(251, 191, 36, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }
        
        .btn-3d-yellow:hover {
          box-shadow: 
            0 8px 0 #d97706,
            0 12px 30px rgba(251, 191, 36, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }
        
        .btn-3d-yellow:active {
          box-shadow: 
            0 2px 0 #d97706,
            0 4px 10px rgba(251, 191, 36, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }
        
        /* Purple 3D Button */
        .btn-3d-purple {
          background: linear-gradient(180deg, #a78bfa 0%, #8b5cf6 100%);
          box-shadow: 
            0 6px 0 #7c3aed,
            0 8px 20px rgba(139, 92, 246, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .btn-3d-purple:hover {
          box-shadow: 
            0 8px 0 #7c3aed,
            0 12px 30px rgba(139, 92, 246, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .btn-3d-purple:active {
          box-shadow: 
            0 2px 0 #7c3aed,
            0 4px 10px rgba(139, 92, 246, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        /* Green 3D Button */
        .btn-3d-green {
          background: linear-gradient(180deg, #34d399 0%, #10b981 100%);
          box-shadow: 
            0 6px 0 #059669,
            0 8px 20px rgba(16, 185, 129, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .btn-3d-green:hover {
          box-shadow: 
            0 8px 0 #059669,
            0 12px 30px rgba(16, 185, 129, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .btn-3d-green:active {
          box-shadow: 
            0 2px 0 #059669,
            0 4px 10px rgba(16, 185, 129, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        /* Dark/Secondary 3D Button */
        .btn-3d-dark {
          background: linear-gradient(180deg, #4b5563 0%, #374151 100%);
          box-shadow: 
            0 6px 0 #1f2937,
            0 8px 20px rgba(55, 65, 81, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .btn-3d-dark:hover {
          box-shadow: 
            0 8px 0 #1f2937,
            0 12px 30px rgba(55, 65, 81, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .btn-3d-dark:active {
          box-shadow: 
            0 2px 0 #1f2937,
            0 4px 10px rgba(55, 65, 81, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        /* White 3D Button */
        .btn-3d-white {
          background: linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%);
          color: #115FD5;
          text-shadow: none;
          box-shadow: 
            0 6px 0 #d1d5db,
            0 8px 20px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 1);
        }
        
        .btn-3d-white:hover {
          box-shadow: 
            0 8px 0 #d1d5db,
            0 12px 30px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 1);
        }
        
        .btn-3d-white:active {
          box-shadow: 
            0 2px 0 #d1d5db,
            0 4px 10px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 1);
        }
        
        /* Cyan 3D Button */
        .btn-3d-cyan {
          background: linear-gradient(180deg, #22d3ee 0%, #06b6d4 100%);
          box-shadow: 
            0 6px 0 #0891b2,
            0 8px 20px rgba(6, 182, 212, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .btn-3d-cyan:hover {
          box-shadow: 
            0 8px 0 #0891b2,
            0 12px 30px rgba(6, 182, 212, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .btn-3d-cyan:active {
          box-shadow: 
            0 2px 0 #0891b2,
            0 4px 10px rgba(6, 182, 212, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        /* ========== RESPONSIVE STYLES ========== */
        
        /* Hero Section Responsive */
        .dashboard-hero-container {
          max-width: 1300px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 60px;
          position: relative;
          z-index: 2;
          width: 100%;
        }
        
        .dashboard-hero-content {
          flex: 1;
          max-width: 650px;
        }
        
        .dashboard-hero-title {
          font-size: 4rem;
          font-weight: 800;
          margin: 0 0 24px 0;
          line-height: 1.1;
        }
        
        .dashboard-hero-description {
          font-size: 1.2rem;
          line-height: 1.8;
          margin: 0 0 40px 0;
          max-width: 540px;
        }
        
        .dashboard-hero-cta {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 48px;
        }
        
        .dashboard-hero-stats {
          display: flex;
          gap: 40px;
          flex-wrap: wrap;
        }
        
        .dashboard-hero-stat-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .dashboard-robot-container {
          flex: 0 0 auto;
          position: relative;
        }
        
        .dashboard-robot-image {
          width: 420px;
          height: auto;
          object-fit: contain;
          position: relative;
          z-index: 1;
          animation: float 6s ease-in-out infinite;
        }
        
        .dashboard-robot-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(17, 95, 213, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          z-index: 0;
        }
        
        .dashboard-floating-badge {
          position: absolute;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .dashboard-floating-badge-left {
          top: 20%;
          left: -20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 10px 40px rgba(16, 185, 129, 0.3);
          animation: float 4s ease-in-out infinite;
        }
        
        .dashboard-floating-badge-right {
          bottom: 25%;
          right: -30px;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          box-shadow: 0 10px 40px rgba(139, 92, 246, 0.3);
          animation: float 5s ease-in-out infinite 1s;
        }
        
        /* Quick Actions Section */
        .dashboard-quick-actions {
          max-width: 1100px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 32px 40px;
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        /* Feature Cards Grid */
        .dashboard-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        
        /* Process Steps Grid */
        .dashboard-steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        
        /* Benefits Grid */
        .dashboard-benefits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        
        /* Section Titles */
        .dashboard-section-title {
          font-size: 2.2rem;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: #111827;
        }
        
        /* CTA Section */
        .dashboard-cta-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin: 0 0 16px 0;
        }
        
        /* Footer */
        .dashboard-footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .dashboard-footer-links {
          display: flex;
          gap: 32px;
          font-size: 0.9rem;
        }
        
        /* ========== TABLET STYLES (max-width: 1024px) ========== */
        @media (max-width: 1024px) {
          .dashboard-hero-container {
            flex-direction: column;
            text-align: center;
            gap: 40px;
            padding: 0 20px;
          }
          
          .dashboard-hero-content {
            max-width: 100%;
          }
          
          .dashboard-hero-title {
            font-size: 3rem;
          }
          
          .dashboard-hero-description {
            font-size: 1.1rem;
            margin-left: auto;
            margin-right: auto;
          }
          
          .dashboard-hero-cta {
            justify-content: center;
          }
          
          .dashboard-hero-stats {
            justify-content: center;
          }
          
          .dashboard-robot-image {
            width: 320px;
          }
          
          .dashboard-robot-glow {
            width: 300px;
            height: 300px;
          }
          
          .dashboard-floating-badge-left {
            left: 10px;
          }
          
          .dashboard-floating-badge-right {
            right: 10px;
          }
          
          .dashboard-features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .dashboard-steps-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .dashboard-benefits-grid {
            grid-template-columns: 1fr;
          }
        }
        
        /* ========== MOBILE STYLES (max-width: 768px) ========== */
        @media (max-width: 768px) {
          .hero-glow {
            width: 300px;
            height: 300px;
            filter: blur(80px);
          }
          
          .dashboard-hero-container {
            padding: 0 16px;
          }
          
          .dashboard-hero-title {
            font-size: 2.2rem;
          }
          
          .dashboard-hero-description {
            font-size: 1rem;
            margin-bottom: 28px;
            padding: 0 10px;
          }
          
          .dashboard-hero-cta {
            flex-direction: column;
            align-items: center;
            gap: 14px;
            margin-bottom: 36px;
            width: 100%;
            padding: 0 10px;
          }
          
          .dashboard-hero-cta .btn-3d {
            width: 100%;
            max-width: 300px;
          }
          
          .dashboard-hero-stats {
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
          }
          
          .dashboard-hero-stat-value {
            font-size: 1.6rem;
          }
          
          .dashboard-robot-container {
            order: -1;
          }
          
          .dashboard-robot-image {
            width: 220px;
          }
          
          .dashboard-robot-glow {
            width: 200px;
            height: 200px;
          }
          
          .dashboard-floating-badge {
            padding: 8px 12px;
            font-size: 0.75rem;
          }
          
          .dashboard-floating-badge-left {
            top: 10%;
            left: 0;
          }
          
          .dashboard-floating-badge-right {
            bottom: 15%;
            right: 0;
          }
          
          .dashboard-quick-actions {
            padding: 20px 16px;
            border-radius: 16px;
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            margin: 0 12px;
          }
          
          .dashboard-quick-actions .btn-3d {
            width: 100%;
            justify-content: center;
          }
          
          .dashboard-features-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .dashboard-steps-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .dashboard-benefits-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .dashboard-section-title {
            font-size: 1.6rem;
            padding: 0 10px;
          }
          
          .dashboard-cta-title {
            font-size: 1.75rem;
          }
          
          .dashboard-footer-content {
            flex-direction: column;
            text-align: center;
          }
          
          .dashboard-footer-links {
            gap: 20px;
          }
          
          .card-hover:hover {
            transform: none;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
        }
        
        /* ========== SMALL MOBILE STYLES (max-width: 480px) ========== */
        @media (max-width: 480px) {
          .dashboard-hero-container {
            padding: 0 8px;
          }
          
          .dashboard-hero-title {
            font-size: 1.75rem;
            line-height: 1.2;
          }
          
          .dashboard-hero-description {
            font-size: 0.9rem;
            line-height: 1.6;
          }
          
          .dashboard-hero-stats {
            gap: 16px;
          }
          
          .dashboard-hero-stat-value {
            font-size: 1.3rem;
          }
          
          .dashboard-robot-image {
            width: 160px;
          }
          
          .dashboard-robot-glow {
            width: 140px;
            height: 140px;
          }
          
          .btn-3d {
            padding: 12px 20px;
            font-size: 0.85rem;
            gap: 8px;
          }
          
          .dashboard-quick-actions {
            padding: 16px 12px;
            margin: 0 8px;
          }
          
          .dashboard-section-title {
            font-size: 1.3rem;
          }
          
          .dashboard-cta-title {
            font-size: 1.4rem;
          }
          
          .dashboard-floating-badge {
            display: none;
          }
        }
        
        /* ========== EXTRA SMALL MOBILE (max-width: 360px) ========== */
        @media (max-width: 360px) {
          .dashboard-hero-title {
            font-size: 1.5rem;
          }
          
          .dashboard-hero-description {
            font-size: 0.85rem;
          }
          
          .dashboard-robot-image {
            width: 140px;
          }
          
          .dashboard-robot-glow {
            width: 120px;
            height: 120px;
          }
          
          .btn-3d {
            padding: 10px 16px;
            font-size: 0.8rem;
          }
          
          .dashboard-section-title {
            font-size: 1.2rem;
          }
          
          .dashboard-cta-title {
            font-size: 1.25rem;
          }
          
          .dashboard-hero-stats {
            gap: 12px;
          }
          
          .dashboard-hero-stat-value {
            font-size: 1.1rem;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '90vh',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Background gradient blobs */}
        <div className="hero-glow" style={{ top: '-200px', left: '-100px', background: '#115FD5' }} />
        <div className="hero-glow" style={{ top: '50%', right: '-200px', background: '#8b5cf6' }} />
        <div className="hero-glow" style={{ bottom: '-100px', left: '30%', background: '#0ea5e9' }} />
        
        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          zIndex: 0,
        }} />

        <div className="dashboard-hero-container">
          {/* Left content */}
          <div className="dashboard-hero-content">
            {/* Feature highlights */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 16px)',
              borderRadius: '50px',
              marginBottom: 'clamp(16px, 3vw, 28px)',
            }}>
              <FaStar style={{ color: '#fbbf24', fontSize: 'clamp(10px, 2vw, 14px)' }} />
              <span style={{ color: '#fbbf24', fontSize: 'clamp(0.7rem, 2vw, 0.85rem)', fontWeight: '600' }}>
                Profile Assessment · Interest Analysis · Psychometric Test
              </span>
            </div>

            {/* Title */}
            <h1 className="dashboard-hero-title" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Profiling
            </h1>

            {/* Description */}
            <p className="dashboard-hero-description" style={{
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              Get clear insights into your personality, preferences, and direction—all designed to support better career decisions.
            </p>

            {/* CTA Buttons */}
            <div className="dashboard-hero-cta">
              <button
                type="button"
                onClick={handleStart}
                className="btn-3d btn-3d-blue"
              >
                🚀 Start Profiling
                <FaArrowRight style={{ fontSize: '14px' }} />
              </button>
            </div>

            {/* Stats */}
            <div className="dashboard-hero-stats">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="dashboard-hero-stat-value" style={{ color: '#115FD5' }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontWeight: '500',
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Robot illustration */}
          <div className="dashboard-robot-container">
            {/* Glowing circle behind robot */}
            <div className="dashboard-robot-glow" />
            
            <img 
              src="/saarthix-robot.png" 
              alt="SaarthiX AI Robot"
              className="dashboard-robot-image"
            />
            
            {/* Floating elements */}
            <div className="dashboard-floating-badge dashboard-floating-badge-left">
              <FaCheck style={{ fontSize: '14px' }} />
              <span>AI Analysis</span>
            </div>
            
            <div className="dashboard-floating-badge dashboard-floating-badge-right">
              <FaUsers style={{ fontSize: '14px' }} />
              <span>50K+ Users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Buttons */}
      <section style={{
        padding: 'clamp(24px, 5vw, 40px) clamp(12px, 3vw, 24px) clamp(36px, 6vw, 60px)',
        position: 'relative',
        zIndex: 10,
        background: 'white',
      }}>
        <div className="dashboard-quick-actions">
          <button
            type="button"
            onClick={handleStart}
            className="btn-3d btn-3d-blue"
            style={{ padding: '14px 28px', fontSize: '0.95rem' }}
          >
            🚀 Start Profiling
          </button>
          
          {isAuthenticated() && onViewSaved && (
            <button
              type="button"
              onClick={onViewSaved}
              className="btn-3d btn-3d-yellow"
              style={{ padding: '14px 28px', fontSize: '0.95rem' }}
            >
              📄 View Saved Profile
            </button>
          )}

          <button
            type="button"
            onClick={onPsychometricTest}
            className="btn-3d btn-3d-purple"
            style={{ padding: '14px 28px', fontSize: '0.95rem' }}
          >
            🧠 Psychometric Test
          </button>

          {isAuthenticated() && onViewSavedReports && (
            <button
              type="button"
              onClick={onViewSavedReports}
              className="btn-3d btn-3d-green"
              style={{ padding: '14px 28px', fontSize: '0.95rem' }}
            >
              📊 View Saved Reports
            </button>
          )}

          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            className="btn-3d btn-3d-dark"
            style={{ padding: '14px 28px', fontSize: '0.95rem' }}
          >
            How It Works
          </button>
        </div>
      </section>

      {/* What's Included Section */}
      <section style={{
        padding: 'clamp(48px, 8vw, 80px) clamp(12px, 3vw, 24px)',
        position: 'relative',
        background: '#f9fafb',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 6vw, 60px)' }}>
            <h2 className="dashboard-section-title">
              What's Included
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              maxWidth: '500px',
              margin: '0 auto',
              padding: '0 16px',
            }}>
              A complete set of tools to help you understand your profile and plan your next steps with clarity.
            </p>
          </div>

          <div className="dashboard-features-grid">
            {featureCards.map((card, index) => (
              <div
                key={card.title}
                className="card-hover"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 'clamp(14px, 2vw, 20px)',
                  padding: 'clamp(20px, 4vw, 32px)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                }}
              >
                {/* Gradient accent on hover */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: card.gradient,
                  opacity: hoveredCard === index ? 1 : 0.3,
                  transition: 'opacity 0.3s ease',
                }} />
                
                <div className="feature-card-icon" style={{
                  width: 'clamp(48px, 10vw, 64px)',
                  height: 'clamp(48px, 10vw, 64px)',
                  borderRadius: 'clamp(12px, 2vw, 16px)',
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(20px, 4vw, 28px)',
                  marginBottom: 'clamp(16px, 3vw, 24px)',
                  boxShadow: `0 10px 30px ${card.gradient.includes('#10b981') ? 'rgba(16, 185, 129, 0.2)' : card.gradient.includes('#f59e0b') ? 'rgba(245, 158, 11, 0.2)' : 'rgba(139, 92, 246, 0.2)'}`,
                }}>
                  {card.icon}
                </div>
                
                <h3 style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 12px 0',
                }}>
                  {card.title}
                </h3>
                
                <p style={{
                  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                  color: '#6b7280',
                  lineHeight: '1.6',
                  margin: '0 0 clamp(16px, 3vw, 24px) 0',
                }}>
                  {card.description}
                </p>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {card.items.map((item) => (
                    <li
                      key={item}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                        color: '#374151',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: card.gradient.includes('#10b981') ? '#10b981' : card.gradient.includes('#f59e0b') ? '#f59e0b' : '#8b5cf6',
                        flexShrink: 0,
                      }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{
        padding: 'clamp(48px, 8vw, 80px) clamp(12px, 3vw, 24px)',
        background: 'white',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 6vw, 60px)' }}>
            <h2 className="dashboard-section-title">
              How It Works
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              maxWidth: '500px',
              margin: '0 auto',
              padding: '0 16px',
            }}>
              Simple 4-step process to complete your profiling
            </p>
          </div>

          <div className="dashboard-steps-grid">
            {processSteps.map((step, index) => (
              <div
                key={step.title}
                className="card-hover"
                style={{
                  background: step.color === '#115FD5' || step.color === '#8b5cf6' ? '#e8f0fc' : '#fef3c7',
                  border: 'none',
                  borderRadius: 'clamp(14px, 2vw, 20px)',
                  padding: 'clamp(20px, 4vw, 32px)',
                  textAlign: 'left',
                  position: 'relative',
                }}
              >
                <div style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: '700',
                  color: step.color,
                  marginBottom: '10px',
                }}>
                  {step.step}
                </div>
                
                <h3 style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 8px 0',
                }}>
                  {step.title}
                </h3>
                
                <p style={{
                  fontSize: 'clamp(0.8rem, 2vw, 0.85rem)',
                  color: '#6b7280',
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section style={{
        padding: 'clamp(48px, 8vw, 80px) clamp(12px, 3vw, 24px)',
        background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 6vw, 60px)' }}>
            <h2 className="dashboard-section-title">
              Why Choose Profiling?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              maxWidth: '500px',
              margin: '0 auto',
              padding: '0 16px',
            }}>
              Understand the advantages of our profiling service
            </p>
          </div>

          <div className="dashboard-benefits-grid">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="card-hover"
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 'clamp(12px, 2vw, 16px)',
                    padding: 'clamp(16px, 3vw, 24px)',
                    display: 'flex',
                    gap: 'clamp(12px, 2vw, 20px)',
                    alignItems: 'flex-start',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div style={{
                    width: 'clamp(44px, 8vw, 52px)',
                    height: 'clamp(44px, 8vw, 52px)',
                    borderRadius: 'clamp(10px, 2vw, 12px)',
                    background: `${benefit.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon style={{ fontSize: 'clamp(18px, 3vw, 22px)', color: benefit.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 6px 0',
                    }}>
                      {benefit.title}
                    </h4>
                    <p style={{
                      fontSize: 'clamp(0.8rem, 2vw, 0.85rem)',
                      color: '#6b7280',
                      margin: 0,
                      lineHeight: '1.5',
                    }}>
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{
        padding: 'clamp(48px, 8vw, 80px) clamp(12px, 3vw, 24px)',
        background: 'white',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 6vw, 60px)' }}>
            <h2 className="dashboard-section-title">
              Frequently Asked Questions
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              maxWidth: '500px',
              margin: '0 auto',
              padding: '0 16px',
            }}>
              Find answers to common questions about our profiling service
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqItems.map((item, index) => (
              <div
                key={item.question}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  boxShadow: openFaqIndex === index ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  style={{
                    width: '100%',
                    padding: 'clamp(14px, 3vw, 20px) clamp(16px, 3vw, 24px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                    fontWeight: '500',
                    color: '#111827',
                  }}>
                    {item.question}
                  </span>
                  <FaChevronDown
                    style={{
                      fontSize: '14px',
                      color: '#9ca3af',
                      transition: 'transform 0.3s ease',
                      transform: openFaqIndex === index ? 'rotate(180deg)' : 'rotate(0)',
                      flexShrink: 0,
                    }}
                  />
                </button>
                {openFaqIndex === index && (
                  <div style={{
                    padding: '0 clamp(16px, 3vw, 24px) clamp(14px, 2vw, 20px) clamp(16px, 3vw, 24px)',
                    color: '#6b7280',
                    fontSize: 'clamp(0.85rem, 2vw, 0.9rem)',
                    lineHeight: '1.7',
                  }}>
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: 'clamp(48px, 8vw, 80px) clamp(12px, 3vw, 24px)',
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, #115FD5 0%, #0ea5e9 50%, #06b6d4 100%)',
          borderRadius: 'clamp(16px, 3vw, 24px)',
          padding: 'clamp(32px, 6vw, 60px) clamp(20px, 4vw, 40px)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 className="dashboard-cta-title">
              Ready to Get Clear Insights?
            </h2>
            <p style={{
              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0 0 clamp(24px, 4vw, 32px) 0',
              maxWidth: '500px',
              marginLeft: 'auto',
              marginRight: 'auto',
              padding: '0 8px',
            }}>
              Complete your profiling and receive clear insights, career suggestions, and next steps—all designed to support better career decisions.
            </p>
            <button
              type="button"
              onClick={handleStart}
              className="btn-3d btn-3d-white"
              style={{ padding: 'clamp(14px, 2vw, 18px) clamp(28px, 4vw, 44px)', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}
            >
              Start Profiling
              <FaArrowRight style={{ fontSize: '16px' }} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: 'clamp(24px, 4vw, 32px) clamp(12px, 3vw, 24px)',
        background: '#1f2937',
        color: 'white',
      }}>
        <div className="dashboard-footer-content">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#115FD5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '14px',
            }}>
              S
            </div>
            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>SaarthiX</span>
          </div>

          <div className="dashboard-footer-links">
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Contact</a>
          </div>

          <p style={{
            fontSize: '0.85rem',
            color: '#9ca3af',
            margin: 0,
          }}>
            ©2026 saarthix all right reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;

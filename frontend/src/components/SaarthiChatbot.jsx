import React, { useState, useEffect, useRef } from 'react';
import { generateQuestions, sendChatMessage, evaluateInterests } from '../api';
import { downloadProfileAsPDF } from '../utils/downloadProfile';
import { notifyError, notifySuccess } from '../utils/notifications';

const CHAT_STORAGE_KEY = 'saarthi_chatbot_state_v1';

const SaarthiChatbot = ({ userProfile, onRegenerateProfile }) => {
  const [chatState, setChatState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const messagesEndRef = useRef(null);
  const evaluationResultsRef = useRef(null);
  const inputRef = useRef(null);
  const hasRestoredRef = useRef(false);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Use scrollTop on parent container to avoid stealing focus from input
      const messagesContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (messagesContainer) {
        // Scroll without affecting focus
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } else {
        // Fallback: use scrollIntoView but prevent it from affecting focus
        const activeElement = document.activeElement;
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Restore focus if it was on the input
        if (activeElement === inputRef.current) {
          requestAnimationFrame(() => {
            inputRef.current?.focus();
          });
        }
      }
    }
  };

  useEffect(() => {
    // Delay scroll slightly to avoid interfering with focus
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 10);
    return () => clearTimeout(timer);
  }, [messages]);

  // Refocus input after bot responds (when loading completes)
  useEffect(() => {
    if (!isLoading && !isEvaluating && !isComplete && inputRef.current && messages.length > 0) {
      // Use requestAnimationFrame for better timing with scroll
      requestAnimationFrame(() => {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 200);
      });
    }
  }, [isLoading, isEvaluating, isComplete, messages.length]);

  // Restore chatbot state from localStorage on mount
  useEffect(() => {
    if (!userProfile || hasRestoredRef.current) return;
    
    hasRestoredRef.current = true;
    let restored = false;

    // Try to restore from localStorage first
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        if (parsed && parsed.chatState && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setChatState(parsed.chatState);
          setMessages(parsed.messages);
          setIsComplete(Boolean(parsed.isComplete));
          setEvaluationResult(parsed.evaluationResult || null);
          restored = true;
        }
      }
    } catch (e) {
      console.warn('Failed to restore chatbot state from localStorage:', e);
      // Clear corrupted data
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }

    // If nothing was restored, initialize normally
    if (!restored) {
      initializeChatbot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  // Save chatbot state to localStorage whenever it changes
  useEffect(() => {
    // Only save when we actually have a conversation going
    if (!chatState || !messages || messages.length === 0) {
      return;
    }

    const payload = {
      chatState,
      messages,
      evaluationResult,
      isComplete,
    };

    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to persist chatbot state to localStorage:', e);
    }
  }, [chatState, messages, evaluationResult, isComplete]);

  // Scroll to chatbot when state is restored and messages exist
  useEffect(() => {
    if (messages.length > 0 && hasRestoredRef.current && chatState) {
      // Small delay to ensure DOM is updated after restoration
      const timer = setTimeout(() => {
        scrollToBottom();
        // Also scroll page to chatbot container if it exists
        const chatbotContainer = document.querySelector('[data-chatbot-container]');
        if (chatbotContainer) {
          // Only scroll if chatbot is not already in view
          const rect = chatbotContainer.getBoundingClientRect();
          const isVisible = rect.top >= 0 && rect.top < window.innerHeight;
          if (!isVisible) {
            chatbotContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [messages.length, chatState]);

  const initializeChatbot = async () => {
    setIsGeneratingQuestions(true);
    try {
      const result = await generateQuestions(userProfile);
      if (result.success && result.data.questions) {
        const questions = result.data.questions;
        const initialState = {
          currentStage: 1,
          currentQuestionIndex: 0,
          questions: questions,
          answers: {},
          pendingWhyQuestion: null,
          complete: false
        };
        setChatState(initialState);
        
        // Add welcome message and first question
        setMessages([
          {
            type: 'bot',
            text: `Hello! I'm Saathi, your AI career counselor. I'll ask you 15 questions to understand your interests better. Let's begin!`
          },
          {
            type: 'bot',
            text: questions[0]
          }
        ]);
      }
    } catch (error) {
      setMessages([{
        type: 'error',
        text: 'Failed to initialize chatbot. Please try again.'
      }]);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !chatState) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setIsLoading(true);

    // Immediately refocus input to maintain cursor position
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    try {
      const result = await sendChatMessage(userMsg, chatState);
      
      if (result.success && result.data) {
        const { nextQuestion, conversationState: updatedState, isComplete: completed } = result.data;
        
        setChatState(updatedState);
        
        if (completed) {
          setIsComplete(true);
          setMessages(prev => [...prev, {
            type: 'bot',
            text: 'Great! You\'ve answered all questions. Let me analyze your responses...'
          }]);
          
          // Automatically evaluate using the updated chat state (includes the latest answers)
          handleEvaluate(updatedState);
        } else if (nextQuestion) {
          // Check if this question is similar to an already answered question
          const normalizedNext = nextQuestion.toLowerCase();
          const isInterestsGoalsQuestion = normalizedNext.includes('interests') && 
                                          (normalizedNext.includes('goals') || normalizedNext.includes('goal'));
          
          if (isInterestsGoalsQuestion && updatedState.answers) {
            // Check if we've already answered a similar interests/goals question
            const hasAnsweredSimilar = Object.keys(updatedState.answers).some(answeredQ => {
              const normalizedAnswered = answeredQ.toLowerCase();
              return normalizedAnswered.includes('interests') && 
                     (normalizedAnswered.includes('goals') || normalizedAnswered.includes('goal'));
            });
            
            if (hasAnsweredSimilar) {
              // Skip this question and request the next one
              console.log('Skipping duplicate interests/goals question');
              // The backend should handle this, but if it doesn't, we'll skip it here
              // For now, we'll still show it but log a warning
              console.warn('Backend returned a duplicate interests/goals question');
            }
          }
          
          setMessages(prev => [...prev, { type: 'bot', text: nextQuestion }]);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'error',
        text: 'Failed to send message. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
      // Refocus input after message is sent and loading completes
      // Use requestAnimationFrame to ensure it happens after DOM updates
      requestAnimationFrame(() => {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 150);
      });
    }
  };

  const handleEvaluate = async (stateForEvaluation) => {
    const evaluationState = stateForEvaluation || chatState;
    if (!evaluationState || !userProfile) return;
    
    setIsEvaluating(true);
    try {
      const result = await evaluateInterests(userProfile, evaluationState.answers);
      
      if (result.success && result.data) {
        setEvaluationResult(result.data);
        setMessages(prev => [...prev, {
          type: 'bot',
          text: 'Evaluation complete! Redirecting to your report page...'
        }]);
        
        // Call the regenerate callback which will handle navigation to report page
        setTimeout(() => {
          if (onRegenerateProfile) {
            onRegenerateProfile(evaluationState.answers, result.data);
          }
        }, 1000);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'error',
        text: 'Failed to evaluate. Please try again.'
      }]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDownloadReport = async () => {
    if (!evaluationResult || !evaluationResultsRef.current) {
      notifyError('Report data is not available. Please complete the evaluation first.');
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `Saathi_Report_${timestamp}.pdf`;
      
      await downloadProfileAsPDF(evaluationResultsRef.current, {
        fileName,
        orientation: 'p'
      });
      notifySuccess('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      notifyError('Failed to generate PDF report. Please try again or contact support if the issue persists.');
    }
  };

  const handleRegenerateProfile = async () => {
    if (!onRegenerateProfile) {
      return;
    }
    if (!chatState?.answers || Object.keys(chatState.answers).length === 0) {
      setMessages(prev => [...prev, {
        type: 'error',
        text: 'Please complete the chatbot before regenerating your profile.'
      }]);
      return;
    }

    setIsRegenerating(true);
    setMessages(prev => [...prev, {
      type: 'bot',
      text: 'Regenerating your profile using the latest insights...'
    }]);

    try {
      const result = await onRegenerateProfile(chatState.answers, evaluationResult);
      if (result && result.success) {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: 'Profile regenerated successfully. Head back to the profile view to see the updated content.'
        }]);
        // Optionally clear chatbot storage after successful regeneration
        // Uncomment if you want to clear it:
        // localStorage.removeItem(CHAT_STORAGE_KEY);
      } else {
        setMessages(prev => [...prev, {
          type: 'error',
          text: result?.error || 'Unable to regenerate profile right now.'
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'error',
        text: error?.message || 'An unexpected error occurred while regenerating your profile.'
      }]);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleTakePsychometricTest = async () => {
    if (!userProfile) {
      notifyError('Profile data is not available.');
      return;
    }

    console.log('User profile data:', userProfile);

    try {
      // Calculate age from date of birth if available
      const calculateAge = (dob) => {
        if (!dob) return 25; // Default age if not available
        try {
          const birthDate = new Date(dob);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age > 0 ? age : 25;
        } catch (e) {
          return 25;
        }
      };

      // Map degree from profile to psychometric form options
      const mapDegree = (profileDegree) => {
        if (!profileDegree) return 'B.Tech';
        const degreeLower = profileDegree.toLowerCase();
        if (degreeLower.includes('b.tech') || degreeLower.includes('btech') || degreeLower.includes('bachelor of technology')) {
          return 'B.Tech';
        }
        if (degreeLower.includes('bba') || degreeLower.includes('bachelor of business')) {
          return 'BBA';
        }
        if (degreeLower.includes('b.com') || degreeLower.includes('bcom') || degreeLower.includes('bachelor of commerce')) {
          return 'B.Com';
        }
        if (degreeLower.includes('mba') || degreeLower.includes('master of business')) {
          return 'MBA';
        }
        return 'Other';
      };

      // Prepare psychometric session data from profile
      const psychometricData = {
        name: userProfile.name || 'User',
        email: userProfile.email || 'user@example.com',
        phone: userProfile.phone || '0000000000', // Default phone if not available
        age: calculateAge(userProfile.dob),
        degree: mapDegree(userProfile.currentDegree || userProfile.degree),
        specialization: userProfile.branch || userProfile.specialization || 'General',
        careerInterest: userProfile.interests || userProfile.goals || 'Career Development',
        certifications: userProfile.certifications || 'None',
        achievements: userProfile.achievements || 'None',
        technicalSkills: userProfile.technicalSkills || 'General Skills',
        softSkills: userProfile.softSkills || 'Communication, Teamwork',
        interests: userProfile.interests || userProfile.goals || 'Learning and Development',
        hobbies: userProfile.hobbies || 'Reading, Learning',
      };

      console.log('✅ Prepared psychometric data:', psychometricData);
      
      // Store profile data in sessionStorage for auto-creation on psychometric start page
      sessionStorage.setItem('psychometric_from_profile', 'true');
      sessionStorage.setItem('psychometric_profile_data', JSON.stringify(psychometricData));
      
      console.log('💾 Stored data in sessionStorage');
      console.log('   - psychometric_from_profile:', sessionStorage.getItem('psychometric_from_profile'));
      console.log('   - psychometric_profile_data length:', sessionStorage.getItem('psychometric_profile_data')?.length);
      
      notifySuccess('Preparing your psychometric test...');
      
      // Redirect to psychometric start page which will auto-create session
      console.log('🚀 Redirecting to /psychometric/start in 500ms...');
      setTimeout(() => {
        window.location.href = '/psychometric/start';
      }, 500);
    } catch (error) {
      console.error('Error preparing psychometric test:', error);
      sessionStorage.removeItem('psychometric_from_profile');
      sessionStorage.removeItem('psychometric_profile_data');
      notifyError(error.message || 'Failed to prepare psychometric test. Please try again.');
    }
  };

  // Get current time formatted
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Get today's date label
  const getTodayLabel = () => {
    return 'Today';
  };

  if (isGeneratingQuestions) {
    return (
      <div className="chatbot-loading-container">
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <div className="chatbot-spinner"></div>
          <p className="chatbot-loading-text">SaathiX is preparing your personalized questions...</p>
        </div>
        <style>{`
          .chatbot-loading-container {
            height: calc(100vh - 70px);
            background: linear-gradient(180deg, #f8f9fa 0%, #e8f4f8 50%, #f5e6f0 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 16px;
          }
          
          .chatbot-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          
          .chatbot-loading-text {
            color: #6b7280;
            font-size: 1rem;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          @media (max-width: 768px) {
            .chatbot-spinner {
              width: 40px;
              height: 40px;
            }
            
            .chatbot-loading-text {
              font-size: 0.9rem;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      {/* Responsive Styles */}
      <style>{`
        .chatbot-container {
          height: calc(100vh - 70px);
          background: linear-gradient(180deg, #f8f9fa 0%, #e8f4f8 50%, #f5e6f0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          margin: 0;
          box-sizing: border-box;
        }
        
        .chatbot-main-card {
          width: 100%;
          max-width: 900px;
          height: 100%;
          max-height: calc(100vh - 102px);
          background-color: white;
          border-radius: 24px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
        }
        
        .chatbot-header {
          padding: 20px 32px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-shrink: 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .chatbot-header-content {
          text-align: center;
          flex: 1;
        }
        
        .chatbot-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #111827;
        }
        
        .chatbot-subtitle {
          font-size: 0.8rem;
          color: #9ca3af;
          margin: 0;
        }
        
        .chatbot-status {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #111827;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .chatbot-status-dot {
          width: 8px;
          height: 8px;
          background-color: #22c55e;
          border-radius: 50%;
          display: inline-block;
        }
        
        .chatbot-today-badge {
          text-align: center;
          margin-bottom: 12px;
          flex-shrink: 0;
        }
        
        .chatbot-today-badge span {
          display: inline-block;
          padding: 5px 16px;
          background-color: #f3f4f6;
          border-radius: 20px;
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }
        
        .chatbot-messages-area {
          flex: 1;
          padding: 0 32px 16px;
          overflow-y: auto;
          min-height: 0;
        }
        
        .chatbot-message {
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .chatbot-message.user {
          justify-content: flex-end;
        }
        
        .chatbot-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        
        .chatbot-avatar.ai {
          background-color: #3b82f6;
        }
        
        .chatbot-avatar.user {
          background-color: #ec4899;
          font-size: 0.7rem;
        }
        
        .chatbot-message-content {
          max-width: 70%;
        }
        
        .chatbot-bubble {
          padding: 14px 18px;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .chatbot-bubble.user {
          border-radius: 16px 16px 4px 16px;
          background-color: white;
          color: #374151;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        
        .chatbot-bubble.bot {
          border-radius: 16px 16px 16px 4px;
          background-color: #f8fafc;
          color: #374151;
        }
        
        .chatbot-bubble.error {
          border-radius: 16px 16px 16px 4px;
          background-color: #fef2f2;
          color: #dc2626;
        }
        
        .chatbot-bubble p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        
        .chatbot-timestamp {
          margin: 6px 0 0;
          font-size: 0.75rem;
          color: #9ca3af;
        }
        
        .chatbot-input-area {
          padding: 16px 32px 20px;
          background: linear-gradient(180deg, #f0e6fa 0%, #fce7f3 100%);
          border-top: 1px solid #f3e8ff;
          flex-shrink: 0;
        }
        
        .chatbot-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .chatbot-input-container {
          flex: 1;
          background-color: white;
          border-radius: 28px;
          display: flex;
          align-items: center;
          padding: 4px 8px 4px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        
        .chatbot-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.9rem;
          color: #374151;
          background-color: transparent;
          padding: 10px 0;
        }
        
        .chatbot-send-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #3b82f6;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
          cursor: pointer;
        }
        
        .chatbot-send-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        
        .chatbot-improve-btn {
          text-align: right;
          margin-top: 12px;
        }
        
        .chatbot-improve-btn button {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        
        /* Tablet Responsive */
        @media (max-width: 1024px) {
          .chatbot-container {
            padding: 12px;
          }
          
          .chatbot-main-card {
            max-height: calc(100vh - 94px);
          }
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .chatbot-container {
            padding: 8px;
          }
          
          .chatbot-main-card {
            border-radius: 16px;
            max-height: calc(100vh - 86px);
          }
          
          .chatbot-header {
            padding: 12px 16px;
            flex-direction: column;
            gap: 8px;
            align-items: center;
          }
          
          .chatbot-header-content {
            text-align: center;
          }
          
          .chatbot-title {
            font-size: 1.2rem;
          }
          
          .chatbot-subtitle {
            font-size: 0.75rem;
          }
          
          .chatbot-status {
            font-size: 0.75rem;
            gap: 4px;
          }
          
          .chatbot-status-dot {
            width: 6px;
            height: 6px;
          }
          
          .chatbot-today-badge {
            margin-bottom: 10px;
          }
          
          .chatbot-today-badge span {
            padding: 4px 12px;
            font-size: 0.7rem;
          }
          
          .chatbot-messages-area {
            padding: 0 12px 12px;
          }
          
          .chatbot-message {
            margin-bottom: 16px;
            gap: 8px;
          }
          
          .chatbot-message-content {
            max-width: 80%;
          }
          
          .chatbot-avatar {
            width: 32px;
            height: 32px;
            font-size: 0.65rem;
          }
          
          .chatbot-bubble {
            padding: 10px 14px;
            border-radius: 12px !important;
          }
          
          .chatbot-bubble.user {
            border-radius: 12px 12px 4px 12px !important;
          }
          
          .chatbot-bubble.bot,
          .chatbot-bubble.error {
            border-radius: 12px 12px 12px 4px !important;
          }
          
          .chatbot-bubble p {
            font-size: 0.85rem;
            line-height: 1.5;
          }
          
          .chatbot-timestamp {
            font-size: 0.7rem;
            margin-top: 4px;
          }
          
          .chatbot-input-area {
            padding: 12px 12px 16px;
          }
          
          .chatbot-input-wrapper {
            gap: 8px;
          }
          
          .chatbot-input-container {
            padding: 3px 6px 3px 14px;
            border-radius: 24px;
          }
          
          .chatbot-input {
            font-size: 0.85rem;
            padding: 8px 0;
          }
          
          .chatbot-send-btn {
            width: 42px;
            height: 42px;
          }
          
          .chatbot-improve-btn {
            margin-top: 8px;
          }
          
          .chatbot-improve-btn button {
            font-size: 0.8rem;
          }
        }
        
        /* Small Mobile */
        @media (max-width: 480px) {
          .chatbot-container {
            padding: 4px;
          }
          
          .chatbot-main-card {
            border-radius: 12px;
            max-height: calc(100vh - 78px);
          }
          
          .chatbot-header {
            padding: 10px 12px;
          }
          
          .chatbot-title {
            font-size: 1.1rem;
          }
          
          .chatbot-subtitle {
            font-size: 0.7rem;
          }
          
          .chatbot-status {
            font-size: 0.7rem;
          }
          
          .chatbot-messages-area {
            padding: 0 10px 10px;
          }
          
          .chatbot-message {
            margin-bottom: 12px;
            gap: 6px;
          }
          
          .chatbot-message-content {
            max-width: 85%;
          }
          
          .chatbot-avatar {
            width: 28px;
            height: 28px;
            font-size: 0.6rem;
          }
          
          .chatbot-bubble {
            padding: 8px 12px;
          }
          
          .chatbot-bubble p {
            font-size: 0.8rem;
          }
          
          .chatbot-input-area {
            padding: 10px 10px 14px;
          }
          
          .chatbot-input-container {
            padding: 2px 4px 2px 12px;
          }
          
          .chatbot-input {
            font-size: 0.8rem;
            padding: 7px 0;
          }
          
          .chatbot-send-btn {
            width: 38px;
            height: 38px;
          }
        }
        
        /* Extra Small Mobile */
        @media (max-width: 360px) {
          .chatbot-main-card {
            border-radius: 10px;
          }
          
          .chatbot-header {
            padding: 8px 10px;
          }
          
          .chatbot-title {
            font-size: 1rem;
          }
          
          .chatbot-subtitle {
            font-size: 0.65rem;
          }
          
          .chatbot-messages-area {
            padding: 0 8px 8px;
          }
          
          .chatbot-message-content {
            max-width: 90%;
          }
          
          .chatbot-bubble p {
            font-size: 0.75rem;
          }
          
          .chatbot-input {
            font-size: 0.75rem;
          }
          
          .chatbot-send-btn {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>
      
      {/* Main Chat Card */}
      <div className="chatbot-main-card">
        {/* Chat Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-content">
            <h2 className="chatbot-title">
              Chat with <span style={{ color: '#22c55e' }}>SaathiX</span>
            </h2>
            <p className="chatbot-subtitle">
              Your Personal AI Career Guide, Anytime
            </p>
          </div>
          <div className="chatbot-status">
            <span className="chatbot-status-dot"></span>
            AI Online
          </div>
        </div>

        {/* Today Badge */}
        <div className="chatbot-today-badge">
          <span>
            {getTodayLabel()}
          </span>
        </div>

        {/* Messages Area */}
        <div className="overflow-y-auto chatbot-messages-area">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chatbot-message ${msg.type === 'user' ? 'user' : ''}`}
            >
              {/* AI Avatar - Left side */}
              {msg.type !== 'user' && (
                <div className="chatbot-avatar ai">
                  AI
                </div>
              )}

              <div className="chatbot-message-content">
                {/* Message Bubble */}
                <div className={`chatbot-bubble ${msg.type === 'user' ? 'user' : msg.type === 'error' ? 'error' : 'bot'}`}>
                  <p>{msg.text}</p>
                </div>
                {/* Timestamp */}
                <p className="chatbot-timestamp" style={{
                  textAlign: msg.type === 'user' ? 'right' : 'left'
                }}>
                  {formatTime()}
                </p>
              </div>

              {/* User Avatar - Right side */}
              {msg.type === 'user' && (
                <div className="chatbot-avatar user">
                  ME
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="chatbot-message">
              <div className="chatbot-avatar ai">
                AI
              </div>
              <div className="chatbot-bubble bot">
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#9ca3af',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#9ca3af',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite',
                    animationDelay: '0.1s'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#9ca3af',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite',
                    animationDelay: '0.2s'
                  }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Evaluating indicator */}
          {isEvaluating && (
            <div className="chatbot-message">
              <div className="chatbot-avatar ai">
                AI
              </div>
              <div className="chatbot-bubble bot">
                <p style={{ margin: 0, color: '#6b7280' }}>
                  Analyzing your responses...
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {!isComplete && (
          <div className="chatbot-input-area">
            <div className="chatbot-input-wrapper">
              <div className="chatbot-input-container">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type Your Answer..."
                  disabled={isLoading}
                  autoFocus
                  className="chatbot-input"
                />
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    display: 'none'
                  }}
                  title="Attach file"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="chatbot-send-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>

            {/* Improve My Writing Link */}
            <div className="chatbot-improve-btn">
              <button
                type="button"
                onClick={() => {
                  // This could trigger an AI enhancement of the current input
                  if (inputMessage.trim()) {
                    notifySuccess('Feature coming soon!');
                  }
                }}
              >
                <span>✏️</span> Improve My Writing
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default SaarthiChatbot;


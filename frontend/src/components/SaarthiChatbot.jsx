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

  if (isGeneratingQuestions) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Saathi is preparing your personalized questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4"> 
          <h2 className="text-xl font-semibold">💬 Chat with Saathi</h2>
          <p className="text-sm text-blue-100">AI Career Counselor</p>
        </div>

        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-4 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.type === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
                style={undefined}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          {isEvaluating && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-600">Analyzing your responses...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {!isComplete && (
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
                autoFocus
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SaarthiChatbot;


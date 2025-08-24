
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileBuilder } from '../context/ProfileBuilderContext';
import { useAuth } from '../context/AuthContext';
import { QUIZ_QUESTIONS } from '../constants';

// Fallback questions in case constants fail to load
const FALLBACK_QUESTIONS = [
  {
    id: 1,
    question: "What's your preferred work schedule?",
    type: "cards",
    options: ["☀️ Morning Maverick", "🌙 Night Owl Ninja", "🌅 Flexible Fighter"]
  },
  {
    id: 2,
    question: "How do you customize your terminal?",
    type: "cards", 
    options: ["🎨 Zsh/Fish Customizer", "Bash Purist", "🚀 Warp/Fig Magician"]
  }
];

const OnboardingScreen: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: any }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const { setQuizAnswer, companionMessage, getCurrentMatches } = useProfileBuilder();
  const { isAuthenticated, currentUser, checkAuthState } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Use fallback questions if constants fail
  const quizQuestions = QUIZ_QUESTIONS && QUIZ_QUESTIONS.length > 0 ? QUIZ_QUESTIONS : FALLBACK_QUESTIONS;

  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth) {
      return;
    }
    
    setHasCheckedAuth(true);
    
    // First, try to sync auth state
    const authSynced = checkAuthState();
    console.log('OnboardingScreen: Auth sync result:', authSynced);
    
    console.log('OnboardingScreen: isAuthenticated =', isAuthenticated);
    console.log('OnboardingScreen: currentUser =', currentUser);
    console.log('OnboardingScreen: currentQuestionIndex =', currentQuestionIndex);
    console.log('OnboardingScreen: quizQuestions.length =', quizQuestions.length);
    console.log('OnboardingScreen: quizQuestions =', quizQuestions);
    
    // Check if we already have user data in localStorage (immediate check)
    const storedUser = localStorage.getItem('syncup_current_user');
    const storedToken = localStorage.getItem('syncup_auth_token');
    
    console.log('OnboardingScreen: storedUser =', storedUser ? 'Yes' : 'No');
    console.log('OnboardingScreen: storedToken =', storedToken ? 'Yes' : 'No');
    
    // SIMPLE LOGIC: If we have any user data, show questions immediately
    if (storedUser && storedToken) {
      console.log('OnboardingScreen: Found stored user data, proceeding to questions');
      setIsLoading(false);
      return;
    }
    
    // If we're authenticated, proceed immediately
    if (isAuthenticated && currentUser) {
      console.log('OnboardingScreen: Authentication complete, showing questions');
      setIsLoading(false);
      return;
    }
    
    // If we have a provider in URL, wait a bit for auth to complete
    const provider = searchParams.get('provider');
    if (provider) {
      console.log('OnboardingScreen: Has provider, waiting for auth to complete...');
      
      // Wait for auth to complete with a simple timeout
      const authTimeout = setTimeout(() => {
        const newStoredUser = localStorage.getItem('syncup_current_user');
        const newStoredToken = localStorage.getItem('syncup_auth_token');
        
        if (newStoredUser && newStoredToken) {
          console.log('OnboardingScreen: User data found after waiting, proceeding');
          setIsLoading(false);
        } else {
          console.log('OnboardingScreen: Still no user data, showing force continue options');
        }
      }, 2000); // Wait 2 seconds for auth to complete
      
      return () => clearTimeout(authTimeout);
    }
    
    // If no provider and no user data, redirect to home
    if (!provider && !storedUser && !isAuthenticated) {
      console.log('OnboardingScreen: No provider or user data, redirecting to /');
      navigate('/');
      return;
    }
  }, []); // Empty dependency array to run only once

  // Show loading while authentication is being processed
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading your profile...</p>
          <p className="text-sm opacity-75 mt-2">isAuthenticated: {String(isAuthenticated)}</p>
          <p className="text-sm opacity-75">currentUser: {currentUser ? currentUser.name : 'None'}</p>
          <p className="text-sm opacity-75">Provider: {searchParams.get('provider')}</p>
          <p className="text-sm opacity-75">Quiz Questions: {quizQuestions ? quizQuestions.length : 'Not loaded'}</p>
          <div className="mt-4 space-y-2">
            <button 
              onClick={() => setIsLoading(false)}
              className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
            >
              Continue Anyway
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 bg-opacity-80 rounded-lg hover:bg-opacity-100 transition-all ml-2"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => {
                setIsLoading(false);
                // Force set some mock user data to bypass checks
                if (!localStorage.getItem('syncup_current_user')) {
                  localStorage.setItem('syncup_current_user', JSON.stringify({ name: 'Test User' }));
                }
                if (!localStorage.getItem('syncup_auth_token')) {
                  localStorage.setItem('syncup_auth_token', 'test-token');
                }
              }}
              className="px-4 py-2 bg-green-500 bg-opacity-80 rounded-lg hover:bg-opacity-100 transition-all ml-2"
            >
              Force Start Questions
            </button>
            <div className="mt-4 p-3 bg-black bg-opacity-20 rounded-lg text-left text-xs">
              <div><strong>Debug Info:</strong></div>
              <div>isAuthenticated: {String(isAuthenticated)}</div>
              <div>currentUser: {currentUser ? currentUser.name : 'None'}</div>
              <div>Provider: {searchParams.get('provider')}</div>
              <div>Stored User: {localStorage.getItem('syncup_current_user') ? 'Yes' : 'No'}</div>
              <div>Stored Token: {localStorage.getItem('syncup_auth_token') ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Check if we have questions
  if (!quizQuestions || quizQuestions.length === 0) {
    console.error('OnboardingScreen: No quiz questions found!');
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Error: No Quiz Questions</h1>
          <p>Please check the console for details.</p>
          <div className="mt-4 p-3 bg-black bg-opacity-20 rounded-lg text-left text-xs">
            <div><strong>Debug Info:</strong></div>
            <div>QUIZ_QUESTIONS: {QUIZ_QUESTIONS ? 'Array' : 'null/undefined'}</div>
            <div>QUIZ_QUESTIONS.length: {QUIZ_QUESTIONS ? QUIZ_QUESTIONS.length : 'N/A'}</div>
            <div>QUIZ_QUESTIONS content: {JSON.stringify(QUIZ_QUESTIONS, null, 2)}</div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

  console.log('OnboardingScreen: Rendering with currentQuestion =', currentQuestion);
  console.log('OnboardingScreen: progress =', progress);
  console.log('OnboardingScreen: currentQuestionIndex =', currentQuestionIndex);
  console.log('OnboardingScreen: QUIZ_QUESTIONS.length =', QUIZ_QUESTIONS.length);

  const handleAnswer = (answer: any) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    setQuizAnswer(currentQuestion.id, answer);

    // Move to next question after a short delay to show the companion message
    setTimeout(() => {
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // All questions answered, go to meme check
        const provider = searchParams.get('provider') || 'github';
        navigate(`/meme-check?provider=${provider}`);
      }
    }, 1500);
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'cards':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentQuestion.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleAnswer(option)}
                className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border-2 border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300 text-white text-center"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-2xl mb-2">{option}</div>
              </motion.button>
            ))}
          </div>
        );

      case 'toggle':
        return (
          <div className="flex justify-center space-x-8">
            {currentQuestion.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleAnswer(option)}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-xl border-2 border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300 text-white text-xl"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                {option}
              </motion.button>
            ))}
          </div>
        );

      case 'slider':
        return (
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/20 rounded-full h-3 mb-6">
              <motion.div
                className="bg-white h-full rounded-full"
                initial={{ width: '50%' }}
                animate={{ width: `${(answers[currentQuestion.id] || (currentQuestion as any).default || 50) / ((currentQuestion as any).max || 100) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-white/80 text-sm mb-4">
              <span>{(currentQuestion as any).min || 0}</span>
              <span className="text-xl font-bold">{answers[currentQuestion.id] || (currentQuestion as any).default || 50}</span>
              <span>{(currentQuestion as any).max || 100}</span>
            </div>
            <input
              type="range"
              min={(currentQuestion as any).min || 0}
              max={(currentQuestion as any).max || 100}
              value={answers[currentQuestion.id] || (currentQuestion as any).default || 50}
              onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: parseInt(e.target.value) }))}
              className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="text-center mt-4">
              <motion.button
                onClick={() => handleAnswer(answers[currentQuestion.id] || (currentQuestion as any).default || 50)}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Continue
              </motion.button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Get current matches for preview
  const currentMatches = getCurrentMatches();
  const topMatches = currentMatches.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-secondary p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">Let's Build Your Developer Profile</h1>
          <p className="text-xl opacity-90">
            Answer a few questions to help us find your perfect developer matches
          </p>
          
          {/* Progress Bar */}
          <div className="mt-6 bg-white/20 rounded-full h-3 overflow-hidden max-w-md mx-auto">
            <motion.div
              className="bg-white h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="mt-2 text-sm opacity-75">
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Question Section */}
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">{currentQuestion.question}</h2>
            {renderQuestion()}
          </motion.div>

          {/* Companion & Preview Section */}
          <div className="space-y-6">
            {/* Companion Message */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">🤖 Your AI Companion</h3>
              <p className="text-white/90 text-lg">{companionMessage}</p>
            </motion.div>

            {/* Match Preview */}
            {topMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">🎯 Potential Matches</h3>
                <div className="space-y-3">
                  {topMatches.map((match, index) => (
                    <div key={match.profile.id} className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                      <img 
                        src={match.profile.avatarUrl} 
                        alt={match.profile.name} 
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">{match.profile.name}</p>
                        <p className="text-white/70 text-sm">{match.profile.codename}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">{match.score}%</div>
                        <div className="text-white/70 text-xs">Match</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-white/60 text-sm mt-3 text-center">
                  Keep answering to see more matches!
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;

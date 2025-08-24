
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { Github, Mail, Linkedin } from 'lucide-react';
import { useProfileBuilder } from '../context/ProfileBuilderContext';
import { useAuth } from '../context/AuthContext';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2
    }
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

type LoginProvider = 'GitHub' | 'Google' | 'LinkedIn';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [linkedInError, setLinkedInError] = useState<string | null>(null);
  
  // Safe access to context with fallback
  let setCompanionMessage: (message: string) => void;
  try {
    const profileBuilder = useProfileBuilder();
    setCompanionMessage = profileBuilder.setCompanionMessage;
  } catch (error) {
    console.warn('ProfileBuilder context not available, using fallback');
    setCompanionMessage = () => {}; // Fallback function
  }
  
  // Safe access to auth context with fallback
  let isAuthenticated = false;
  let isLoading = false;
  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
    isLoading = auth.isLoading;
  } catch (error) {
    console.warn('Auth context not available, using fallback');
  }

  console.log('LoginScreen: Rendering with isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  // Check for LinkedIn OAuth errors in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error === 'linkedin_oauth_failed') {
      setLinkedInError('LinkedIn login failed. Please try again or use another login method.');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    setCompanionMessage("Welcome to SyncUp! Let's find your developer soulmate. First, sign in to sync your dev-DNA.");
  }, [setCompanionMessage, isAuthenticated, navigate]);
  
  const handleLogin = (provider: LoginProvider) => {
    console.log('Login attempt for:', provider);
    
    // Get the current frontend URL and pass it to backend for OAuth redirect
    const currentOrigin = window.location.origin;
    const redirectCallback = `${currentOrigin}/#/auth/callback`;
    const encoded = encodeURIComponent(redirectCallback);
    
    // Test backend connectivity first
    fetch('http://localhost:3001/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Backend not responding');
        }
        console.log('Backend is running, proceeding with OAuth...');
        
        switch (provider) {
          case 'GitHub':
            window.location.href = `http://localhost:3001/auth/github?redirect=${encoded}`;
            break;
          case 'Google':
            window.location.href = `http://localhost:3001/auth/google?redirect=${encoded}`;
            break;
          case 'LinkedIn':
            console.log('Starting LinkedIn OAuth...');
            setLinkedInError(null); // Clear any previous errors
            window.location.href = `http://localhost:3001/auth/linkedin`;
            break;
        }
      })
      .catch(error => {
        console.error('Backend connection failed:', error);
        alert('Backend server is not running. Please start the backend server first.');
      });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen p-4 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div variants={itemVariants} className="mb-4">
        <h1 className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500">
          SyncUp
        </h1>
        <p className="mt-2 text-lg text-white/80">Find your perfect pair in the world of code.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full max-w-sm p-8 space-y-6 rounded-2xl bg-white/10 backdrop-blur-sm shadow-2xl border border-white/20">
        <h2 className="text-2xl font-bold text-white">Create Your Dev Persona</h2>
        <p className="text-sm text-white/70">We'll use your GitHub data and a few fun questions to craft your unique developer identity.</p>
        
        {linkedInError && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{linkedInError}</p>
          </div>
        )}
        <div className="space-y-4">
          <motion.button 
            onClick={() => handleLogin('GitHub')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-300 text-white"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Github size={20} className="flex-shrink-0" />
            <span className="flex-shrink-0">Sign in with GitHub</span>
          </motion.button>
          <motion.button
            onClick={() => handleLogin('Google')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 font-semibold rounded-lg bg-red-600 hover:bg-red-500 transition-colors duration-300 text-white"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Mail size={20} className="flex-shrink-0" />
            <span className="flex-shrink-0">Sign in with Google</span>
          </motion.button>
          <motion.button
            onClick={() => handleLogin('LinkedIn')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 font-semibold rounded-lg bg-blue-700 hover:bg-blue-600 transition-colors duration-300 text-white"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Linkedin size={20} className="flex-shrink-0" />
            <span className="flex-shrink-0">Sign in with LinkedIn</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginScreen;

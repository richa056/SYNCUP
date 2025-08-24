

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileBuilder } from '../context/ProfileBuilderContext';
import { useAuth } from '../context/AuthContext';
import MemeCard from '../components/MemeCard';
import { MEMES } from '../constants';
import { MemeReaction } from '../types';

const MemeCheckScreen: React.FC = () => {
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0);
  const [memeReactions, setMemeReactions] = useState<MemeReaction[]>([]);
  const { addMemeReaction, finalizeProfile, isGeneratingProfile, companionMessage } = useProfileBuilder();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const provider = searchParams.get('provider');
    if (!provider) {
      navigate('/onboarding');
      return;
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleReaction = (reaction: '😐' | '😂' | '💯' | '😭') => {
    const currentMeme = MEMES[currentMemeIndex];
    const newReaction: MemeReaction = {
      memeId: currentMeme.id,
      reaction,
      timestamp: Date.now()
    };

    console.log('MemeCheckScreen: Adding reaction:', newReaction);
    addMemeReaction(newReaction);
    setMemeReactions(prev => [...prev, newReaction]);

    // Move to next meme or finish
    if (currentMemeIndex < MEMES.length - 1) {
      setCurrentMemeIndex(prev => prev + 1);
    } else {
      // All memes reacted to, finalize profile
      console.log('MemeCheckScreen: All memes completed, finalizing profile...');
      const provider = searchParams.get('provider') || 'github';
      console.log('MemeCheckScreen: Using provider:', provider);
      finalizeProfile(provider);
    }
  };

  const currentMeme = MEMES[currentMemeIndex];
  const progress = ((currentMemeIndex + 1) / MEMES.length) * 100;

  if (isGeneratingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white max-w-md"
        >
          <div className="w-24 h-24 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-3xl font-bold mb-4">Analyzing Your Dev DNA</h2>
          <p className="text-xl opacity-90 mb-6">{companionMessage}</p>
          
          {/* Progress steps */}
          <div className="space-y-3 text-left bg-white/10 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm">Quiz answers analyzed</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm">Meme reactions processed</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Generating developer profile...</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-sm">Finding your matches</span>
            </div>
          </div>
          
          <p className="text-sm opacity-75 mt-4">This may take a few moments...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-secondary p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">What Makes You Laugh?</h1>
          <p className="text-xl opacity-90">
            React to these developer memes to help us understand your personality
          </p>
          
          {/* Progress Bar */}
          <div className="mt-6 bg-white/20 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-white h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="mt-2 text-sm opacity-75">
            {currentMemeIndex + 1} of {MEMES.length}
          </p>
        </motion.div>

        {/* Meme Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMeme.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <MemeCard
              meme={currentMeme}
              onReaction={handleReaction}
            />
          </motion.div>
        </AnimatePresence>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-white/80"
        >
          <p className="text-lg">
            Swipe left/right or tap a reaction to continue
          </p>
          <div className="flex justify-center space-x-4 mt-4">
            <span className="text-sm">😐 = Meh</span>
            <span className="text-sm">😂 = Funny</span>
            <span className="text-sm">💯 = Relatable</span>
            <span className="text-sm">😭 = Too Real</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MemeCheckScreen;

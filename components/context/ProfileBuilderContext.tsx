

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizAnswers, MemeReaction, DeveloperProfile } from '../types';
import { generateDeveloperProfile } from '../services/mockApi';
import { useAuth } from './AuthContext';

// LocalStorage Keys
const QUIZ_ANSWERS_KEY = 'syncup_quiz_answers';
const MEME_REACTIONS_KEY = 'syncup_meme_reactions';
const LIKED_MATCHES_KEY = 'syncup_liked_matches';

// Helper to get data from localStorage
const getFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return fallback;
  }
};

interface ProfileBuilderContextType {
  quizAnswers: QuizAnswers;
  memeReactions: MemeReaction[];
  isGeneratingProfile: boolean;
  companionMessage: string;
  likedMatches: Set<string>;
  setQuizAnswer: (questionId: number, answer: any) => void;
  addMemeReaction: (reaction: MemeReaction) => void;
  finalizeProfile: (loginProvider: string) => Promise<void>;
  setCompanionMessage: (message: string) => void;
  toggleLike: (matchId: string) => void;
}

const ProfileBuilderContext = createContext<ProfileBuilderContextType | undefined>(undefined);

export const ProfileBuilderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>(() => getFromStorage(QUIZ_ANSWERS_KEY, {}));
  const [memeReactions, setMemeReactions] = useState<MemeReaction[]>(() => getFromStorage(MEME_REACTIONS_KEY, []));
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [companionMessage, setCompanionMessage] = useState("Welcome to SyncUp! Let's find your developer soulmate. First, tell us who you are.");
  const [likedMatches, setLikedMatches] = useState<Set<string>>(() => new Set(getFromStorage(LIKED_MATCHES_KEY, [])));
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => { localStorage.setItem(QUIZ_ANSWERS_KEY, JSON.stringify(quizAnswers)); }, [quizAnswers]);
  useEffect(() => { localStorage.setItem(MEME_REACTIONS_KEY, JSON.stringify(memeReactions)); }, [memeReactions]);
  useEffect(() => { localStorage.setItem(LIKED_MATCHES_KEY, JSON.stringify(Array.from(likedMatches)));}, [likedMatches]);

  const setQuizAnswer = (questionId: number, answer: any) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const addMemeReaction = (reaction: MemeReaction) => {
    setMemeReactions(prev => [...prev.filter(r => r.memeId !== reaction.memeId), reaction]);
  };
  
  const finalizeProfile = async (loginProvider: string) => {
    setIsGeneratingProfile(true);
    setCompanionMessage("Analyzing your developer DNA... This is the exciting part!");
    try {
      const profile = await generateDeveloperProfile(
        quizAnswers,
        memeReactions,
        loginProvider
      );
      
      login(profile);
      
      localStorage.removeItem(QUIZ_ANSWERS_KEY);
      localStorage.removeItem(MEME_REACTIONS_KEY);

      navigate('/dashboard');

    } catch (error) {
      console.error("Failed to generate developer profile:", error);
      setCompanionMessage("Oops! Our AI companion is taking a coffee break. Please try again.");
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  const toggleLike = (matchId: string) => {
    setLikedMatches(prev => {
        const newSet = new Set(prev);
        if (newSet.has(matchId)) {
            newSet.delete(matchId);
        } else {
            newSet.add(matchId);
        }
        return newSet;
    });
    // In a real app, this would also be an API call
  };

  const value = {
    quizAnswers,
    memeReactions,
    isGeneratingProfile,
    companionMessage,
    likedMatches,
    setQuizAnswer,
    addMemeReaction,
    finalizeProfile,
    setCompanionMessage,
    toggleLike,
  };

  return (
    <ProfileBuilderContext.Provider value={value}>
      {children}
    </ProfileBuilderContext.Provider>
  );
};

export const useProfileBuilder = () => {
  const context = useContext(ProfileBuilderContext);
  if (context === undefined) {
    throw new Error('useProfileBuilder must be used within a ProfileBuilderProvider');
  }
  return context;
};
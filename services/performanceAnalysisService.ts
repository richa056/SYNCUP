import { QuizAnswers, MemeReaction } from '../types';

export interface PerformanceMetrics {
  workStyle: {
    schedule: 'morning' | 'night' | 'flexible';
    efficiency: number; // 0-100
    collaboration: number; // 0-100
  };
  technicalPreference: {
    complexity: number; // 0-100
    innovation: number; // 0-100
    tradition: number; // 0-100
  };
  personality: {
    humor: number; // 0-100
    stressTolerance: number; // 0-100
    social: number; // 0-100
  };
  overallScore: number; // 0-100
}

export interface UserSimilarity {
  userId: string;
  user: any; // MongoDB user object
  similarityScore: number;
  commonAnswers: number;
  commonReactions: number;
  matchingTraits: string[];
  compatibility: 'high' | 'medium' | 'low';
}

export const analyzePerformanceMetrics = (
  quizAnswers: QuizAnswers,
  memeReactions: MemeReaction[]
): PerformanceMetrics => {
  let workStyleScore = 0;
  let technicalScore = 0;
  let personalityScore = 0;
  
  // Analyze work style from quiz answers
  if (quizAnswers[1] === '☀️ Morning Maverick') {
    workStyleScore += 40; // Morning person
  } else if (quizAnswers[1] === '🌙 Night Owl Ninja') {
    workStyleScore += 30; // Night person
  } else {
    workStyleScore += 35; // Flexible
  }
  
  if (quizAnswers[2] === '🎨 Zsh/Fish Customizer') {
    workStyleScore += 25; // Customization lover
  } else if (quizAnswers[2] === '🚀 Warp/Fig Magician') {
    workStyleScore += 30; // Modern tools
  } else {
    workStyleScore += 20; // Traditional
  }
  
  if (quizAnswers[4] === 'Spaces') {
    workStyleScore += 15; // Clean code preference
  } else {
    workStyleScore += 10; // Efficiency focused
  }
  
  // Analyze technical preferences
  if (quizAnswers[5] === 'Git Guru') {
    technicalScore += 35; // Version control expert
  } else if (quizAnswers[5] === 'Kanban King') {
    technicalScore += 30; // Visual organizer
  } else {
    technicalScore += 25; // Documentation focused
  }
  
  if (quizAnswers[6] === '🔄 Redux Saga') {
    technicalScore += 30; // Complex state management
  } else if (quizAnswers[6] === '🐻 Zustand/Jotai') {
    technicalScore += 25; // Lightweight
  } else {
    technicalScore += 20; // Simple
  }
  
  if (quizAnswers[7] === 'Dark') {
    technicalScore += 15; // Modern preference
  } else {
    technicalScore += 10; // Traditional
  }
  
  // Analyze personality from meme reactions
  const funnyCount = memeReactions.filter(r => r.reaction === '😂').length;
  const totalReactions = memeReactions.length;
  
  if (totalReactions > 0) {
    const humorRatio = funnyCount / totalReactions;
    personalityScore += Math.round(humorRatio * 40);
    
    // Stress tolerance analysis
    const stressMemes = ['This is Fine (Production)', 'Explaining a Bug', 'Senior Dev Review'];
    const stressReactions = memeReactions.filter(r => 
      stressMemes.includes(r.memeId) && r.reaction === '😂'
    ).length;
    
    if (stressReactions > 1) {
      personalityScore += 30; // High stress tolerance
    } else if (stressReactions === 0) {
      personalityScore += 15; // Low stress tolerance
    } else {
      personalityScore += 20; // Medium
    }
    
    // Social preference
    const socialMemes = ['Weekend Coding', 'Work From Home', 'Coffee Addiction'];
    const socialReactions = memeReactions.filter(r => 
      socialMemes.includes(r.memeId) && r.reaction === '💯'
    ).length;
    
    if (socialReactions > 1) {
      personalityScore += 30; // Social coder
    } else {
      personalityScore += 20; // Independent
    }
  }
  
  const overallScore = Math.round((workStyleScore + technicalScore + personalityScore) / 3);
  
  return {
    workStyle: {
      schedule: quizAnswers[1] === '☀️ Morning Maverick' ? 'morning' : 
                quizAnswers[1] === '🌙 Night Owl Ninja' ? 'night' : 'flexible',
      efficiency: Math.min(100, workStyleScore),
      collaboration: quizAnswers[10] === '☕ Cozy Coffee Shop' ? 80 : 
                    quizAnswers[10] === '🏙️ Multi-Monitor Command Center' ? 60 : 40
    },
    technicalPreference: {
      complexity: quizAnswers[6] === '🔄 Redux Saga' ? 90 : 
                  quizAnswers[6] === '🐻 Zustand/Jotai' ? 70 : 50,
      innovation: quizAnswers[2] === '🚀 Warp/Fig Magician' ? 85 : 
                  quizAnswers[2] === '🎨 Zsh/Fish Customizer' ? 70 : 50,
      tradition: quizAnswers[2] === ' Bash Purist' ? 80 : 
                 quizAnswers[2] === '🎨 Zsh/Fish Customizer' ? 60 : 40
    },
    personality: {
      humor: Math.min(100, personalityScore),
      stressTolerance: memeReactions.filter(r => 
        ['This is Fine (Production)', 'Explaining a Bug'].includes(r.memeId) && r.reaction === '😂'
      ).length > 1 ? 85 : 60,
      social: quizAnswers[10] === '☕ Cozy Coffee Shop' ? 80 : 50
    },
    overallScore
  };
};

export const findMostSimilarUsers = async (
  currentUserId: string,
  quizAnswers: QuizAnswers,
  memeReactions: MemeReaction[],
  performanceMetrics: PerformanceMetrics
): Promise<UserSimilarity[]> => {
  try {
    console.log('🔍 Finding most similar users...');
    
    // Fetch all users who have completed onboarding
    const response = await fetch('/api/users/similar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentUserId,
        quizAnswers,
        memeReactions,
        performanceMetrics
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch similar users');
    }

    const similarUsers = await response.json();
    console.log(`✅ Found ${similarUsers.length} similar users`);
    
    return similarUsers;
    
  } catch (error) {
    console.error('❌ Error finding similar users:', error);
    return [];
  }
};

export const calculateUserSimilarity = (
  user1: { quizAnswers: QuizAnswers; memeReactions: MemeReaction[] },
  user2: { quizAnswers: QuizAnswers; memeReactions: MemeReaction[] }
): number => {
  let similarityScore = 0;
  let totalQuestions = 0;
  
  // Compare quiz answers
  for (const [questionId, answer1] of Object.entries(user1.quizAnswers)) {
    const answer2 = user2.quizAnswers[questionId];
    if (answer1 && answer2) {
      totalQuestions++;
      if (answer1 === answer2) {
        similarityScore += 1;
      } else if (areAnswersSimilar(answer1, answer2)) {
        similarityScore += 0.5;
      }
    }
  }
  
  // Compare meme reactions
  const user1Reactions = new Set(user1.memeReactions.map(r => `${r.memeId}:${r.reaction}`));
  const user2Reactions = new Set(user2.memeReactions.map(r => `${r.memeId}:${r.reaction}`));
  
  const commonReactions = [...user1Reactions].filter(r => user2Reactions.has(r));
  const totalReactions = Math.max(user1.memeReactions.length, user2.memeReactions.length);
  
  if (totalReactions > 0) {
    similarityScore += (commonReactions.length / totalReactions) * 2;
  }
  
  // Normalize score to 0-100
  const maxPossibleScore = totalQuestions + 2;
  return Math.round((similarityScore / maxPossibleScore) * 100);
};

const areAnswersSimilar = (answer1: any, answer2: any): boolean => {
  // Define similar answer groups
  const similarGroups = {
    workSchedule: ['☀️ Morning Maverick', '🌙 Night Owl Ninja'],
    terminalStyle: ['🎨 Zsh/Fish Customizer', '🚀 Warp/Fig Magician'],
    projectManagement: ['Git Guru', 'Notion Nerd'],
    uiPreference: ['Light', 'Dark']
  };
  
  for (const [category, answers] of Object.entries(similarGroups)) {
    if (answers.includes(answer1) && answers.includes(answer2)) {
      return true;
    }
  }
  
  return false;
};

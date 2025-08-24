import { DeveloperProfile, QuizAnswers, MemeReaction } from '../types';
import { findMatchesFromDatabase } from './mongoMatchingService';

interface ProfileMatch {
  profile: DeveloperProfile;
  score: number;
  reasons: string[];
  compatibility: {
    techOverlap: number;
    personalityMatch: number;
    workStyle: number;
    overall: number;
  };
}

export const analyzeProfileAndFindMatches = async (
  quizAnswers: QuizAnswers,
  memeReactions: MemeReaction[],
  loginProvider: string,
  userDevDna?: any,
  currentUserId?: string
): Promise<ProfileMatch[]> => {
  
  console.log('Profile Matching: Analyzing with:', { quizAnswers, memeReactions, loginProvider, userDevDna, currentUserId });
  
  // If we have a current user ID, try to find real matches from database
  if (currentUserId) {
    try {
      console.log('🔍 Attempting to find real matches from database for user:', currentUserId);
      const realMatches = await findMatchesFromDatabase(
        quizAnswers,
        memeReactions,
        currentUserId,
        [] // No exclusions for now
      );
      
      if (realMatches.length > 0) {
        console.log('✅ Found', realMatches.length, 'real matches from database');
        return realMatches;
      } else {
        console.log('⚠️ No real matches found in database, will show empty state');
        return [];
      }
    } catch (error) {
      console.error('❌ Error finding real matches:', error);
      // Fall through to return empty array instead of mock data
    }
  }
  
  // If no current user or database matching failed, return empty array
  console.log('ℹ️ No current user ID provided or database matching failed, returning empty matches');
  return [];
};

const analyzeQuizAnswers = (answers: QuizAnswers) => {
  const profile: any = {
    workSchedule: 'flexible',
    terminalStyle: 'custom',
    debuggingApproach: 'balanced',
    codeStyle: 'balanced',
    projectManagement: 'balanced',
    stateManagement: 'balanced',
    uiPreference: 'balanced',
    namingConvention: 'balanced',
    documentation: 'balanced',
    workEnvironment: 'balanced'
  };
  
  // Map quiz answers to profile traits
  if (answers[1] === '☀️ Morning Maverick') profile.workSchedule = 'morning';
  else if (answers[1] === '🌙 Night Owl Ninja') profile.workSchedule = 'night';
  
  if (answers[2] === '🎨 Zsh/Fish Customizer') profile.terminalStyle = 'custom';
  else if (answers[2] === ' Bash Purist') profile.terminalStyle = 'minimal';
  else if (answers[2] === '🚀 Warp/Fig Magician') profile.terminalStyle = 'modern';
  
  if (answers[3] === 0) profile.debuggingApproach = 'calm';
  else if (answers[3] === 100) profile.debuggingApproach = 'frantic';
  else profile.debuggingApproach = 'balanced';
  
  if (answers[4] === 'Tabs') profile.codeStyle = 'tabs';
  else if (answers[4] === 'Spaces') profile.codeStyle = 'spaces';
  
  if (answers[5] === 'Kanban King') profile.projectManagement = 'visual';
  else if (answers[5] === 'Git Guru') profile.projectManagement = 'version-control';
  else if (answers[5] === 'Notion Nerd') profile.projectManagement = 'documentation';
  
  if (answers[6] === '⚛️ Context API') profile.stateManagement = 'simple';
  else if (answers[6] === '🐻 Zustand/Jotai') profile.stateManagement = 'lightweight';
  else if (answers[6] === '🔄 Redux Saga') profile.stateManagement = 'complex';
  
  if (answers[7] === 'Light') profile.uiPreference = 'light';
  else if (answers[7] === 'Dark') profile.uiPreference = 'dark';
  
  if (answers[8] === 'camelCaseChampion') profile.namingConvention = 'camelCase';
  else if (answers[8] === 'PascalCasePioneer') profile.namingConvention = 'pascalCase';
  else if (answers[8] === 'snake_case_selector') profile.namingConvention = 'snake_case';
  
  if (answers[9] === 0) profile.documentation = 'essential';
  else if (answers[9] === 100) profile.documentation = 'optional';
  else profile.documentation = 'balanced';
  
  if (answers[10] === '💻 Minimalist Laptop') profile.workEnvironment = 'minimal';
  else if (answers[10] === '🏙️ Multi-Monitor Command Center') profile.workEnvironment = 'complex';
  else if (answers[10] === '☕ Cozy Coffee Shop') profile.workEnvironment = 'social';
  
  return profile;
};

const analyzeMemeReactions = (reactions: MemeReaction[]) => {
  const personality: any = {
    humor: 'balanced',
    stressTolerance: 'balanced',
    workLifeBalance: 'balanced'
  };
  
  // Analyze meme reactions for personality insights
  const funnyCount = reactions.filter(r => r.reaction === '😂').length;
  const totalReactions = reactions.length;
  
  if (totalReactions > 0) {
    const humorRatio = funnyCount / totalReactions;
    if (humorRatio > 0.7) personality.humor = 'high';
    else if (humorRatio < 0.3) personality.humor = 'low';
    
    // Specific meme insights
    const stressMemes = ['This is Fine (Production)', 'Explaining a Bug', 'Senior Dev Review'];
    const stressReactions = reactions.filter(r => 
      stressMemes.includes(r.memeId) && r.reaction === '😂'
    ).length;
    
    if (stressReactions > 1) personality.stressTolerance = 'high';
    else if (stressReactions === 0) personality.stressTolerance = 'low';
  }
  
  return personality;
};

const calculateCompatibility = (
  userProfile: any,
  userPersonality: any,
  match: DeveloperProfile,
  userDevDna?: any
) => {
  let techOverlap = 0;
  let personalityMatch = 0;
  let workStyle = 0;
  
  // Tech overlap (if GitHub login provided Dev DNA)
  if (userDevDna && userDevDna.topLanguages) {
    const userLanguages = userDevDna.topLanguages.map((l: any) => l.lang.toLowerCase());
    const matchLanguages = match.devDna.topLanguages.map(l => l.lang.toLowerCase());
    
    const commonLanguages = userLanguages.filter(lang => matchLanguages.includes(lang));
    if (commonLanguages.length > 0) {
      techOverlap = Math.min(30, commonLanguages.length * 10);
    }
  }
  
  // Personality compatibility
  if (userPersonality.humor === match.traits.some(t => t.includes('Meme') || t.includes('Fun')) ? 'high' : 'low') {
    personalityMatch += 15;
  }
  
  if (userProfile.workSchedule === 'night' && match.traits.some(t => t.includes('Night') || t.includes('Owl'))) {
    personalityMatch += 10;
  }
  
  if (userProfile.workSchedule === 'morning' && match.traits.some(t => t.includes('Morning') || t.includes('Early'))) {
    personalityMatch += 10;
  }
  
  // Work style compatibility
  if (userProfile.terminalStyle === 'custom' && match.traits.some(t => t.includes('Custom') || t.includes('Zsh'))) {
    workStyle += 8;
  }
  
  if (userProfile.debuggingApproach === 'calm' && match.traits.some(t => t.includes('Calm') || t.includes('Patient'))) {
    workStyle += 8;
  }
  
  if (userProfile.documentation === 'essential' && match.traits.some(t => t.includes('Documentation') || t.includes('Clean'))) {
    workStyle += 8;
  }
  
  // Provider-specific bonuses
  if (match.traits.some(t => t.includes('GitHub') || t.includes('Open Source')) && 
      (userProfile.projectManagement === 'version-control' || userProfile.projectManagement === 'documentation')) {
    workStyle += 5;
  }
  
  const overall = Math.min(100, techOverlap + personalityMatch + workStyle + 40); // Base 40 points
  
  return { techOverlap, personalityMatch, workStyle, overall };
};

const generateMatchReasons = (
  userProfile: any,
  userPersonality: any,
  match: DeveloperProfile,
  compatibility: any
): string[] => {
  const reasons: string[] = [];
  
  if (compatibility.techOverlap > 0) {
    reasons.push(`You both work with ${compatibility.techOverlap > 20 ? 'similar' : 'some'} technologies`);
  }
  
  if (compatibility.personalityMatch > 20) {
    reasons.push("Your personalities seem to complement each other well");
  }
  
  if (compatibility.workStyle > 20) {
    reasons.push("You share similar work habits and preferences");
  }
  
  if (match.traits.some(t => t.includes('Meme') || t.includes('Fun'))) {
    reasons.push("You both appreciate developer humor");
  }
  
  if (match.traits.some(t => t.includes('Clean') || t.includes('Documentation'))) {
    reasons.push("You value code quality and documentation");
  }
  
  return reasons.length > 0 ? reasons : ["You seem to have complementary skills and interests"];
};

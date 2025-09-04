import { QuizAnswers, MemeReaction } from '../types';
import { GitHubAnalysis } from './githubService';

export interface DeveloperProfile {
  id: string;
  name: string;
  avatarUrl: string;
  codename: string;
  badges: string[];
  traits: string[];
  trustLevel: number;
  profileRating: number;
  devDna: {
    topLanguages: { lang: string; value: number }[];
    commitFrequency: number;
    starCount: number;
    workStyle: string;
    problemSolving: string;
    teamCollaboration: string;
    learningStyle: string;
    stressTolerance: string;
    innovationLevel: string;
    githubInsights?: {
      accountAge: number;
      activityLevel: string;
      expertiseAreas: string[];
      collaborationStyle: string;
      projectDiversity: string;
    };
  };
  personalityInsights: {
    workSchedule: string;
    terminalCustomization: string;
    debuggingStyle: string;
    codeStyle: string;
    projectManagement: string;
    stateManagement: string;
    themePreference: string;
    namingConvention: string;
    documentationStyle: string;
    workEnvironment: string;
    humorType: string;
    relatabilityScore: number;
  };
}

export const analyzeQuizAnswers = (answers: QuizAnswers) => {
  const insights: any = {};
  
  // Work Schedule Analysis
  if (answers[1]) {
    if (answers[1].includes('Morning')) {
      insights.workSchedule = 'Early Bird';
      insights.energyPeak = 'Morning';
    } else if (answers[1].includes('Night')) {
      insights.workSchedule = 'Night Owl';
      insights.energyPeak = 'Evening';
    } else {
      insights.workSchedule = 'Flexible';
      insights.energyPeak = 'Adaptive';
    }
  }
  
  // Terminal Customization Analysis
  if (answers[2]) {
    if (answers[2].includes('Zsh/Fish')) {
      insights.terminalCustomization = 'Power User';
      insights.techSavvy = 'High';
    } else if (answers[2].includes('Warp/Fig')) {
      insights.terminalCustomization = 'Modern Tools';
      insights.innovationLevel = 'High';
    } else {
      insights.terminalCustomization = 'Traditional';
      insights.techSavvy = 'Moderate';
    }
  }
  
  // Debugging Stress Analysis
  if (answers[3] !== undefined) {
    if (answers[3] <= 30) {
      insights.debuggingStyle = 'Zen Master';
      insights.stressTolerance = 'Very High';
    } else if (answers[3] <= 60) {
      insights.debuggingStyle = 'Calm Problem Solver';
      insights.stressTolerance = 'High';
    } else {
      insights.debuggingStyle = 'Panic Mode';
      insights.stressTolerance = 'Moderate';
    }
  }
  
  // Code Style Analysis
  if (answers[4]) {
    if (answers[4] === 'Tabs') {
      insights.codeStyle = 'Tab Enthusiast';
      insights.consistency = 'High';
    } else {
      insights.codeStyle = 'Space Advocate';
      insights.consistency = 'High';
    }
  }
  
  // Project Management Analysis
  if (answers[5]) {
    if (answers[5].includes('Kanban')) {
      insights.projectManagement = 'Visual Organizer';
      insights.organizationStyle = 'Kanban';
    } else if (answers[5].includes('Git')) {
      insights.projectManagement = 'Version Control Expert';
      insights.organizationStyle = 'Git-based';
    } else {
      insights.projectManagement = 'Documentation Lover';
      insights.organizationStyle = 'Notion-based';
    }
  }
  
  // State Management Analysis
  if (answers[6]) {
    if (answers[6].includes('Context API')) {
      insights.stateManagement = 'React Native';
      insights.complexityPreference = 'Simple';
    } else if (answers[6].includes('Zustand')) {
      insights.stateManagement = 'Modern State';
      insights.complexityPreference = 'Balanced';
    } else {
      insights.stateManagement = 'Enterprise';
      insights.complexityPreference = 'Complex';
    }
  }
  
  // Theme Preference Analysis
  if (answers[7]) {
    insights.themePreference = answers[7];
    insights.aestheticSense = answers[7] === 'Dark' ? 'Modern' : 'Clean';
  }
  
  // Naming Convention Analysis
  if (answers[8]) {
    if (answers[8].includes('camelCase')) {
      insights.namingConvention = 'JavaScript Standard';
      insights.languagePreference = 'JavaScript/TypeScript';
    } else if (answers[8].includes('PascalCase')) {
      insights.namingConvention = 'Class-based';
      insights.languagePreference = 'C#/Java';
    } else {
      insights.namingConvention = 'Python Style';
      insights.languagePreference = 'Python';
    }
  }
  
  // Documentation Analysis
  if (answers[9] !== undefined) {
    if (answers[9] >= 80) {
      insights.documentationStyle = 'Documentation Guru';
      insights.teamCollaboration = 'Excellent';
    } else if (answers[9] >= 50) {
      insights.documentationStyle = 'Balanced';
      insights.teamCollaboration = 'Good';
    } else {
      insights.documentationStyle = 'Code First';
      insights.teamCollaboration = 'Moderate';
    }
  }
  
  // Work Environment Analysis
  if (answers[10]) {
    if (answers[10].includes('Minimalist')) {
      insights.workEnvironment = 'Focused';
      insights.distractionTolerance = 'Low';
    } else if (answers[10].includes('Multi-Monitor')) {
      insights.workEnvironment = 'Productivity Maximizer';
      insights.distractionTolerance = 'High';
    } else {
      insights.workEnvironment = 'Social Coder';
      insights.distractionTolerance = 'High';
    }
  }
  
  return insights;
};

export const analyzeMemeReactions = (reactions: MemeReaction[]) => {
  const insights: any = {};
  
  // Calculate humor type and relatability
  const reactionCounts = {
    '😐': 0, // Meh
    '😂': 0, // Funny
    '💯': 0, // Relatable
    '😭': 0  // Too Real
  };
  
  reactions.forEach(reaction => {
    reactionCounts[reaction.reaction as keyof typeof reactionCounts]++;
  });
  
  // Determine humor type
  if (reactionCounts['😂'] > reactionCounts['💯']) {
    insights.humorType = 'Comedy Lover';
  } else if (reactionCounts['💯'] > reactionCounts['😂']) {
    insights.humorType = 'Relatability Seeker';
  } else {
    insights.humorType = 'Balanced Humor';
  }
  
  // Calculate relatability score
  const totalReactions = reactions.length;
  const relatableReactions = reactionCounts['💯'] + reactionCounts['😭'];
  insights.relatabilityScore = totalReactions > 0 ? (relatableReactions / totalReactions) * 100 : 0;
  
  // Determine developer personality based on reactions
  if (reactionCounts['😭'] > reactionCounts['😂']) {
    insights.developerPersonality = 'Experienced Developer';
    insights.experienceLevel = 'High';
  } else if (reactionCounts['💯'] > reactionCounts['😐']) {
    insights.developerPersonality = 'Mid-level Developer';
    insights.experienceLevel = 'Medium';
  } else {
    insights.developerPersonality = 'Junior Developer';
    insights.experienceLevel = 'Low';
  }
  
  return insights;
};

export const generateDeveloperProfile = (
  quizAnswers: QuizAnswers,
  memeReactions: MemeReaction[],
  userData: any,
  githubData?: GitHubAnalysis
): DeveloperProfile => {
  const quizInsights = analyzeQuizAnswers(quizAnswers);
  const memeInsights = analyzeMemeReactions(memeReactions);
  
  // Generate codename based on insights
  const codenames = [
    'CodeCraft', 'DebugMaster', 'SyntaxNinja', 'AlgorithmWizard',
    'GitGuru', 'StackOverflow', 'BugHunter', 'CodeReviewer',
    'DeploymentKing', 'DatabaseDragon', 'APIArchitect', 'CloudPioneer'
  ];
  
  const codename = codenames[Math.floor(Math.random() * codenames.length)];
  
  // Generate badges based on insights
  const badges = [];
  if (quizInsights.debuggingStyle === 'Zen Master') badges.push('Zen Debugger');
  if (quizInsights.documentationStyle === 'Documentation Guru') badges.push('Doc Master');
  if (memeInsights.experienceLevel === 'High') badges.push('Veteran Coder');
  if (quizInsights.innovationLevel === 'High') badges.push('Innovation Leader');
  if (quizInsights.teamCollaboration === 'Excellent') badges.push('Team Player');
  
  // Add GitHub-based badges
  if (githubData) {
    if (githubData.activityLevel === 'High') badges.push('Active Contributor');
    if (githubData.collaborationStyle === 'Community Contributor') badges.push('Open Source Hero');
    if (githubData.expertiseAreas.includes('Full-Stack Development')) badges.push('Full-Stack Developer');
    if (githubData.accountAge > 5) badges.push('GitHub Veteran');
  }
  
  // Generate traits
  const traits = [];
  if (quizInsights.workSchedule === 'Early Bird') traits.push('Morning Person');
  if (quizInsights.terminalCustomization === 'Power User') traits.push('Terminal Expert');
  if (quizInsights.stressTolerance === 'Very High') traits.push('Stress Resistant');
  if (memeInsights.humorType === 'Relatability Seeker') traits.push('Empathetic Developer');
  
  // Add GitHub-based traits
  if (githubData) {
    if (githubData.activityLevel === 'High') traits.push('Highly Active');
    if (githubData.collaborationStyle === 'Community Contributor') traits.push('Community Driven');
    if (githubData.projectDiversity === 'Full-Stack Developer') traits.push('Versatile Developer');
  }
  
  // Calculate trust level and profile rating
  let trustLevel = 70 + (memeInsights.relatabilityScore * 0.25);
  
  // Boost trust level with GitHub data
  if (githubData) {
    if (githubData.activityLevel === 'High') trustLevel += 10;
    if (githubData.accountAge > 3) trustLevel += 5;
    if (githubData.starCount > 50) trustLevel += 5;
  }
  
  trustLevel = Math.min(95, trustLevel);
  const profileRating = Math.min(5.0, 4.0 + (trustLevel / 100));
  
  // Generate Dev DNA
  const devDna = {
    topLanguages: generateTopLanguages(quizInsights, githubData),
    commitFrequency: calculateCommitFrequency(githubData),
    starCount: calculateStarCount(githubData),
    workStyle: quizInsights.workSchedule || 'Flexible',
    problemSolving: quizInsights.debuggingStyle || 'Balanced',
    teamCollaboration: quizInsights.teamCollaboration || 'Good',
    learningStyle: determineLearningStyle(quizInsights),
    stressTolerance: quizInsights.stressTolerance || 'Moderate',
    innovationLevel: quizInsights.innovationLevel || 'Moderate',
    githubInsights: githubData ? {
      accountAge: githubData.accountAge,
      activityLevel: githubData.activityLevel,
      expertiseAreas: githubData.expertiseAreas,
      collaborationStyle: githubData.collaborationStyle,
      projectDiversity: githubData.projectDiversity
    } : undefined
  };
  
  return {
    id: userData.id || 'user_' + Date.now(),
    name: userData.name || 'Anonymous Developer',
    avatarUrl: userData.avatarUrl || 'https://via.placeholder.com/150',
    codename,
    badges,
    traits,
    trustLevel: Math.round(trustLevel),
    profileRating: Math.round(profileRating * 10) / 10,
    devDna,
    personalityInsights: {
      ...quizInsights,
      ...memeInsights
    }
  };
};

const generateTopLanguages = (quizInsights: any, githubData?: GitHubAnalysis) => {
  if (githubData?.topLanguages) {
    return Object.entries(githubData.topLanguages)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([lang, value]) => ({ lang, value: value as number }));
  }
  
  // Fallback based on quiz insights
  const languages = [];
  if (quizInsights.languagePreference === 'JavaScript/TypeScript') {
    languages.push({ lang: 'JavaScript', value: 85 });
    languages.push({ lang: 'TypeScript', value: 78 });
    languages.push({ lang: 'React', value: 72 });
  } else if (quizInsights.languagePreference === 'Python') {
    languages.push({ lang: 'Python', value: 88 });
    languages.push({ lang: 'Django', value: 75 });
    languages.push({ lang: 'Data Science', value: 70 });
  } else {
    languages.push({ lang: 'JavaScript', value: 80 });
    languages.push({ lang: 'Python', value: 70 });
    languages.push({ lang: 'Java', value: 65 });
  }
  
  return languages;
};

const calculateCommitFrequency = (githubData?: GitHubAnalysis) => {
  if (githubData?.commitFrequency) {
    return githubData.commitFrequency;
  }
  return Math.floor(Math.random() * 20) + 10;
};

const calculateStarCount = (githubData?: GitHubAnalysis) => {
  if (githubData?.starCount) {
    return githubData.starCount;
  }
  return Math.floor(Math.random() * 100) + 20;
};

const determineLearningStyle = (quizInsights: any) => {
  if (quizInsights.documentationStyle === 'Documentation Guru') {
    return 'Documentation First';
  } else if (quizInsights.innovationLevel === 'High') {
    return 'Experiment Driven';
  } else {
    return 'Hands-on Learning';
  }
};

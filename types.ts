export type QuizQuestion =
  | {
      id: number;
      question: string;
      type: 'slider';
      min: number;
      max: number;
      default: number;
    }
  | {
      id: number;
      question: string;
      type: 'cards' | 'toggle';
      options: string[];
    };

export interface QuizAnswers {
  [questionId: number]: any;
}

export interface MemeReaction {
  memeId: string;
  reaction: '😐' | '😂' | '💯' | '😭';
  timestamp: number;
}

export interface Meme {
  id: string;
  imageUrl: string;
  fallbackUrl: string;
}

export interface DevDna {
  topLanguages: { lang: string, value: number }[];
  commitFrequency: number;
  starCount: number;
}

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

export interface Match {
  profile: DeveloperProfile;
  score: number;
  compatibility: {
    workStyle: number;
    problemSolving: number;
    teamCollaboration: number;
    learningStyle: number;
    humorType: number;
  };
}

export interface AuthUser extends DeveloperProfile {
  sessionId: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string; // 'user_01' for the current user, or match's id
  timestamp: Date;
}
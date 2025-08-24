import { QuizAnswers, MemeReaction } from '../types';

interface ProfileMatch {
  profile: any; // MongoDB User object
  score: number;
  reasons: string[];
  compatibility: {
    techOverlap: number;
    personalityMatch: number;
    workStyle: number;
    overall: number;
  };
}

export const findMatchesFromDatabase = async (
  quizAnswers: QuizAnswers,
  memeReactions: MemeReaction[],
  currentUserId: string,
  excludeIds: string[] = []
): Promise<ProfileMatch[]> => {
  try {
    // Fetch potential matches from MongoDB
    const response = await fetch('/api/users/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentUserId,
        excludeIds,
        quizAnswers,
        memeReactions
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch matches from database');
    }

    const potentialMatches = await response.json();
    
    // Calculate compatibility scores for each potential match
    const matches: ProfileMatch[] = potentialMatches.map((match: any) => {
      const compatibility = calculateCompatibility(quizAnswers, memeReactions, match);
      const score = Math.round(compatibility.overall);
      const reasons = generateMatchReasons(quizAnswers, memeReactions, match, compatibility);
      
      return { profile: match, score, reasons, compatibility };
    });

    // Sort by score (highest first) and return top matches
    return matches.sort((a, b) => b.score - a.score);
    
  } catch (error) {
    console.error('Error finding matches from database:', error);
    // Return empty array instead of fallback to mock matches
    return [];
  }
};

const calculateCompatibility = (
  quizAnswers: QuizAnswers,
  memeReactions: MemeReaction[],
  match: any
): { techOverlap: number; personalityMatch: number; workStyle: number; overall: number } => {
  let techOverlap = 0;
  let personalityMatch = 0;
  let workStyle = 0;
  
  // Tech overlap from Dev DNA
  if (match.devDna && match.devDna.topLanguages) {
    const userLanguages = quizAnswers[1] === '🌙 Night Owl Ninja' ? ['JavaScript', 'Python'] : ['Java', 'C++'];
    const matchLanguages = match.devDna.topLanguages.map((l: any) => l.lang);
    
    const commonLanguages = userLanguages.filter(lang => 
      matchLanguages.some((matchLang: string) => 
        matchLang.toLowerCase().includes(lang.toLowerCase())
      )
    );
    
    if (commonLanguages.length > 0) {
      techOverlap = Math.min(30, commonLanguages.length * 10);
    }
  }
  
  // Personality compatibility based on quiz answers
  if (quizAnswers[1] === '🌙 Night Owl Ninja' && match.traits.some((t: string) => t.includes('Night') || t.includes('Owl'))) {
    personalityMatch += 15;
  }
  
  if (quizAnswers[1] === '☀️ Morning Maverick' && match.traits.some((t: string) => t.includes('Morning') || t.includes('Early'))) {
    personalityMatch += 15;
  }
  
  // Work style compatibility
  if (quizAnswers[2] === '🎨 Zsh/Fish Customizer' && match.traits.some((t: string) => t.includes('Custom') || t.includes('Zsh'))) {
    workStyle += 10;
  }
  
  if (quizAnswers[4] === 'Spaces' && match.traits.some((t: string) => t.includes('Clean') || t.includes('Format'))) {
    workStyle += 8;
  }
  
  if (quizAnswers[5] === 'Git Guru' && match.provider === 'github') {
    workStyle += 8;
  }
  
  if (quizAnswers[7] === 'Dark' && match.traits.some((t: string) => t.includes('Dark') || t.includes('Night'))) {
    workStyle += 5;
  }
  
  const overall = Math.min(100, techOverlap + personalityMatch + workStyle + 40);
  
  return { techOverlap, personalityMatch, workStyle, overall };
};

const generateMatchReasons = (
  quizAnswers: QuizAnswers,
  memeReactions: MemeReaction[],
  match: any,
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
  
  if (match.traits.some((t: string) => t.includes('Meme') || t.includes('Fun'))) {
    reasons.push("You both appreciate developer humor");
  }
  
  if (match.provider === 'github' && quizAnswers[5] === 'Git Guru') {
    reasons.push("You both value version control and open source");
  }
  
  if (match.provider === 'linkedin' && quizAnswers[10] === '☕ Cozy Coffee Shop') {
    reasons.push("You both appreciate professional networking");
  }
  
  return reasons.length > 0 ? reasons : ["You seem to have complementary skills and interests"];
};

// Fallback function removed - now using real database matching only

// Save user's quiz answers and meme reactions to database
export const saveUserProfileData = async (
  userId: string,
  quizAnswers: QuizAnswers,
  memeReactions: MemeReaction[]
): Promise<boolean> => {
  try {
    console.log('🔄 Saving user profile data for:', userId);
    console.log('📝 Quiz answers:', Object.keys(quizAnswers).length);
    console.log('😄 Meme reactions:', memeReactions.length);

    const response = await fetch(`/api/users/${userId}/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quizAnswers, memeReactions })
    });

    if (response.ok) {
      console.log('✅ User profile data saved successfully');
      return true;
    } else {
      const errorText = await response.text();
      console.error('Failed to save profile data:', response.status, response.statusText, errorText);
      return false;
    }
  } catch (error) {
    console.error('Error saving user profile data:', error);
    return false;
  }
};

// Function to get user's current matches from database
export const getUserMatches = async (userId: string): Promise<ProfileMatch[]> => {
  try {
    const response = await fetch(`/api/users/${userId}/matches`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user matches');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user matches:', error);
    return [];
  }
};

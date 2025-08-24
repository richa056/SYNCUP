

import { QuizAnswers, MemeReaction, DeveloperProfile } from '../types';
// Removed MOCK_USER_PROFILE import - using real user data
import { GoogleGenAI, Type } from "@google/genai";

// Safe, optional AI client for browser. Falls back if no key is provided.
let ai: GoogleGenAI | null = null;
try {
  // Vite convention: expose key as VITE_GEMINI_API_KEY. Support legacy process.env.API_KEY too.
  const apiKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? (process as any)?.env?.API_KEY : undefined);
  if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0) {
    ai = new GoogleGenAI({ apiKey });
  }
} catch (err) {
  ai = null;
}

const profileGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        codename: { type: Type.STRING, description: "A witty, cool, and unique codename for the developer. Should be creative and based on their answers, e.g., 'The Async Avenger', 'The CSS Alchemist'." },
        traits: { 
            type: Type.ARRAY, 
            description: "A list of exactly 3 short, descriptive personality traits derived from their answers. e.g., 'Night Owl Coder', 'Pragmatic Debugger', 'Meme-Driven'.",
            items: { type: Type.STRING } 
        },
        badges: {
            type: Type.ARRAY,
            description: "A list of exactly 3 impressive-sounding skill-based badges that sound like achievements. e.g., 'State Management Sage', 'Terminal Virtuoso', 'Documentation Diplomat'.",
            items: { type: Type.STRING }
        },
        profileRating: { type: Type.INTEGER, description: "A score from 60-95 representing the overall profile coolness and completeness. Be generous." },
        trustLevel: { type: Type.INTEGER, description: "A score from 60-95 representing how trustworthy or reliable the developer seems. More thoughtful answers = higher trust." },
    },
    required: ["codename", "traits", "badges", "profileRating", "trustLevel"]
};

export const generateDeveloperProfile = async (
  quizAnswers: QuizAnswers,
  memeReactions: MemeReaction[],
  loginProvider: string
): Promise<DeveloperProfile> => {
  const prompt = `
    You are a witty and creative persona generator for a developer matching app called SyncUp.
    Your goal is to make the user feel cool and understood.
    Based on the following quiz answers, meme reactions, and login method, create a unique developer profile.
    The user's existing GitHub data (Dev DNA) is provided and should be kept as-is.
    Generate a new codename, a list of 3 personality traits, and 3 skill-based badges. These should be directly inspired by their answers.
    Also, calculate a 'Profile Rating' (a coolness score) and a 'Trust Level' (a reliability score), both between 60 and 95.
    
    **User's Data:**
    - Login Method: ${loginProvider}. (GitHub suggests a focus on collaboration and code; LinkedIn suggests professionalism; Google is neutral. Use this as a subtle hint for the tone of the persona).
    - Quiz Answers: ${JSON.stringify(quizAnswers)}
    - Meme Reactions: ${JSON.stringify(memeReactions)}

    **Your Task:**
    Analyze the data and generate a profile. For example, if they chose 'Night Owl Ninja', their traits should reflect that. If they signed in with GitHub, badges like 'Open-Source Contributor' might be appropriate.
    Return ONLY a valid JSON object matching the requested schema. Do not include any other text or markdown.
  `;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: profileGenerationSchema,
        },
      });
      const parsedProfile = JSON.parse(response.text);
      return {
        id: 'user_' + Date.now(),
        name: 'AI Generated Developer',
        avatarUrl: 'https://via.placeholder.com/150',
        codename: parsedProfile.codename,
        badges: parsedProfile.badges,
        traits: parsedProfile.traits,
        trustLevel: parsedProfile.trustLevel,
        profileRating: parsedProfile.profileRating,
        devDna: {
          topLanguages: [
            { lang: 'JavaScript', value: 80 },
            { lang: 'Python', value: 70 },
            { lang: 'TypeScript', value: 65 }
          ],
          commitFrequency: 15,
          starCount: 25,
          workStyle: 'Flexible',
          problemSolving: 'Balanced',
          teamCollaboration: 'Good',
          learningStyle: 'Hands-on Learning',
          stressTolerance: 'Moderate',
          innovationLevel: 'Moderate'
        },
        personalityInsights: {
          workSchedule: 'Flexible',
          terminalCustomization: 'Modern',
          debuggingStyle: 'Balanced',
          codeStyle: 'Clean',
          projectManagement: 'Organized',
          stateManagement: 'Simple',
          themePreference: 'Dark',
          namingConvention: 'Standard',
          documentationStyle: 'Balanced',
          workEnvironment: 'Focused',
          humorType: 'Balanced',
          relatabilityScore: 75
        }
      };
    }
  } catch (error) {
    console.error("AI Profile Generation Failed:", error);
  }
  // Fallback to a simple profile when AI is unavailable or fails
  return {
    id: 'user_' + Date.now(),
    name: 'Fallback Developer',
    avatarUrl: 'https://via.placeholder.com/150',
    codename: "Fallback Futurist",
    badges: ["Error Handler", "Resilient Coder", "Problem Solver"],
    traits: ["Resilient Coder", "Adaptive", "Persistent"],
    trustLevel: 75,
    profileRating: 4.0,
    devDna: {
      topLanguages: [
        { lang: 'JavaScript', value: 70 },
        { lang: 'Python', value: 60 },
        { lang: 'HTML/CSS', value: 50 }
      ],
      commitFrequency: 10,
      starCount: 15,
      workStyle: 'Flexible',
      problemSolving: 'Balanced',
      teamCollaboration: 'Good',
      learningStyle: 'Hands-on Learning',
      stressTolerance: 'Moderate',
      innovationLevel: 'Moderate'
    },
    personalityInsights: {
      workSchedule: 'Flexible',
      terminalCustomization: 'Standard',
      debuggingStyle: 'Balanced',
      codeStyle: 'Clean',
      projectManagement: 'Organized',
      stateManagement: 'Simple',
      themePreference: 'Dark',
      namingConvention: 'Standard',
      documentationStyle: 'Balanced',
      workEnvironment: 'Focused',
      humorType: 'Balanced',
      relatabilityScore: 70
    }
  };
};

const matchScoreSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER, description: "A compatibility score from 0 to 99." },
        reason: { type: Type.STRING, description: "A short, one-sentence reason for the score."}
    },
    required: ["score", "reason"]
};

export const calculateMatchScore = async (
    userA: DeveloperProfile,
    userB: DeveloperProfile
): Promise<{score: number, reason: string}> => {
    const prompt = `
        You are a compatibility expert for a developer matching app.
        Given two developer profiles, analyze their traits, top languages, and dev habits.
        Calculate a compatibility score from 0 to 99 and provide a one-sentence reason.
        
        **Principles for Scoring:**
        1.  **High-Impact Tech Overlap:** Shared niche languages (like Rust, Go) or advanced skills (GraphQL) are a stronger match signal than common ones (JavaScript). +20-30 pts.
        2.  **Complementary Habits:** Opposing habits (e.g., 'Night Owl' vs 'Morning Maverick', 'Calm Detective' vs 'Frantic Logger') can be a good thing, indicating balance. +15-25 pts.
        3.  **Shared Foundational Tech:** Overlap in common languages (Python, TypeScript) is a good base. +10-15 pts.
        4.  **Similar Vibes:** Shared traits (e.g., both are 'Meme Connoisseurs' or 'Clean Coders') are a positive signal. +10-20 pts.

        **Profile A:** ${JSON.stringify({ traits: userA.traits, languages: userA.devDna.topLanguages.map(l=>l.lang) })}
        **Profile B:** ${JSON.stringify({ traits: userB.traits, languages: userB.devDna.topLanguages.map(l=>l.lang) })}

        Return ONLY a valid JSON object with the compatibility score and a short, insightful reason.
    `;

    try {
        if (ai) {
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: matchScoreSchema,
              },
          });
          const result = JSON.parse(response.text);
          return {
              score: Math.min(99, Math.max(0, result.score || 0)),
              reason: result.reason || "You two seem to have a great vibe!"
          };
        }
    } catch (error) {
        console.error("AI Match Score Calculation Failed:", error);
    }
    // Fallback when AI is unavailable or fails
    return {
        score: Math.floor(Math.random() * (95 - 60 + 1)) + 60,
        reason: "Your energies seem to align well!"
    };
};

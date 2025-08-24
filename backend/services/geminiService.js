
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        devDna: {
            type: Type.OBJECT,
            description: "A mock DevDNA structure. Pick 3 languages and assign percentages that add up to 100.",
            properties: {
                topLanguages: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            lang: { type: Type.STRING },
                            value: { type: Type.INTEGER }
                        },
                        required: ["lang", "value"]
                    }
                },
                commitFrequency: { type: Type.INTEGER, description: "A mock commit frequency score from 1-10" },
                starCount: { type: Type.INTEGER, description: "A mock star count from 50-500" }
            },
            required: ["topLanguages", "commitFrequency", "starCount"]
        }
    },
    required: ["codename", "traits", "badges", "profileRating", "trustLevel", "devDna"]
};

export const generateDeveloperProfile = async (
  quizAnswers,
  memeReactions,
  loginProvider
) => {
  const prompt = `
    You are a witty and creative persona generator for a developer matching app called SyncUp.
    Your goal is to make the user feel cool and understood.
    Based on the following quiz answers, meme reactions, and login method, create a unique developer profile.
    Generate a new codename, 3 traits, 3 badges, a profile rating, a trust level, and a mock 'Dev DNA' structure.
    
    **User's Data:**
    - Login Method: ${loginProvider}. (GitHub suggests a focus on collaboration; LinkedIn suggests professionalism; Google is neutral. Use this as a subtle hint for the tone of the persona).
    - Quiz Answers: ${JSON.stringify(quizAnswers)}
    - Meme Reactions: ${JSON.stringify(memeReactions)}

    Return ONLY a valid JSON object matching the requested schema. Do not include any other text or markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: profileGenerationSchema,
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Profile Generation Failed:", error);
    throw new Error("Failed to generate profile with AI");
  }
};

// Match scoring can be added here later
export const calculateMatchScore = async (userA, userB) => {
    // This logic can be fleshed out similar to the original mockApi
    return {
        score: Math.floor(Math.random() * (95 - 60 + 1)) + 60,
        reason: "Your energies seem to align well!"
    };
};

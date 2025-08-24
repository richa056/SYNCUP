
import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizAnswers, MemeReaction } from '../types';
import { generateDeveloperProfile } from '../services/profileAnalysisService';
import { analyzeProfileAndFindMatches } from '../services/profileMatchingService';
import { findMatchesFromDatabase, saveUserProfileData } from '../services/mongoMatchingService';
import { analyzePerformanceMetrics, findMostSimilarUsers, UserSimilarity } from '../services/performanceAnalysisService';
import { useAuth } from './AuthContext';

// LocalStorage Keys
const QUIZ_ANSWERS_KEY = 'syncup_quiz_answers';
const MEME_REACTIONS_KEY = 'syncup_meme_reactions';
const LIKED_MATCHES_KEY = 'syncup_liked_matches';
const ANALYZED_MATCHES_KEY = 'syncup_analyzed_matches';

// Helper to get data from localStorage
const getFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return fallback;
  }
};

interface ProfileBuilderContextType {
  quizAnswers: QuizAnswers;
  memeReactions: MemeReaction[];
  isGeneratingProfile: boolean;
  companionMessage: string;
  likedMatches: Set<string>;
  analyzedMatches: any[];
  connectionRequests: Set<string>;
  incomingRequests: Set<string>;
  mutualConnections: Set<string>;
  setQuizAnswer: (questionId: number, answer: any) => void;
  addMemeReaction: (reaction: MemeReaction) => void;
  finalizeProfile: (loginProvider: string) => Promise<void>;
  setCompanionMessage: (message: string) => void;
  toggleLike: (matchId: string) => void;
  sendConnectionRequest: (matchId: string) => void;
  acceptConnectionRequest: (matchId: string) => void;
  rejectConnectionRequest: (matchId: string) => void;
  getCurrentMatches: () => any[];
  refreshMatches: () => Promise<void>;
}

const ProfileBuilderContext = createContext<ProfileBuilderContextType | undefined>(undefined);

export const ProfileBuilderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>(() => getFromStorage(QUIZ_ANSWERS_KEY, {}));
  const [memeReactions, setMemeReactions] = useState<MemeReaction[]>(() => getFromStorage(MEME_REACTIONS_KEY, []));
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [companionMessage, setCompanionMessage] = useState("Welcome to SyncUp! Let's find your developer soulmate. First, tell us who you are.");
  const [likedMatches, setLikedMatches] = useState<Set<string>>(() => {
    const stored = getFromStorage(LIKED_MATCHES_KEY, []);
    return new Set(stored);
  });
  const [analyzedMatches, setAnalyzedMatches] = useState<any[]>(() => {
    const stored = getFromStorage(ANALYZED_MATCHES_KEY, []);
    return stored;
  });
  const [connectionRequests, setConnectionRequests] = useState<Set<string>>(() => {
    const stored = getFromStorage('syncup_connection_requests', []);
    return new Set(stored);
  });
  const [incomingRequests, setIncomingRequests] = useState<Set<string>>(() => {
    const stored = getFromStorage('syncup_incoming_requests', []);
    return new Set(stored);
  });
  const [mutualConnections, setMutualConnections] = useState<Set<string>>(() => {
    const stored = getFromStorage('syncup_mutual_connections', []);
    return new Set(stored);
  });
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();

  // Real-time analysis: recalculate matches whenever quiz answers or meme reactions change
  const [currentMatches, setCurrentMatches] = useState<any[]>([]);
  
  useEffect(() => {
    const updateMatches = async () => {
      if (Object.keys(quizAnswers).length === 0 || memeReactions.length === 0) {
        setCurrentMatches([]);
        return;
      }
      
      // Analyze current state and find matches
      try {
        const matches = await analyzeProfileAndFindMatches(
          quizAnswers,
          memeReactions,
          'github', // Default provider for real-time analysis
          undefined, // No Dev DNA for real-time analysis
          currentUser?.id // Pass current user ID for real database matching
        );
        setCurrentMatches(matches);
      } catch (error) {
        console.error('Error updating matches:', error);
        setCurrentMatches([]);
      }
    };
    
    updateMatches();
  }, [quizAnswers, memeReactions, currentUser?.id]);

  // Update analyzed matches whenever current matches change
  useEffect(() => {
    if (currentMatches.length > 0) {
      // Extract just the profile data from the ProfileMatch objects
      const profileData = currentMatches.map(match => match.profile);
      setAnalyzedMatches(profileData);
    }
  }, [currentMatches]);

  useEffect(() => { localStorage.setItem(QUIZ_ANSWERS_KEY, JSON.stringify(quizAnswers)); }, [quizAnswers]);
  useEffect(() => { localStorage.setItem(MEME_REACTIONS_KEY, JSON.stringify(memeReactions)); }, [memeReactions]);
  useEffect(() => { localStorage.setItem(LIKED_MATCHES_KEY, JSON.stringify(Array.from(likedMatches)));}, [likedMatches]);
  useEffect(() => { 
    localStorage.setItem(ANALYZED_MATCHES_KEY, JSON.stringify(analyzedMatches));
  }, [analyzedMatches]);
  useEffect(() => { localStorage.setItem('syncup_connection_requests', JSON.stringify(Array.from(connectionRequests))); }, [connectionRequests]);
  useEffect(() => { localStorage.setItem('syncup_incoming_requests', JSON.stringify(Array.from(incomingRequests))); }, [incomingRequests]);
  useEffect(() => { localStorage.setItem('syncup_mutual_connections', JSON.stringify(Array.from(mutualConnections))); }, [mutualConnections]);

  // Listen for localStorage changes from other tabs to enable real-time sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LIKED_MATCHES_KEY && e.newValue) {
        setLikedMatches(new Set(JSON.parse(e.newValue)));
      } else if (e.key === 'syncup_connection_requests' && e.newValue) {
        setConnectionRequests(new Set(JSON.parse(e.newValue)));
      } else if (e.key === 'syncup_incoming_requests' && e.newValue) {
        setIncomingRequests(new Set(JSON.parse(e.newValue)));
      } else if (e.key === 'syncup_mutual_connections' && e.newValue) {
        setMutualConnections(new Set(JSON.parse(e.newValue)));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setQuizAnswer = (questionId: number, answer: any) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Update companion message based on the answer
    const messages = [
      "Great choice! That tells us a lot about your style.",
      "Interesting preference! Let's see what else we can discover.",
      "Perfect! Your answers are helping us find your ideal matches.",
      "Excellent! We're building a great profile for you.",
      "That's helpful! Keep going to find your perfect developer match."
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setCompanionMessage(randomMessage);
  };

  const addMemeReaction = (reaction: MemeReaction) => {
    setMemeReactions(prev => [...prev.filter(r => r.memeId !== reaction.memeId), reaction]);
    
    // Update companion message based on meme reaction
    const reactionMessages = {
      '😐': "Not your style, huh? That's totally fine!",
      '😂': "Haha! You've got a great sense of humor!",
      '💯': "So relatable! You really get it!",
      '😭': "Too real! You've been there, done that!"
    };
    
    setCompanionMessage(reactionMessages[reaction.reaction] || "Great reaction! Keep going!");
  };
  
    const finalizeProfile = async (loginProvider: string) => {
    setIsGeneratingProfile(true);
    setCompanionMessage("Analyzing your answers and creating your developer profile... This is exciting!");
    
    try {
      // Generate the user's profile based on quiz and meme answers
      const profile = await generateDeveloperProfile(
        quizAnswers,
        memeReactions,
        currentUser || {},
        undefined // TODO: Add GitHub data integration
      );
      
             // Step 1: Analyze performance metrics (takes 1 second)
       setCompanionMessage("Analyzing your performance metrics... This will take a moment.");
       await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
       
       const performanceMetrics = analyzePerformanceMetrics(quizAnswers, memeReactions);
       console.log('📊 Performance Metrics:', performanceMetrics);
       
       // Step 2: Find most similar users from database
       setCompanionMessage("Finding developers with similar preferences...");
       
       let finalMatches;
       if (currentUser?.id) {
         try {
           // Save user's quiz answers and meme reactions to database
           try {
             console.log('🔄 Attempting to save profile data...');
             const saveResult = await saveUserProfileData(currentUser.id, quizAnswers, memeReactions);
             console.log('✅ Profile data save result:', saveResult);
           } catch (saveError) {
             console.error('❌ Failed to save profile data:', saveError);
             // Continue anyway - don't let this block profile generation
           }
           
           // Find the 3 most similar users from database with timeout
           let similarUsers: UserSimilarity[] = [];
           try {
             const timeoutPromise = new Promise((_, reject) => 
               setTimeout(() => reject(new Error('Database query timeout')), 10000)
             );
             
             similarUsers = await Promise.race([
               findMostSimilarUsers(currentUser.id, quizAnswers, memeReactions, performanceMetrics),
               timeoutPromise
             ]);
           } catch (dbTimeoutError) {
             console.error('❌ Database query timeout or error:', dbTimeoutError);
             similarUsers = []; // Empty array to continue
           }
           
                       if (similarUsers.length > 0) {
              console.log('🎯 Found similar users:', similarUsers);
              
              // Convert similar users to the expected format
              const profileData = similarUsers.map(match => ({
                ...match.user,
                id: match.user._id || `user_${match.user._id}`,
                matchScore: match.similarityScore,
                matchReasons: match.matchingTraits,
                compatibility: match.compatibility
              }));
              
              setAnalyzedMatches(profileData);
              setCompanionMessage(`Found ${similarUsers.length} developers with similar preferences!`);
            } else {
              console.log('No similar users found, trying real-time matching');
              
              // Try real-time matching as fallback
              try {
                const realtimeResponse = await fetch('/api/users/realtime-match', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ currentUserId: currentUser.id })
                });
                
                if (realtimeResponse.ok) {
                  const realtimeData = await realtimeResponse.json();
                  if (realtimeData.matches && realtimeData.matches.length > 0) {
                    const profileData = realtimeData.matches.map((match: any) => ({
                      ...match.user,
                      id: match.user._id || `user_${match.user._id}`,
                      matchScore: match.similarityScore,
                      matchReasons: match.matchingTraits
                    }));
                    
                    setAnalyzedMatches(profileData);
                    setCompanionMessage(`Found ${realtimeData.matches.length} developers with similar preferences!`);
                  } else {
                    throw new Error('No real-time matches found');
                  }
                } else {
                  throw new Error('Real-time matching failed');
                }
              } catch (realtimeError) {
                console.log('Real-time matching also failed:', realtimeError);
                throw new Error('No similar users found');
              }
            }
                   } catch (dbError) {
            console.log('Database matching failed, no similar users found:', dbError);
            setCompanionMessage("No developers with similar preferences found yet. You'll see matches when more developers join!");
            setAnalyzedMatches([]); // Show no matches instead of mock users
          }
               } else {
          // No current user, show no matches
          setCompanionMessage("Please login to see your matches!");
          setAnalyzedMatches([]);
        }
      
      // Create a user object that matches what AuthContext expects
      const userForAuth = {
        id: profile.id,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        codename: profile.codename,
        // Add any other fields that AuthContext expects
      };
      
      // Login the user with their generated profile
      login(userForAuth, () => {
        // Clean up onboarding data
        localStorage.removeItem(QUIZ_ANSWERS_KEY);
        localStorage.removeItem(MEME_REACTIONS_KEY);
        
        // Navigate to dashboard where they'll see their matches
        navigate('/dashboard');
      });

    } catch (error) {
      console.error("ProfileBuilder: Failed to generate developer profile:", error);
      setCompanionMessage("Profile generation failed, but you can still proceed to see your matches!");
      
      // Fallback: create a basic profile and proceed
      try {
        const fallbackProfile = {
          id: currentUser?.id || 'user_' + Date.now(),
          name: currentUser?.name || 'Developer',
          avatarUrl: currentUser?.avatarUrl || 'https://via.placeholder.com/150',
          codename: 'CodeCraft'
        };
        
                 // Try to find real matches from MongoDB first
         if (currentUser?.id) {
           try {
             // Save user's quiz answers and meme reactions to database
             await saveUserProfileData(currentUser.id, quizAnswers, memeReactions);
             
             // Find matches from database
             const fallbackMatches = await findMatchesFromDatabase(
               quizAnswers,
               memeReactions,
               currentUser.id,
               [] // No exclusions for fallback matching
             );
             
             if (fallbackMatches.length > 0) {
               // Convert MongoDB matches to the expected format
               const profileData = fallbackMatches.map(match => ({
                 ...match.profile,
                 id: match.profile._id || `user_${match.profile._id}`,
                 matchScore: match.score,
                 matchReasons: match.reasons
               }));
               
               setAnalyzedMatches(profileData);
             } else {
               setAnalyzedMatches([]); // No matches found
             }
           } catch (dbError) {
             console.log('Database matching failed in fallback:', dbError);
             setAnalyzedMatches([]); // No matches found
           }
         } else {
           // No current user, show no matches
           setAnalyzedMatches([]);
         }
        
        // Login with fallback profile
        login(fallbackProfile, () => {
          localStorage.removeItem(QUIZ_ANSWERS_KEY);
          localStorage.removeItem(MEME_REACTIONS_KEY);
          navigate('/dashboard');
        });
        
      } catch (fallbackError) {
        console.error("ProfileBuilder: Fallback also failed:", fallbackError);
        setCompanionMessage("Something went wrong. Please try refreshing the page.");
        setIsGeneratingProfile(false);
      }
    }
  };

  const sendConnectionRequest = (matchId: string) => {
    setConnectionRequests(prev => {
      const newSet = new Set(prev);
      newSet.add(matchId);
      return newSet;
    });
    
    // Update companion message
    setCompanionMessage("Connection request sent! They'll be notified of your interest.");
    
    // Store in localStorage
    const updatedRequests = Array.from(new Set([...Array.from(connectionRequests), matchId]));
    localStorage.setItem('syncup_connection_requests', JSON.stringify(updatedRequests));
  };

  const acceptConnectionRequest = (matchId: string) => {
    // Remove from incoming requests
    setIncomingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(matchId);
      return newSet;
    });
    
    // Add to mutual connections
    setMutualConnections(prev => {
      const newSet = new Set(prev);
      newSet.add(matchId);
      return newSet;
    });
    
    // Update companion message
    setCompanionMessage("Connection accepted! You can now chat with this developer.");
    
    // Update localStorage
    const updatedIncoming = Array.from(new Set([...Array.from(incomingRequests)].filter(id => id !== matchId)));
    const updatedMutual = Array.from(new Set([...Array.from(mutualConnections), matchId]));
    localStorage.setItem('syncup_incoming_requests', JSON.stringify(updatedIncoming));
    localStorage.setItem('syncup_mutual_connections', JSON.stringify(updatedMutual));
  };

  const rejectConnectionRequest = (matchId: string) => {
    // Remove from incoming requests
    setIncomingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(matchId);
      return newSet;
    });
    
    // Update companion message
    setCompanionMessage("Connection request rejected.");
    
    // Update localStorage
    const updatedIncoming = Array.from(new Set([...Array.from(incomingRequests)].filter(id => id !== matchId)));
    localStorage.setItem('syncup_incoming_requests', JSON.stringify(updatedIncoming));
  };

  const toggleLike = (matchId: string) => {
    setLikedMatches(prev => {
        const newSet = new Set(prev);
        if (newSet.has(matchId)) {
            newSet.delete(matchId);
        } else {
            newSet.add(matchId);
        }
        
        // Update localStorage immediately with the new state
        const newArray = Array.from(newSet);
        localStorage.setItem(LIKED_MATCHES_KEY, JSON.stringify(newArray));
        
        return newSet;
    });
  };

  const getCurrentMatches = () => {
    return currentMatches;
  };

  const refreshMatches = async () => {
    if (!currentUser?.id) {
      console.error('Cannot refresh matches: no current user');
      return;
    }

    try {
      setCompanionMessage("Refreshing matches...");
      
      const response = await fetch('/api/users/refresh-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser.id })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.matches && data.matches.length > 0) {
          const profileData = data.matches.map((match: any) => ({
            ...match.user,
            id: match.user._id || `user_${match.user._id}`,
            matchScore: match.similarityScore,
            matchReasons: match.matchingTraits
          }));
          
          setAnalyzedMatches(profileData);
          setCompanionMessage(data.message || `Found ${data.matches.length} new matches!`);
        } else {
          setCompanionMessage("No new matches found yet. More developers are joining every day!");
        }
      } else {
        throw new Error('Failed to refresh matches');
      }
    } catch (error) {
      console.error('Error refreshing matches:', error);
      setCompanionMessage("Failed to refresh matches. Please try again later.");
    }
  };

  const value = {
    quizAnswers,
    memeReactions,
    isGeneratingProfile,
    companionMessage,
    likedMatches,
    analyzedMatches,
    connectionRequests,
    incomingRequests,
    mutualConnections,
    setQuizAnswer,
    addMemeReaction,
    finalizeProfile,
    setCompanionMessage,
    toggleLike,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    getCurrentMatches,
    refreshMatches
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




import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizAnswers, MemeReaction } from '../types';
import { generateDeveloperProfile } from '../services/profileAnalysisService';
import { analyzeProfileAndFindMatches } from '../services/profileMatchingService';
import { findMatchesFromDatabase, saveUserProfileData } from '../services/mongoMatchingService';
import { apiCall } from '../utils/api';
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
  passedMatches: Set<string>;
  pendingConnections: Set<string>;
  setQuizAnswer: (questionId: number, answer: any) => void;
  addMemeReaction: (reaction: MemeReaction) => void;
  finalizeProfile: (loginProvider: string) => Promise<void>;
  setCompanionMessage: (message: string) => void;
  toggleLike: (matchId: string) => void;
  passMatch: (matchId: string) => void;
  sendConnectionRequest: (matchId: string) => void;
  acceptConnectionRequest: (matchId: string) => void;
  rejectConnectionRequest: (matchId: string) => void;
  getCurrentMatches: () => any[];
  refreshMatches: () => Promise<void>;
  manualRefreshConnections: () => void;
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
    console.log('🔄 Initial connection requests from localStorage:', stored);
    return new Set(stored);
  });
  const [incomingRequests, setIncomingRequests] = useState<Set<string>>(() => {
    const stored = getFromStorage('syncup_incoming_requests', []);
    console.log('🔄 Initial incoming requests from localStorage:', stored);
    return new Set(stored);
  });
  const [mutualConnections, setMutualConnections] = useState<Set<string>>(() => {
    const stored = getFromStorage('syncup_mutual_connections', []);
    console.log('🔄 Initial mutual connections from localStorage:', stored);
    return new Set(stored);
  });
  const [passedMatches, setPassedMatches] = useState<Set<string>>(() => {
    const stored = getFromStorage('syncup_passed_matches', []);
    return new Set(stored);
  });
  const [pendingConnections, setPendingConnections] = useState<Set<string>>(() => {
    const stored = getFromStorage('syncup_pending_connections', []);
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
  useEffect(() => { localStorage.setItem('syncup_passed_matches', JSON.stringify(Array.from(passedMatches))); }, [passedMatches]);
  useEffect(() => { localStorage.setItem('syncup_pending_connections', JSON.stringify(Array.from(pendingConnections))); }, [pendingConnections]);

  // Listen for localStorage changes from other tabs to enable real-time sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log('🔄 Storage change detected:', e.key, e.newValue);
      if (e.key === LIKED_MATCHES_KEY && e.newValue) {
        setLikedMatches(new Set(JSON.parse(e.newValue)));
      } else if (e.key === 'syncup_connection_requests' && e.newValue) {
        const newRequests = new Set(JSON.parse(e.newValue));
        console.log('🔄 Updating connection requests from storage:', Array.from(newRequests));
        setConnectionRequests(newRequests);
      } else if (e.key === 'syncup_incoming_requests' && e.newValue) {
        setIncomingRequests(new Set(JSON.parse(e.newValue)));
      } else if (e.key === 'syncup_mutual_connections' && e.newValue) {
        setMutualConnections(new Set(JSON.parse(e.newValue)));
      } else if (e.key === 'syncup_passed_matches' && e.newValue) {
        setPassedMatches(new Set(JSON.parse(e.newValue)));
      } else if (e.key === 'syncup_pending_connections' && e.newValue) {
        setPendingConnections(new Set(JSON.parse(e.newValue)));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper: refresh connection state from backend
  const refreshConnectionState = async () => {
    try {
      if (!currentUser?.id) return;
      console.log('🔄 Context: refreshing connection state for user:', currentUser.id);
      const res = await apiCall(`/api/users/connections/state/${currentUser.id}?includeProfiles=true`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Context: Failed to load connection state:', res.status, errorText);
        throw new Error('Failed to load connection state');
      }
      const data = await res.json();
      console.log('🔄 Context: received connection state:', {
        sent: data.sent,
        incoming: data.incoming,
        mutual: data.mutual,
        sentProfiles: data.sentProfiles?.length || 0,
        incomingProfiles: data.incomingProfiles?.length || 0,
        mutualProfiles: data.mutualProfiles?.length || 0
      });
      
      // Only update if backend has different data to prevent unnecessary re-renders
      setConnectionRequests(prev => {
        const backendSent = new Set((data.sent || []).map((id: string) => String(id)));
        const currentSent = new Set(prev);
        
        // Check if there are any differences
        const hasNewSent = [...backendSent].some(id => !currentSent.has(id));
        const hasRemovedSent = [...currentSent].some(id => !backendSent.has(id));
        
        if (hasNewSent || hasRemovedSent) {
          console.log('🔄 Updating connection requests:', Array.from(backendSent));
          return backendSent;
        }
        
        console.log('🔄 Connection requests unchanged, keeping current state');
        return prev; // Keep current state to prevent re-render
      });
      
      setIncomingRequests(prev => {
        const backendIncoming = new Set((data.incoming || []).map((id: string) => String(id)));
        const currentIncoming = new Set(prev);
        
        const hasNewIncoming = [...backendIncoming].some(id => !currentIncoming.has(id));
        const hasRemovedIncoming = [...currentIncoming].some(id => !backendIncoming.has(id));
        
        if (hasNewIncoming || hasRemovedIncoming) {
          console.log('🔄 Updating incoming requests:', Array.from(backendIncoming));
          return backendIncoming;
        }
        
        console.log('🔄 Incoming requests unchanged, keeping current state');
        return prev;
      });
      
      setMutualConnections(prev => {
        const backendMutual = new Set((data.mutual || []).map((id: string) => String(id)));
        const currentMutual = new Set(prev);
        
        const hasNewMutual = [...backendMutual].some(id => !currentMutual.has(id));
        const hasRemovedMutual = [...currentMutual].some(id => !backendMutual.has(id));
        
        if (hasNewMutual || hasRemovedMutual) {
          console.log('🔄 Updating mutual connections:', Array.from(backendMutual));
          return backendMutual;
        }
        
        console.log('🔄 Mutual connections unchanged, keeping current state');
        return prev;
      });
      // store hydrated profiles for dashboard
      if (Array.isArray(data.incomingProfiles)) {
        console.log('🔄 Context: storing incoming profiles in cache:', data.incomingProfiles);
        localStorage.setItem('syncup_incoming_profiles_cache', JSON.stringify(data.incomingProfiles));
        // Force dashboard to re-read cache
        window.dispatchEvent(new CustomEvent('syncup_connections_updated'));
      }
      if (Array.isArray(data.sentProfiles)) {
        console.log('🔄 Context: storing sent profiles in cache:', data.sentProfiles);
        localStorage.setItem('syncup_sent_profiles_cache', JSON.stringify(data.sentProfiles));
      }
      if (Array.isArray(data.mutualProfiles)) {
        console.log('🔄 Context: storing mutual profiles in cache:', data.mutualProfiles);
        localStorage.setItem('syncup_mutual_profiles_cache', JSON.stringify(data.mutualProfiles));
      }
    } catch (e) {
      console.warn('Failed to refresh connection state:', e);
    }
  };

  // Manual refresh function for user to call
  const manualRefreshConnections = () => {
    console.log('🔄 Manual refresh triggered');
    refreshConnectionState();
  };

  // Poll connection state occasionally to keep both sides updated
  useEffect(() => {
    if (!currentUser?.id) return;
    refreshConnectionState();
    const id = setInterval(() => refreshConnectionState(), 30000); // Reduced frequency to 30s
    return () => clearInterval(id);
  }, [currentUser?.id]);

  // Listen for manual refresh requests from dashboard
  useEffect(() => {
    const handleManualRefresh = () => {
      console.log('🔄 Context: received manual refresh request');
      refreshConnectionState();
    };

    window.addEventListener('syncup_manual_refresh', handleManualRefresh);
    return () => window.removeEventListener('syncup_manual_refresh', handleManualRefresh);
  }, []);

  // Force re-render when connection states change by dispatching custom events
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('syncup_connections_updated'));
  }, [connectionRequests, incomingRequests, mutualConnections]);

  const setQuizAnswer = async (questionId: number, answer: any) => {
    const updatedAnswers = { ...quizAnswers, [questionId]: answer };
    setQuizAnswers(updatedAnswers);
    
    // Persist incrementally with updated state
    try {
      if (currentUser?.id) {
        await saveUserProfileData(currentUser.id, updatedAnswers, memeReactions, false);
        console.log(`✅ Saved answer ${questionId}: ${answer}`);
      }
    } catch (e) {
      console.warn('Incremental save failed (quiz):', e);
    }
    
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

  const addMemeReaction = async (reaction: MemeReaction) => {
    const next = [...memeReactions.filter(r => r.memeId !== reaction.memeId), reaction];
    setMemeReactions(next);
    
    // Persist incrementally with updated state
    try {
      if (currentUser?.id) {
        await saveUserProfileData(currentUser.id, quizAnswers, next, false);
        console.log(`✅ Saved meme reaction: ${reaction.memeId} - ${reaction.reaction}`);
      }
    } catch (e) {
      console.warn('Incremental save failed (meme):', e);
    }
    
    // Update companion message based on meme reaction
    const reactionMessages = {
      '😐': "Not your style, huh? That's totally fine!",
      '😂': "Haha! You've got a great sense of humor!",
      '💯': "So relatable! You really get it!",
      '😭': "Too real! You've been there, done that!"
    } as const;
    
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
      
      // Step 2: Save final profile data and mark complete
      if (currentUser?.id) {
        try {
          await saveUserProfileData(currentUser.id, quizAnswers, memeReactions, true);
        } catch (e) {
          console.error('Failed to mark profile complete:', e);
        }
      }
      
      // Step 3: Find most similar users from database
      setCompanionMessage("Finding developers with similar preferences...");
      
      let finalMatches;
      if (currentUser?.id) {
        try {
          let similarUsers: UserSimilarity[] = [];
          try {
            // Remove timeout - let the database query complete naturally
            similarUsers = await findMostSimilarUsers(currentUser.id, quizAnswers, memeReactions, performanceMetrics);
          } catch (dbError) {
            console.error('❌ Database query error:', dbError);
            similarUsers = []; // Empty array to continue
          }
          
          if (similarUsers.length > 0) {
            console.log('🎯 Found similar users:', similarUsers);
            
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
            // Try fallback matching - get any users from database
            console.log('🔄 No similar users found, trying fallback matching...');
            try {
              const fallbackResponse = await apiCall('/api/users/fallback-matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentUserId: currentUser.id })
              });
              
              if (fallbackResponse.ok) {
                const fallbackMatches = await fallbackResponse.json();
                if (fallbackMatches.length > 0) {
                  const profileData = fallbackMatches.map((match: any) => ({
                    ...match,
                    id: match._id || match.id,
                    matchScore: 50, // Default score for fallback matches
                    matchReasons: ['New developer on the platform'],
                    compatibility: 'medium'
                  }));
                  
                  setAnalyzedMatches(profileData);
                  setCompanionMessage(`Found ${fallbackMatches.length} developers to connect with!`);
                } else {
                  setAnalyzedMatches([]);
                  setCompanionMessage("No other developers found yet. You'll see matches when more developers join!");
                }
              } else {
                setAnalyzedMatches([]);
                setCompanionMessage("No developers with similar preferences found yet. You'll see matches when more developers join!");
              }
            } catch (fallbackError) {
              console.error('Fallback matching failed:', fallbackError);
              setAnalyzedMatches([]);
              setCompanionMessage("No developers with similar preferences found yet. You'll see matches when more developers join!");
            }
          }
        } catch (dbError) {
          console.log('Database matching failed, no similar users found:', dbError);
          setCompanionMessage("No developers with similar preferences found yet. You'll see matches when more developers join!");
          setAnalyzedMatches([]);
        }
      }
      
      // Create a user object for AuthContext
      const userForAuth = {
        id: profile.id,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        codename: profile.codename,
      } as any;
      
      login(userForAuth, () => {
        localStorage.removeItem(QUIZ_ANSWERS_KEY);
        localStorage.removeItem(MEME_REACTIONS_KEY);
        navigate('/dashboard');
      });

    } catch (error) {
      console.error("ProfileBuilder: Failed to generate developer profile:", error);
      setCompanionMessage("Profile generation failed, but you can still proceed to see your matches!");
      
      try {
        if (currentUser?.id) {
          await saveUserProfileData(currentUser.id, quizAnswers, memeReactions, true);
        }
      } catch {}
      
      navigate('/dashboard');
      setIsGeneratingProfile(false);
    }
  };

  const sendConnectionRequest = async (matchId: string) => {
    console.log('🚀 Sending connection request for:', matchId);
    
    // optimistic update with immediate persistence
    setConnectionRequests(prev => {
      const newSet = new Set(prev);
      newSet.add(matchId);
      // Immediately persist to localStorage
      localStorage.setItem('syncup_connection_requests', JSON.stringify(Array.from(newSet)));
      console.log('💾 Persisted connection requests:', Array.from(newSet));
      return newSet;
    });

    setPendingConnections(prev => {
      const newSet = new Set(prev);
      newSet.add(matchId);
      // Immediately persist to localStorage
      localStorage.setItem('syncup_pending_connections', JSON.stringify(Array.from(newSet)));
      console.log('💾 Persisted pending connections:', Array.from(newSet));
      return newSet;
    });
    
    setCompanionMessage("Connection request sent! They'll be notified of your interest.");
    
    // Force UI update
    window.dispatchEvent(new CustomEvent('syncup_connections_updated'));

    // Immediately hydrate sent profiles cache for UI (avoid waiting for poll)
    try {
      // Try find profile from analyzed matches or fetch public profile
      const existing = analyzedMatches.find((m: any) => String(m.id) === String(matchId));
      let profile = existing;
      if (!profile) {
        const res = await apiCall(`/api/users/public/${matchId}`);
        if (res.ok) profile = await res.json();
      }
      if (profile) {
        const cacheKey = 'syncup_sent_profiles_cache';
        const current = getFromStorage<any[]>(cacheKey, []);
        const mergedMap = new Map<string, any>();
        current.forEach(p => mergedMap.set(String(p.id || p._id), p));
        mergedMap.set(String(profile.id || profile._id), { ...profile, id: profile.id || profile._id });
        localStorage.setItem(cacheKey, JSON.stringify(Array.from(mergedMap.values())));
        // Notify dashboards to refresh from cache
        window.dispatchEvent(new CustomEvent('syncup_connections_updated'));
      }
    } catch (e) {
      console.warn('Failed to hydrate sent profiles cache:', e);
    }

    // call backend
    try {
      if (!currentUser?.id) return;
      console.log('🔄 Sending connection request:', { fromUserId: currentUser.id, toUserId: matchId });
      const res = await apiCall('/api/users/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: currentUser.id, toUserId: matchId })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Connection request failed:', res.status, errorText);
        throw new Error('request failed');
      }
      console.log('✅ Connection request sent successfully');
      await refreshConnectionState();
    } catch (e) {
      console.error('Failed to send connection request:', e);
      // Revert optimistic update on failure
      setConnectionRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchId);
        return newSet;
      });
      setPendingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchId);
        return newSet;
      });
    }

    // Don't remove from current matches - keep them visible for status updates
    // await removeMatchAndRefill(matchId);
  };

  const acceptConnectionRequest = async (matchId: string) => {
    // optimistic remove from incoming, add to mutual
    setIncomingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(matchId);
      return newSet;
    });
    
    setMutualConnections(prev => {
      const newSet = new Set(prev);
      newSet.add(matchId);
      return newSet;
    });
    
    setCompanionMessage("Connection accepted! You can now chat with this developer.");
    
    // Update localStorage immediately
    const updatedIncoming = Array.from(new Set([...Array.from(incomingRequests)].filter(id => id !== matchId)));
    const updatedMutual = Array.from(new Set([...Array.from(mutualConnections), matchId]));
    localStorage.setItem('syncup_incoming_requests', JSON.stringify(updatedIncoming));
    localStorage.setItem('syncup_mutual_connections', JSON.stringify(updatedMutual));
    
    // Force UI update
    window.dispatchEvent(new CustomEvent('syncup_connections_updated'));

    try {
      if (!currentUser?.id) return;
      const res = await apiCall('/api/users/connections/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, fromUserId: matchId })
      });
      if (!res.ok) throw new Error('accept failed');
      await refreshConnectionState();
      // update mutual cache immediately
      const pub = await apiCall(`/api/users/public/${matchId}`).then(r => r.ok ? r.json() : null).catch(() => null);
      if (pub) {
        const cacheKey = 'syncup_mutual_profiles_cache';
        const current = getFromStorage<any[]>(cacheKey, []);
        const byId = new Map(current.map(p => [String(p.id || p._id), p]));
        byId.set(String(pub.id || pub._id), { ...pub, id: pub.id || pub._id });
        localStorage.setItem(cacheKey, JSON.stringify(Array.from(byId.values())));
        window.dispatchEvent(new CustomEvent('syncup_connections_updated'));
      }
    } catch (e) {
      console.error('Failed to accept connection request:', e);
    }

    // Don't remove accepted user from matches - keep them visible for chat access
    // await removeMatchAndRefill(matchId);
  };

  const rejectConnectionRequest = async (matchId: string) => {
    // optimistic remove from incoming
    setIncomingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(matchId);
      return newSet;
    });
    
    setCompanionMessage("Connection request rejected.");
    
    // Update localStorage immediately
    const updatedIncoming = Array.from(new Set([...Array.from(incomingRequests)].filter(id => id !== matchId)));
    localStorage.setItem('syncup_incoming_requests', JSON.stringify(updatedIncoming));
    
    // Force UI update
    window.dispatchEvent(new CustomEvent('syncup_connections_updated'));

    try {
      if (!currentUser?.id) return;
      const res = await apiCall('/api/users/connections/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, fromUserId: matchId })
      });
      if (!res.ok) throw new Error('reject failed');
      await refreshConnectionState();
      // prune incoming cache immediately
      const key = 'syncup_incoming_profiles_cache';
      const list = getFromStorage<any[]>(key, []);
      const filtered = list.filter(p => String(p.id || p._id) !== String(matchId));
      localStorage.setItem(key, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('syncup_connections_updated'));
    } catch (e) {
      console.error('Failed to reject connection request:', e);
    }

    // Don't remove rejected user from matches - keep them visible
    // await removeMatchAndRefill(matchId);
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

  const passMatch = async (matchId: string) => {
    setPassedMatches(prev => {
      const newSet = new Set(prev);
      newSet.add(matchId);
      const newArray = Array.from(newSet);
      localStorage.setItem('syncup_passed_matches', JSON.stringify(newArray));
      return newSet;
    });
    setCompanionMessage("You've passed on this match. Keep going to find your perfect developer!");

    try {
      if (!currentUser?.id) return;
      await apiCall('/api/users/pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, passedUserId: matchId })
      });
      await refreshConnectionState();
    } catch (e) {
      console.warn('Failed to persist pass:', e);
    }

    // Remove from current matches and refill
    await removeMatchAndRefill(matchId);
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
      
      const response = await apiCall('/api/users/refresh-matches', {
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

  // Helper: fetch more matches to keep buffer up to MAX_BUFFER (stop at 10)
  const refillMatchesIfNeeded = async () => {
    try {
      if (!currentUser?.id) return;
      const MAX_BUFFER = 10;
      if (analyzedMatches.length >= MAX_BUFFER) return;

      // Build exclude list: current user, shown matches, passed, requests, liked
      const exclude = new Set<string>();
      exclude.add(currentUser.id);
      analyzedMatches.forEach(m => exclude.add(String(m.id)));
      Array.from(passedMatches).forEach(id => exclude.add(String(id)));
      Array.from(connectionRequests).forEach(id => exclude.add(String(id)));
      Array.from(likedMatches).forEach(id => exclude.add(String(id)));

      const response = await apiCall('/api/users/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser.id, excludeIds: Array.from(exclude) })
      });

      if (response.ok) {
        const potential = await response.json();
        const profileData = potential.map((match: any) => ({
          ...match,
          id: match._id,
          matchScore: 0,
          matchReasons: []
        }));

        // Merge new unique profiles, keep at most MAX_BUFFER
        setAnalyzedMatches(prev => {
          const byId = new Map<string, any>();
          prev.forEach((p: any) => byId.set(String(p.id), p));
          profileData.forEach((p: any) => {
            if (!byId.has(String(p.id))) byId.set(String(p.id), p);
          });
          const merged = Array.from(byId.values());
          return merged.slice(0, Math.min(MAX_BUFFER, merged.length));
        });
      }
    } catch (e) {
      console.warn('Failed to refill matches:', e);
    }
  };

  // Remove a match from the current list and refill
  const removeMatchAndRefill = async (matchId: string) => {
    setAnalyzedMatches(prev => prev.filter((m: any) => String(m.id) !== String(matchId)));
    await refillMatchesIfNeeded();
  };

  // Resolve minimal profiles for a set of userIds (used for incoming/sent requests display)
  const resolveProfilesByIds = async (userIds: string[]): Promise<any[]> => {
    try {
      const unique = Array.from(new Set(userIds.filter(Boolean)));
      const results = await Promise.all(unique.map(async (id) => {
        try {
          const res = await apiCall(`/api/users/public/${id}`);
          if (!res.ok) throw new Error('load failed');
          const data = await res.json();
          return { ...data, id: data.id || data._id };
        } catch {
          return null;
        }
      }));
      return results.filter(Boolean) as any[];
    } catch {
      return [];
    }
  };

  // Filter analyzedMatches to exclude any profiles already acted upon
  // Note: We keep liked profiles visible so users can send connection requests
  const filteredAnalyzedMatches = useMemo(() => {
    const exclude = new Set<string>();
    Array.from(passedMatches).forEach(id => exclude.add(String(id)));
    // Don't exclude connectionRequests - keep them visible for status updates
    // Don't exclude incomingRequests - keep them visible for status updates  
    // Don't exclude mutualConnections - keep them visible for chat access
    // Don't exclude pendingConnections - keep them visible for status updates
    // Don't exclude likedMatches - keep them visible so users can send connection requests
    return analyzedMatches.filter((m: any) => !exclude.has(String(m.id)));
  }, [analyzedMatches, passedMatches]);

  const value = {
    quizAnswers,
    memeReactions,
    isGeneratingProfile,
    companionMessage,
    likedMatches,
    analyzedMatches: filteredAnalyzedMatches, // Use filtered version to exclude acted-upon profiles
    connectionRequests,
    incomingRequests,
    mutualConnections,
    passedMatches,
    pendingConnections,
    setQuizAnswer,
    addMemeReaction,
    finalizeProfile,
    setCompanionMessage,
    toggleLike,
    passMatch,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    getCurrentMatches,
    refreshMatches,
    manualRefreshConnections // Add manual refresh function
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


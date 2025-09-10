
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useProfileBuilder } from '../context/ProfileBuilderContext';
import { DeveloperProfile } from '../types';
import ProfileCard from '../components/ProfileCard';
import { 
  User, 
  Heart, 
  MessageSquare, 
  LogOut, 
  Users, 
  UserPlus,
  Home,
  Bell,
  MessageCircle
} from 'lucide-react';

// helper to load minimal public profile by id
const loadPublicProfile = async (userId: string) => {
  try {
    const res = await fetch(`/api/users/public/${userId}`);
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    return { ...data, id: data.id || data._id } as any;
  } catch {
    return null;
  }
};

type DashboardTab = 'matches' | 'profile' | 'connections';

const DashboardScreen: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { 
    analyzedMatches, 
    likedMatches, 
    connectionRequests,
    incomingRequests,
    mutualConnections,
    toggleLike,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    refreshMatches
  } = useProfileBuilder();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>('matches');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [currentProfile, setCurrentProfile] = useState<DeveloperProfile | null>(null);

  // hydrated request profiles
  const [incomingProfiles, setIncomingProfiles] = useState<any[]>([]);
  const [sentProfiles, setSentProfiles] = useState<any[]>([]);
  const [mutualProfiles, setMutualProfiles] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const loadIncomingProfiles = async () => {
      // Prefer cache populated by context refresh
      const cachedIncoming = localStorage.getItem('syncup_incoming_profiles_cache');
      console.log('🔍 Dashboard: cachedIncoming =', cachedIncoming);
      if (cachedIncoming) {
        try { 
          const parsed = JSON.parse(cachedIncoming);
          console.log('🔍 Dashboard: parsed incoming profiles =', parsed);
          setIncomingProfiles(parsed); 
        } catch (e) {
          console.error('🔍 Dashboard: failed to parse cached incoming profiles:', e);
        }
      } else {
        console.log('🔍 Dashboard: no cached incoming profiles, fetching from IDs:', Array.from(incomingRequests));
        const ids = Array.from(incomingRequests) as string[];
        const profiles = await Promise.all(ids.map(id => {
          const existing = analyzedMatches.find(m => String(m.id) === String(id));
          return existing ? existing : loadPublicProfile(id);
        }));
        console.log('🔍 Dashboard: fetched profiles from IDs:', profiles);
        setIncomingProfiles(profiles.filter(Boolean) as any[]);
      }
    };

    loadIncomingProfiles();
  }, [incomingRequests, analyzedMatches]);

  // Detect new incoming requests and show notifications
  useEffect(() => {
    const previousIncoming = JSON.parse(localStorage.getItem('syncup_previous_incoming') || '[]');
    const currentIncoming = Array.from(incomingRequests);
    
    // Find new incoming requests
    const newRequests = currentIncoming.filter(id => !previousIncoming.includes(id));
    
    if (newRequests.length > 0) {
      // Show notification for new requests
      newRequests.forEach(requestId => {
        const profile = analyzedMatches.find(m => String(m.id) === String(requestId));
        if (profile) {
          setNotifications(prev => [...prev, {
            id: `req_${requestId}_${Date.now()}`,
            type: 'connection_request',
            message: `${profile.name} sent you a connection request!`,
            profileId: requestId,
            profileName: profile.name,
            timestamp: Date.now()
          }]);
        }
      });
      
      // Update previous incoming for next comparison
      localStorage.setItem('syncup_previous_incoming', JSON.stringify(currentIncoming));
    }
  }, [incomingRequests, analyzedMatches]);

  // Detect new mutual connections and show notifications
  useEffect(() => {
    const previousMutual = JSON.parse(localStorage.getItem('syncup_previous_mutual') || '[]');
    const currentMutual = Array.from(mutualConnections);
    
    // Find new mutual connections
    const newMutual = currentMutual.filter(id => !previousMutual.includes(id));
    
    if (newMutual.length > 0) {
      // Show notification for new mutual connections
      newMutual.forEach(connectionId => {
        const profile = analyzedMatches.find(m => String(m.id) === String(connectionId));
        if (profile) {
          setNotifications(prev => [...prev, {
            id: `mutual_${connectionId}_${Date.now()}`,
            type: 'mutual_connection',
            message: `You and ${profile.name} are now connected! You can start chatting.`,
            profileId: connectionId,
            profileName: profile.name,
            timestamp: Date.now()
          }]);
        }
      });
      
      // Update previous mutual for next comparison
      localStorage.setItem('syncup_previous_mutual', JSON.stringify(currentMutual));
    }
  }, [mutualConnections, analyzedMatches]);

  // Listen for cache updates from context
  useEffect(() => {
    const handleConnectionsUpdated = () => {
      console.log('🔍 Dashboard: received connections updated event');
      const updatedCache = localStorage.getItem('syncup_incoming_profiles_cache');
      if (updatedCache) {
        try {
          const parsed = JSON.parse(updatedCache);
          console.log('🔍 Dashboard: updating from event:', parsed);
          setIncomingProfiles(parsed);
        } catch (e) {
          console.error('🔍 Dashboard: failed to parse updated cache:', e);
        }
      }
    };

    window.addEventListener('syncup_connections_updated', handleConnectionsUpdated);
    return () => window.removeEventListener('syncup_connections_updated', handleConnectionsUpdated);
  }, []);

  useEffect(() => {
    const loadSentProfiles = async () => {
      const cachedSent = localStorage.getItem('syncup_sent_profiles_cache');
      if (cachedSent) {
        try { 
          setSentProfiles(JSON.parse(cachedSent)); 
        } catch (e) {
          console.error('🔍 Dashboard: failed to parse cached sent profiles:', e);
        }
      } else {
        const ids = Array.from(connectionRequests) as string[];
        const profiles = await Promise.all(ids.map(id => {
          const existing = analyzedMatches.find(m => String(m.id) === String(id));
          return existing ? existing : loadPublicProfile(id);
        }));
        setSentProfiles(profiles.filter(Boolean) as any[]);
      }
    };

    loadSentProfiles();
  }, [connectionRequests, analyzedMatches]);

  // Load mutual profiles from cache
  useEffect(() => {
    const loadMutualProfiles = async () => {
      const cachedMutual = localStorage.getItem('syncup_mutual_profiles_cache');
      if (cachedMutual) {
        try { 
          const parsed = JSON.parse(cachedMutual);
          console.log('🔍 Dashboard: loaded mutual profiles from cache:', parsed);
          setMutualProfiles(parsed); 
        } catch (e) {
          console.error('🔍 Dashboard: failed to parse cached mutual profiles:', e);
        }
      } else {
        // Fallback: load from mutual connections IDs
        const ids = Array.from(mutualConnections) as string[];
        const profiles = await Promise.all(ids.map(id => {
          const existing = analyzedMatches.find(m => String(m.id) === String(id));
          return existing ? existing : loadPublicProfile(id);
        }));
        setMutualProfiles(profiles.filter(Boolean) as any[]);
      }
    };

    loadMutualProfiles();
  }, [mutualConnections, analyzedMatches]);

  // Listen for cache updates from context
  useEffect(() => {
    const handleConnectionsUpdated = () => {
      console.log('🔍 Dashboard: received connections updated event');
      
      // Refresh all profile types
      const updatedIncoming = localStorage.getItem('syncup_incoming_profiles_cache');
      const updatedSent = localStorage.getItem('syncup_sent_profiles_cache');
      const updatedMutual = localStorage.getItem('syncup_mutual_profiles_cache');
      
      if (updatedIncoming) {
        try {
          const parsed = JSON.parse(updatedIncoming);
          console.log('🔍 Dashboard: updating incoming from event:', parsed);
          setIncomingProfiles(parsed);
        } catch (e) {
          console.error('🔍 Dashboard: failed to parse updated incoming cache:', e);
        }
      }
      
      if (updatedSent) {
        try {
          const parsed = JSON.parse(updatedSent);
          setSentProfiles(parsed);
        } catch (e) {
          console.error('🔍 Dashboard: failed to parse updated sent cache:', e);
        }
      }
      
      if (updatedMutual) {
        try {
          const parsed = JSON.parse(updatedMutual);
          console.log('🔍 Dashboard: updating mutual from event:', parsed);
          setMutualProfiles(parsed);
        } catch (e) {
          console.error('🔍 Dashboard: failed to parse updated mutual cache:', e);
        }
      }
    };

    window.addEventListener('syncup_connections_updated', handleConnectionsUpdated);
    return () => window.removeEventListener('syncup_connections_updated', handleConnectionsUpdated);
  }, []);
  
  // Settings removed – simplified UX

  // Set current profile when matches change
  useEffect(() => {
    if (analyzedMatches.length > 0) {
      const newProfile = analyzedMatches[currentMatchIndex];
      
      // Ensure the profile has an ID - fallback to match index if missing
      if (newProfile && !newProfile.id) {
        console.warn('Profile missing ID, creating fallback ID:', newProfile.name);
        newProfile.id = `match_${currentMatchIndex + 1}`;
      }
      
      setCurrentProfile(newProfile);
    }
  }, [analyzedMatches, currentMatchIndex]);

  // Force re-render of ProfileCard when like state changes for current profile
  const currentProfileLikeState = currentProfile && currentProfile.id ? likedMatches.has(currentProfile.id) : false;
  const currentProfileConnectionState = currentProfile && currentProfile.id ? connectionRequests.has(currentProfile.id) : false;
  const currentProfileMutualState = currentProfile && currentProfile.id ? mutualConnections.has(currentProfile.id) : false;

  // (settings removed)

  const handleLike = () => {
    if (currentProfile && currentProfile.id) {
      toggleLike(currentProfile.id);
    } else {
      console.error('Cannot like profile: missing profile or profile ID');
    }
  };

  const handlePass = () => {
    nextProfile();
  };

  const nextProfile = () => {
    const nextIndex = currentMatchIndex < analyzedMatches.length - 1 ? currentMatchIndex + 1 : 0;
    setCurrentMatchIndex(nextIndex);
  };

  const previousProfile = () => {
    if (currentMatchIndex > 0) {
      setCurrentMatchIndex(currentMatchIndex - 1);
    } else {
      setCurrentMatchIndex(analyzedMatches.length - 1); // Loop to last
    }
  };

  const handleChat = (profile: DeveloperProfile) => {
    navigate(`/chat/${profile.id}`);
  };

  const handleConnectionRequest = (profile: DeveloperProfile) => {
    sendConnectionRequest(profile.id);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // (settings removed)

  const handleEditProfile = () => {
    alert('Profile editing feature coming soon!');
  };

  const testRealTimeChat = () => {
    if (mutualConnections.size === 0) {
      alert('You need a mutual connection first! Send a connection request to a profile and have it accepted.');
      return;
    }
    const firstConnection = Array.from(mutualConnections)[0];
    navigate(`/chat/${firstConnection}`);
  };

  const handleAcceptRequest = (profileId: string) => {
    acceptConnectionRequest(profileId);
  };

  const handleRejectRequest = (profileId: string) => {
    rejectConnectionRequest(profileId);
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    notifications.forEach(notification => {
      const timer = setTimeout(() => {
        dismissNotification(notification.id);
      }, 5000);
      
      return () => clearTimeout(timer);
    });
  }, [notifications]);

  const renderMatchesTab = () => (
    <div className="space-y-6">
      {analyzedMatches.length === 0 ? (
        <div className="text-center text-white max-w-3xl mx-auto p-8">
          <Users className="w-16 h-16 mx-auto mb-6 opacity-50" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">🔍 No matches found yet</h2>
          <div className="text-base md:text-lg opacity-80 mb-8 space-y-2">
            <p>No developers with similar preferences found yet!</p>
            <p className="text-sm opacity-70">
              More developers are joining every day. Your answers are stored and will match with new users automatically.
            </p>
            <p className="text-xs opacity-50">
              💡 Click refresh to check for new matches or try logging in with different accounts to test the system!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <motion.button
              onClick={refreshMatches}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔄 Refresh Matches
            </motion.button>
            <motion.button
              onClick={() => navigate('/onboarding')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-green-600 transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📝 Retake Onboarding
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('connections')}
              className="px-6 py-3 bg-white/15 text-white rounded-xl font-semibold hover:bg-white/25 transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🤝 View Connections & Sent Requests
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('profile')}
              className="px-6 py-3 bg-white/15 text-white rounded-xl font-semibold hover:bg-white/25 transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ❤️ View Likes (Profile)
            </motion.button>
            <motion.button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🚪 Logout
            </motion.button>
          </div>
        </div>
      ) : (
      <>
      {/* Match Progress */}
      <div className="text-center text-white mb-6">
        <h2 className="text-2xl font-bold mb-2">Discover Matches</h2>
        <p className="text-lg opacity-80">
          Match {currentMatchIndex + 1} of {analyzedMatches.length}
        </p>
        <div className="w-full bg-white/20 rounded-full h-2 mt-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentMatchIndex + 1) / analyzedMatches.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Profile Cards */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {currentProfile && (
            <motion.div
              key={`${currentProfile.id}-${currentMatchIndex}`}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <ProfileCard
                key={`profile-${currentProfile.id}-${currentMatchIndex}`}
                profile={currentProfile}
                onLike={handleLike}
                onPass={handlePass}
                onChat={() => handleChat(currentProfile)}
                onConnectionRequest={() => handleConnectionRequest(currentProfile)}
                isLiked={currentProfileLikeState}
                isMutualConnection={currentProfileMutualState}
                hasConnectionRequest={currentProfileConnectionState}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-center space-x-4 mt-8">
          <motion.button
            onClick={previousProfile}
            className="px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Previous
          </motion.button>
          <motion.button
            onClick={nextProfile}
            className="px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Next →
          </motion.button>
        </div>
      </div>
      </>
      )}
    </div>
  );

  const renderProfileTab = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white text-center mb-6">Your Profile</h2>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <img
            src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&size=64&background=random`}
            alt={currentUser.name}
            className="w-20 h-20 rounded-full border-4 border-white/30"
          />
          <div className="text-white">
            <h3 className="text-2xl font-bold">{currentUser.name}</h3>
            <p className="text-lg opacity-80">{currentUser.codename}</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{likedMatches.size}</div>
            <div className="text-white/70">Liked</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-400">{connectionRequests.size}</div>
            <div className="text-white/70">Requests Sent</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{incomingRequests.size}</div>
            <div className="text-white/70">Incoming</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{mutualConnections.size}</div>
            <div className="text-white/70">Connected</div>
          </div>
        </div>
        

        

      </div>
    </div>
  );

  const renderConnectionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Connections</h3>
        <button
          onClick={() => {
            console.log('🔄 Manual refresh clicked');
            // Trigger context refresh
            window.dispatchEvent(new CustomEvent('syncup_manual_refresh'));
          }}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-2"
        >
          🔄 Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sent Requests */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
            <User className="w-5 h-5" />
            Sent Requests
          </h4>
          {sentProfiles.length > 0 ? (
            <div className="space-y-3">
              {sentProfiles.map((profile) => (
                <div key={profile.id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {profile.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{profile.name}</p>
                      <p className="text-gray-300 text-sm">{profile.codename}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No connection requests sent yet. Start liking profiles to send connection requests!</p>
          )}
        </div>

        {/* Incoming Requests */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Incoming Requests
          </h4>
          {incomingProfiles.length > 0 ? (
            <div className="space-y-3">
              {incomingProfiles.map((profile) => (
                <div key={profile.id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {profile.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{profile.name}</p>
                      <p className="text-gray-300 text-sm">{profile.codename}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(profile.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(profile.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No incoming connection requests. When someone sends you a request, it will appear here!</p>
          )}
        </div>

        {/* Mutual Connections */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
            <User className="w-5 h-5" />
            Mutual Connections
          </h4>
          {mutualProfiles.length > 0 ? (
            <div className="space-y-3">
              {mutualProfiles.map((profile) => (
                <div key={profile.id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {profile.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{profile.name}</p>
                      <p className="text-gray-300 text-sm">{profile.codename}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/chat/${profile.id}`)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm flex items-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No mutual connections yet. Accept connection requests to start chatting!</p>
          )}
        </div>
      </div>
    </div>
  );

  // (settings tab removed)

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading user...</p>
        </div>
      </div>
    );
  }

  // removed early return for no matches – handled inside renderMatchesTab

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <Home className="w-8 h-8 text-white" />
              <span className="text-xl font-bold text-white">SyncUp</span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1">
              {[
                { id: 'matches', label: 'Matches', icon: Heart },
                { id: 'profile', label: 'Profile', icon: User },
                { 
                  id: 'connections', 
                  label: 'Connections', 
                  icon: UserPlus,
                  badge: incomingRequests.size > 0 ? incomingRequests.size : undefined
                }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as DashboardTab)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all relative ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.badge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* User Menu + Logout */}
            <div className="flex items-center space-x-3">
              <div className="text-right text-white">
                <div className="text-sm font-medium">{currentUser.name}</div>
                <div className="text-xs opacity-70">{currentUser.codename}</div>
              </div>
              <img
                src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&size=32&background=random`}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full border-2 border-white/30"
              />
              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-1"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">New Connection Request!</p>
                  <p className="text-sm opacity-90">{notification.message}</p>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="ml-2 text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    setActiveTab('connections');
                    dismissNotification(notification.id);
                  }}
                  className="px-3 py-1 bg-white/20 rounded text-sm hover:bg-white/30"
                >
                  View
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Quick nav: show Back to Matches when not on matches tab */}
        {activeTab !== 'matches' && (
          <div className="mb-4 flex justify-center">
            <motion.button
              onClick={() => setActiveTab('matches')}
              className="px-5 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back to Matches
            </motion.button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'matches' && renderMatchesTab()}
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'connections' && renderConnectionsTab()}
            {/* settings removed */}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardScreen;

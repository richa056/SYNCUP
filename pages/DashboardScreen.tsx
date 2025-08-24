
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
  Settings, 
  LogOut, 
  Users, 
  UserPlus,
  Home,
  Bell
} from 'lucide-react';

type DashboardTab = 'matches' | 'profile' | 'connections' | 'settings';

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
  
  // Settings state
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('syncup_user_settings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
    return {
      notifications: {
        newMatches: true,
        connectionRequests: true,
        newMessages: true
      },
      privacy: {
        showProfile: true,
        allowRequests: true,
        showOnlineStatus: false
      },
      chat: {
        readReceipts: true,
        typingIndicators: true,
        autoReply: false
      }
    };
  });

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





  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('syncup_user_settings', JSON.stringify(settings));
  }, [settings]);

  const handleLike = () => {
    if (currentProfile && currentProfile.id) {
      toggleLike(currentProfile.id);
      // Don't automatically move to next profile - user must press Next button
      // nextProfile(); // Removed automatic navigation
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



  const handleSettingChange = (category: keyof typeof settings, setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleEditProfile = () => {
    // Navigate to profile editing (you can implement this later)
    alert('Profile editing feature coming soon!');
  };



  // Function to test real-time chat functionality
  const testRealTimeChat = () => {
    // First ensure we have a mutual connection
    if (mutualConnections.size === 0) {
      alert('You need a mutual connection first! Send a connection request to a profile and have it accepted.');
      return;
    }

    // Get the first mutual connection
    const firstConnection = Array.from(mutualConnections)[0];
    
    // Navigate to chat
    navigate(`/chat/${firstConnection}`);
  };

  const handleChangePassword = () => {
    // Implement password change (you can implement this later)
    alert('Password change feature coming soon!');
  };

  const renderMatchesTab = () => (
    <div className="space-y-6">
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Sent Connection Requests */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Sent Requests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(connectionRequests).map((requestId) => {
            const profile = analyzedMatches.find(m => m.id === requestId);
            if (!profile) return null;
            
            return (
              <motion.div
                key={requestId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=40&background=random`}
                    alt={profile.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h4 className="text-white font-semibold">{profile.name}</h4>
                    <p className="text-white/70 text-sm">{profile.codename}</p>
                  </div>
                </div>
                <div className="text-center">
                  <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs rounded-full">
                    Request Sent
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {connectionRequests.size === 0 && (
          <div className="text-center text-white/70 py-8">
            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No connection requests sent yet</p>
            <p className="text-sm">Start liking profiles to send connection requests!</p>
          </div>
        )}
      </div>

      {/* Incoming Connection Requests */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Incoming Requests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(incomingRequests).map((requestId) => {
            const profile = analyzedMatches.find(m => m.id === requestId);
            if (!profile) return null;
            
            return (
              <motion.div
                key={requestId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=40&background=random`}
                    alt={profile.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h4 className="text-white font-semibold">{profile.name}</h4>
                    <p className="text-white/70 text-sm">{profile.codename}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => acceptConnectionRequest(requestId)}
                    className="flex-1 py-2 px-3 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => rejectConnectionRequest(requestId)}
                    className="flex-1 py-2 px-3 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {incomingRequests.size === 0 && (
          <div className="text-center text-white/70 py-8">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No incoming connection requests</p>
            <p className="text-sm">When someone sends you a request, it will appear here!</p>
          </div>
          )}
      </div>

      {/* Mutual Connections */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Mutual Connections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(mutualConnections).map((connectionId) => {
            const profile = analyzedMatches.find(m => m.id === connectionId);
            if (!profile) return null;
            
            return (
              <motion.div
                key={connectionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=40&background=random`}
                    alt={profile.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h4 className="text-white font-semibold">{profile.name}</h4>
                    <p className="text-white/70 text-sm">{profile.codename}</p>
                  </div>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => handleChat(profile)}
                    className="w-full py-2 px-3 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    💬 Start Chat
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {mutualConnections.size === 0 && (
          <div className="text-center text-white/70 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No mutual connections yet</p>
            <p className="text-sm">Accept connection requests to start chatting!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white text-center mb-6">Settings</h2>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
        {/* Notification Preferences */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-3">Notification Preferences</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 text-white">
              <input 
                type="checkbox" 
                checked={settings.notifications.newMatches}
                onChange={(e) => handleSettingChange('notifications', 'newMatches', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
              />
              <span>New match notifications</span>
            </label>
            <label className="flex items-center space-x-3 text-white">
              <input 
                type="checkbox" 
                checked={settings.notifications.connectionRequests}
                onChange={(e) => handleSettingChange('notifications', 'connectionRequests', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
              />
              <span>Connection request alerts</span>
            </label>
            <label className="flex items-center space-x-3 text-white">
              <input 
                type="checkbox" 
                checked={settings.notifications.newMessages}
                onChange={(e) => handleSettingChange('notifications', 'newMessages', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
              />
              <span>New message notifications</span>
            </label>
          </div>
        </div>

        <hr className="border-white/20" />



        <hr className="border-white/20" />

        {/* Privacy Settings */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-3">Privacy Settings</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 text-white">
              <input 
                type="checkbox" 
                checked={settings.privacy.showProfile}
                onChange={(e) => handleSettingChange('privacy', 'showProfile', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
              />
              <span>Show my profile to other developers</span>
            </label>
            <label className="flex items-center space-x-3 text-white">
              <input 
                type="checkbox" 
                checked={settings.privacy.allowRequests}
                onChange={(e) => handleSettingChange('privacy', 'allowRequests', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
              />
              <span>Allow connection requests</span>
            </label>
            <label className="flex items-center space-x-3 text-white">
              <input 
                type="checkbox" 
                checked={settings.privacy.showOnlineStatus}
                onChange={(e) => handleSettingChange('privacy', 'showOnlineStatus', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
              />
              <span>Show online status</span>
            </label>
          </div>
        </div>

        <hr className="border-white/20" />

        {/* Chat Preferences */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-3">Chat Preferences</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 text-white">
              <input 
                type="checkbox" 
                checked={settings.chat.readReceipts}
                onChange={(e) => handleSettingChange('chat', 'readReceipts', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
              />
              <span>Read receipts</span>
            </label>
            <label className="flex items-center space-x-3 text-white">
              <input 
                type="checkbox" 
                checked={settings.chat.typingIndicators}
                onChange={(e) => handleSettingChange('chat', 'typingIndicators', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
              />
              <span>Typing indicators</span>
            </label>
            <label className="flex items-center space-x-3 text-white">
              <input 
                type="checkbox" 
                checked={settings.chat.autoReply}
                onChange={(e) => handleSettingChange('chat', 'autoReply', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
              />
              <span>Auto-reply when busy</span>
            </label>
          </div>
        </div>

        <hr className="border-white/20" />

        {/* Account Actions */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-3">Account Actions</h3>
          <div className="space-y-2">
            <button 
              onClick={handleEditProfile}
              className="w-full text-left p-3 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5" />
                <span>Edit Profile</span>
              </div>
            </button>
            

            
            <button 
              onClick={testRealTimeChat}
              className="w-full text-left p-3 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span>💬</span>
                <span>Test Real-time Chat</span>
              </div>
            </button>
            
            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="text-blue-300 font-semibold mb-2">🌐 Real-time Testing Instructions:</h4>
              <div className="text-blue-200/80 text-sm space-y-1">
                <div>1. <strong>Tab 1:</strong> Login with LinkedIn/GitHub/Google</div>
                <div>2. <strong>Tab 2:</strong> Login with DIFFERENT OAuth account</div>
                <div>3. <strong>Both tabs:</strong> Complete onboarding (different answers)</div>
                <div>4. <strong>Tab 1:</strong> Send connection request to Tab 2's profile</div>
                <div>5. <strong>Tab 2:</strong> Accept the incoming request</div>
                <div>6. <strong>Both tabs:</strong> Should update counts in real-time!</div>
                <div>7. <strong>Test chat:</strong> Click "Test Real-time Chat" button</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <h4 className="text-green-300 font-semibold mb-2">🎯 New Smart Matching System:</h4>
              <div className="text-green-200/80 text-sm space-y-1">
                <div>✅ <strong>Performance Analysis:</strong> 1-second metrics calculation</div>
                <div>✅ <strong>Smart Matching:</strong> Find 3 most similar users</div>
                <div>✅ <strong>Real-time Updates:</strong> Cross-tab synchronization</div>
                <div>✅ <strong>MongoDB Integration:</strong> Scale to 300+ users</div>
                <div>✅ <strong>Fallback System:</strong> Works even if DB fails</div>
              </div>
            </div>
            
            <button 
              onClick={handleChangePassword}
              className="w-full text-left p-3 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5" />
                <span>Change Password</span>
              </div>
            </button>
            
            <button 
              onClick={handleLogout}
              className="w-full text-left p-3 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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

  if (analyzedMatches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-8">
          <Users className="w-16 h-16 mx-auto mb-6 opacity-50" />
          <h1 className="text-3xl font-bold mb-4">🔍 No matches found yet</h1>
          <div className="text-lg opacity-80 mb-8 space-y-2">
            <p>No developers with similar preferences found yet!</p>
            <p className="text-sm opacity-70">
              More developers are joining every day. Your answers are stored and will match with new users automatically.
            </p>
            <p className="text-xs opacity-50">
              💡 Click refresh to check for new matches or try logging in with different accounts to test the system!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={refreshMatches}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔄 Refresh Matches
            </motion.button>
            <motion.button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-green-600 transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📝 Retake Onboarding
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <Home className="w-8 h-8 text-white" />
              <span className="text-xl font-bold text-white">DevMatch</span>
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
                },
                { id: 'settings', label: 'Settings', icon: Settings }
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

            {/* User Menu */}
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
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
            {activeTab === 'settings' && renderSettingsTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardScreen;

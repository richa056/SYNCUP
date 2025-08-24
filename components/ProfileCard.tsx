
import React from 'react';
import { motion } from 'framer-motion';
import { DeveloperProfile } from '../types';

interface ProfileCardProps {
  profile: DeveloperProfile;
  onLike: () => void;
  onPass: () => void;
  onChat?: () => void;
  onConnectionRequest?: () => void;
  isLiked?: boolean;
  isMutualConnection?: boolean;
  hasConnectionRequest?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onLike, onPass, onChat, onConnectionRequest, isLiked = false, isMutualConnection = false, hasConnectionRequest = false }) => {



  // Add safety check for profile
  if (!profile) {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">😅</div>
          <h2 className="text-xl font-semibold mb-2">Profile Not Available</h2>
          <p className="text-sm">This profile couldn't be loaded properly.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white/30">
          <img
            src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Developer')}&size=96&background=random`}
            alt={profile.name || 'Developer'}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Developer')}&size=96&background=random`;
            }}
          />
        </div>
        <h2 className="text-2xl font-bold mb-2">{profile.name || 'Anonymous Developer'}</h2>
        <p className="text-lg opacity-90 mb-3">{profile.codename || 'CodeCraft'}</p>
        
        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-2">
          {profile.badges && profile.badges.length > 0 && profile.badges.slice(0, 3).map((badge, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Profile Stats */}
      <div className="p-6">
        {/* Trust Level & Rating */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{profile.trustLevel || 0}%</div>
            <div className="text-sm text-gray-600">Trust Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">{profile.profileRating || 0}/5.0</div>
            <div className="text-sm text-gray-600">Profile Rating</div>
          </div>
        </div>

        {/* Traits */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Personality Traits</h3>
          <div className="flex flex-wrap gap-2">
            {profile.traits && profile.traits.length > 0 ? (
              profile.traits.map((trait, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                >
                  {trait}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No traits available</span>
            )}
          </div>
        </div>

        {/* Dev DNA */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Developer DNA</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Work Style</span>
                <span className="font-medium">{profile.devDna?.workStyle || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Problem Solving</span>
                <span className="font-medium">{profile.devDna?.problemSolving || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Team Collaboration</span>
                <span className="font-medium">{profile.devDna?.teamCollaboration || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Learning Style</span>
                <span className="font-medium">{profile.devDna?.learningStyle || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Languages */}
        {profile.devDna?.topLanguages && profile.devDna.topLanguages.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Top Languages</h3>
            <div className="space-y-2">
              {profile.devDna.topLanguages.map((lang, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{lang.lang}</span>
                    <span className="font-medium">{lang.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${lang.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GitHub Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-gray-800">{profile.devDna?.commitFrequency || 0}</div>
            <div className="text-sm text-gray-600">Commits/Month</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-gray-800">{profile.devDna?.starCount || 0}</div>
            <div className="text-sm text-gray-600">Stars Earned</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3 mt-6">
        {/* Like Button - Always visible */}
        <motion.button
          onClick={onLike}
          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
            isLiked 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLiked ? '💚 Liked!' : '❤️ Like'}
        </motion.button>

        {/* Connection Request Button - Show after liking, but before mutual connection */}
        {isLiked && !isMutualConnection && onConnectionRequest && (
          <motion.button
            onClick={onConnectionRequest}
            disabled={hasConnectionRequest}
            className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
              hasConnectionRequest 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
            whileHover={hasConnectionRequest ? {} : { scale: 1.02 }}
            whileTap={hasConnectionRequest ? {} : { scale: 0.98 }}
          >
            {hasConnectionRequest ? '✅ Request Sent' : '🤝 Send Connection Request'}
          </motion.button>
        )}

        {/* Chat Button - Only show if liked AND has mutual connection */}
        {isLiked && isMutualConnection && onChat && (
          <motion.button
            onClick={onChat}
            className="w-full py-3 px-6 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            💬 Start Chat
          </motion.button>
        )}

        {/* Pass Button - Always visible */}
        <motion.button
          onClick={onPass}
          className="w-full py-3 px-6 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ❌ Pass
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProfileCard;
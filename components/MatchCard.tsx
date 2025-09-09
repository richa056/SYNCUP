
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { DeveloperProfile } from '../types';
import { Heart, MessageSquare, Info, X, UserPlus } from 'lucide-react';
import { useProfileBuilder } from '../context/ProfileBuilderContext';

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' } }
};

interface MatchCardProps {
    match: DeveloperProfile;
    score: number;
    reason?: string;
    onStartChat: (match: DeveloperProfile) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, score, reason, onStartChat }) => {
  const { likedMatches, toggleLike, passMatch, connectionRequests, sendConnectionRequest } = useProfileBuilder();
  const isLiked = likedMatches.has(match.id);
  const isPassed = false; // We'll implement this
  const hasConnectionRequest = connectionRequests.has(match.id);
  const compatibilityScore = score;
  const scoreColor = compatibilityScore > 80 ? 'text-green-400' : compatibilityScore > 60 ? 'text-yellow-400' : 'text-orange-400';

  const handlePass = () => {
    passMatch(match.id);
  };

  const handleConnectionRequest = () => {
    sendConnectionRequest(match.id);
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-brand-surface rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl hover:shadow-brand-primary/20 hover:-translate-y-2 text-shadow-sm shadow-black/20"
    >
      <div className="relative">
        <motion.img 
          src={match.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name || 'Developer')}&size=96&background=random`} 
          alt={match.name || 'Developer'} 
          className="w-24 h-24 rounded-full border-4 border-brand-accent"
          whileHover={{ scale: 1.1 }}
        />
        <div className={`absolute -bottom-2 -right-2 text-lg font-bold px-3 py-1 rounded-full bg-brand-bg border-2 border-brand-accent ${scoreColor}`}>
          {compatibilityScore > 0 ? `${compatibilityScore}%` : '...'}
        </div>
      </div>
      <h3 className="mt-4 text-xl font-bold">{match.name}</h3>
      <p className="text-brand-text-secondary text-sm">"{match.codename}"</p>
      
      {reason && (
        <div className="group relative flex items-center justify-center my-3">
          <Info size={16} className="text-brand-text-secondary cursor-pointer" />
          <div className="absolute bottom-full mb-2 w-48 p-2 text-xs text-center text-white bg-brand-surface-darker rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {reason}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2 my-2">
        {match.traits.slice(0, 3).map(trait => (
          <span key={trait} className="px-2 py-1 text-xs font-medium rounded-full bg-brand-primary/20 text-brand-accent">
            {trait}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-auto pt-4">
        {/* Pass Button */}
        <motion.button 
          onClick={handlePass}
          className="p-3 bg-red-500/20 text-red-500 rounded-full"
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.4)'}}
          whileTap={{ scale: 0.9 }}
          title="Pass on this match"
        >
          <X size={20} />
        </motion.button>

        {/* Like Button */}
        <motion.button 
          onClick={() => toggleLike(match.id)}
          className={`p-3 rounded-full transition-colors duration-300 ${isLiked ? 'bg-brand-secondary text-white' : 'bg-brand-secondary/20 text-brand-secondary'}`}
          whileHover={{ scale: 1.1, backgroundColor: isLiked ? 'rgb(236 72 153)' : 'rgba(236, 72, 153, 0.4)'}}
          whileTap={{ scale: 0.9 }}
          title={isLiked ? 'Unlike' : 'Like this match'}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
        </motion.button>

        {/* Connection Request Button - Only show if liked */}
        {isLiked && !hasConnectionRequest && (
          <motion.button 
            onClick={handleConnectionRequest}
            className="p-3 bg-green-500/20 text-green-500 rounded-full"
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(34, 197, 94, 0.4)'}}
            whileTap={{ scale: 0.9 }}
            title="Send connection request"
          >
            <UserPlus size={20} />
          </motion.button>
        )}

        {/* Chat Button - Only show if liked */}
        {isLiked && (
          <motion.button 
            onClick={() => onStartChat(match)}
            className="p-3 bg-brand-primary/20 text-brand-primary rounded-full"
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(79, 70, 229, 0.4)'}}
            whileTap={{ scale: 0.9 }}
            title="Start chat"
          >
            <MessageSquare size={20} />
          </motion.button>
        )}
      </div>

      {/* Status Messages */}
      {hasConnectionRequest && (
        <div className="mt-2 text-xs text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
          Connection request sent
        </div>
      )}
    </motion.div>
  );
};

export default MatchCard;
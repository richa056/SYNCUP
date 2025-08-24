
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileBuilder } from '../context/ProfileBuilderContext';

const CompanionAvatar: React.FC = () => {
  // Safe access to context with fallback
  let companionMessage: string;
  try {
    const profileBuilder = useProfileBuilder();
    companionMessage = profileBuilder.companionMessage;
  } catch (error) {
    console.warn('ProfileBuilder context not available, using fallback');
    companionMessage = "Welcome to SyncUp! Let's find your developer soulmate.";
  }
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex items-end gap-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && companionMessage && (
           <motion.div
             initial={{ opacity: 0, y: 10, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 10, scale: 0.9 }}
             transition={{ type: 'spring', stiffness: 200, damping: 20 }}
             className="max-w-xs p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg"
           >
             <p className="text-sm text-white">{companionMessage}</p>
           </motion.div>
        )}
      </AnimatePresence>
     
      <motion.div
        className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 cursor-pointer flex items-center justify-center shadow-2xl"
        animate={{ 
          y: [0, -15, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{ scale: 1.1 }}
      >
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden text-2xl">
          🤖
        </div>
      </motion.div>
    </div>
  );
};

export default CompanionAvatar;

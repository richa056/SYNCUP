

import React, { useState, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Meme } from '../types';

interface MemeCardProps {
  meme: Meme;
  onReaction: (reaction: '😐' | '😂' | '💯' | '😭') => void;
}

const MemeCard: React.FC<MemeCardProps> = ({ meme, onReaction }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(meme.imageUrl);

  useEffect(() => {
    setCurrentImageUrl(meme.imageUrl);
    setImageError(false);
    setImageLoaded(false);
    
    // Debug logging
    console.log('MemeCard: Loading image:', meme.id, 'URL:', meme.imageUrl);
  }, [meme.imageUrl]);

  const handleImageError = () => {
    console.error('MemeCard: Image failed to load:', meme.id, 'URL:', currentImageUrl);
    if (!imageError) {
      setImageError(true);
      setCurrentImageUrl(meme.fallbackUrl);
    } else {
      // If fallback also fails, show placeholder
      setImageLoaded(true);
    }
  };

  const handleImageLoad = () => {
    console.log('MemeCard: Image loaded successfully:', meme.id, 'URL:', currentImageUrl);
    setImageLoaded(true);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      // Edge emoji rule: left swipe -> leftmost emoji, right swipe -> rightmost emoji
      const leftmost: '😐' = '😐';
      const rightmost: '😭' = '😭';
      onReaction(direction === 'right' ? rightmost : leftmost);
    }
  };

  const renderImage = () => {
    // Show the actual meme image with fallback handling
    return (
      <div className="w-full h-64 relative overflow-hidden rounded-t-xl">
        <img
          src={currentImageUrl}
          alt={meme.title}
          className={`w-full h-full object-contain bg-gray-100 transition-all duration-500 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="eager"
          style={{
            maxHeight: '100%',
            maxWidth: '100%'
          }}
        />
        
        {/* Loading overlay */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <div className="text-gray-600">Loading meme...</div>
            </div>
          </div>
        )}
        
        {/* Error fallback */}
        {imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-200 to-red-300 flex items-center justify-center">
            <div className="text-center text-red-600">
              <div className="text-4xl mb-2">😅</div>
              <div className="font-medium">{meme.title}</div>
              <div className="text-sm opacity-75">Image not found</div>
              <div className="text-xs opacity-50 mt-1">File: {currentImageUrl}</div>
            </div>
          </div>
        )}
        
        {/* Shimmer effect overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    );
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-grab active:cursor-grabbing relative group"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileHover={{ scale: 1.02, rotateY: 5 }}
      whileTap={{ scale: 0.98 }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {renderImage()}
      
      <div className="p-4 relative z-10">
        <div className="flex justify-center space-x-4">
          {(['😐', '😂', '💯', '😭'] as const).map((reaction) => (
            <motion.button
              key={reaction}
              onClick={() => onReaction(reaction)}
              className="text-2xl hover:scale-110 transition-transform relative group"
              whileHover={{ 
                scale: 1.2, 
                rotate: [0, -10, 10, 0],
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
              
              {reaction}
            </motion.button>
          ))}
        </div>
        
        {/* Swipe instructions with animation */}
        <div className="text-center mt-4 text-sm text-gray-500 animate-pulse">
          <span className="inline-block animate-bounce mr-2">👈</span>
          Swipe left/right or tap a reaction
          <span className="inline-block animate-bounce ml-2">👉</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MemeCard;
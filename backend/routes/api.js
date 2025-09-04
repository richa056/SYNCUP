
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Middleware to verify JWT
const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Adds user payload {id, name} to request
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// @route   GET /api/user/me
// @desc    Get current user's full profile
// @access  Private
router.get('/user/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-quizAnswers -memeReactions');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/profile/finalize
// @desc    Finalize user profile after onboarding
// @access  Private
router.post('/profile/finalize', protect, async (req, res) => {
    const { quizAnswers, memeReactions } = req.body;

    console.log('🔄 Profile finalization request received for user:', req.user.id);
    console.log('📝 Quiz answers:', Object.keys(quizAnswers || {}).length, 'questions');
    console.log('😄 Meme reactions:', (memeReactions || []).length, 'reactions');

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            console.error('❌ User not found:', req.user.id);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('✅ Found user:', user.name);

        // Persist onboarding data only; no AI/Gemini
        user.quizAnswers = quizAnswers;
        user.memeReactions = memeReactions;
        user.profileComplete = true; // Mark profile as complete

        console.log('💾 Saving user profile with quiz answers and meme reactions...');
        const updatedUser = await user.save();
        console.log('✅ User profile saved successfully:', updatedUser.name);
        
        // Optionally trigger real-time matching asynchronously (no-op for now)
        console.log('🔄 User completed onboarding, data saved.');
        
        res.json(updatedUser);

    } catch (error) {
        console.error("Profile finalization error:", error);
        res.status(500).json({ message: 'Error finalizing profile' });
    }
});

// Mock matches for now
router.get('/matches', protect, async (req, res) => {
    // In a real app, this would be a complex query.
    // For now, return a few other users from the DB.
    try {
        const users = await User.find({ _id: { $ne: req.user.id }, profileComplete: true }).limit(10);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching matches" });
    }
});


export default router;

import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Hidden weighting configuration for matching (not exposed to clients)
const QUESTION_WEIGHTS = {
  // id: relative weight (higher = more impact)
  1: 1.0,  // Work schedule
  2: 0.8,  // Terminal style
  3: 0.5,  // Debugging stress (slider, used implicitly)
  4: 0.6,  // Tabs vs Spaces
  5: 0.9,  // Project management style
  6: 0.6,  // State management
  7: 0.5,  // Theme preference
  8: 0.6,  // Naming convention
  9: 0.4,  // Documentation slider
  10: 0.7  // Work environment
};

const MEME_REACTION_WEIGHT = 10;          // per identical reaction
const MEME_ENGAGEMENT_BONUS = 10;         // both engaged with memes
const PROVIDER_COMPAT_BONUS = 15;         // provider preference alignment

// Helper function to determine if answers are similar
const areAnswersSimilar = (answer1, answer2) => {
  const similarGroups = {
    workSchedule: ['☀️ Morning Maverick', '🌙 Night Owl Ninja', '🌅 Flexible Fighter'],
    terminalStyle: ['🎨 Zsh/Fish Customizer', '🚀 Warp/Fig Magician'],
    projectManagement: ['Git Guru', 'Notion Nerd', 'Kanban King'],
    uiPreference: ['Light', 'Dark'],
    codeStyle: ['Tabs', 'Spaces'],
    stateManagement: ['⚛️ Context API', '🐻 Zustand/Jotai', '🔄 Redux Saga'],
    namingConvention: ['camelCaseChampion', 'PascalCasePioneer', 'snake_case_selector'],
    workEnvironment: ['💻 Minimalist Laptop', '🏙️ Multi-Monitor Command Center', '☕ Cozy Coffee Shop']
  };
  
  for (const [category, answers] of Object.entries(similarGroups)) {
    if (answers.includes(answer1) && answers.includes(answer2)) {
      return true;
    }
  }
  
  // Also consider answers that are close in meaning
  const meaningSimilar = {
    '☀️ Morning Maverick': ['🌅 Flexible Fighter'],
    '🌙 Night Owl Ninja': ['🌅 Flexible Fighter'],
    '🎨 Zsh/Fish Customizer': ['🚀 Warp/Fig Magician'],
    'Git Guru': ['Notion Nerd'],
    'Tabs': ['Spaces'],
    'Light': ['Dark'],
    '💻 Minimalist Laptop': ['☕ Cozy Coffee Shop']
  };
  
  if (meaningSimilar[answer1] && meaningSimilar[answer1].includes(answer2)) {
    return true;
  }
  
  return false;
};

// Helper function to generate traits from quiz answers
const generateTraitsFromQuiz = (quizAnswers, memeReactions) => {
  const traits = [];
  
  if (quizAnswers) {
    if (quizAnswers[1] === '☀️ Morning Maverick') traits.push('Early Bird', 'Morning Person');
    if (quizAnswers[1] === '🌙 Night Owl Ninja') traits.push('Night Owl', 'Late Night Coder');
    
    if (quizAnswers[2] === '🎨 Zsh/Fish Customizer') traits.push('Terminal Artist', 'Custom Enthusiast');
    if (quizAnswers[2] === '🚀 Warp/Fig Magician') traits.push('Modern Tools', 'Innovation Seeker');
    
    if (quizAnswers[4] === 'Spaces') traits.push('Clean Code', 'Format Enthusiast');
    if (quizAnswers[4] === 'Tabs') traits.push('Efficient', 'Quick Coder');
    
    if (quizAnswers[5] === 'Git Guru') traits.push('Version Control Expert', 'Git Master');
    if (quizAnswers[5] === 'Kanban King') traits.push('Visual Organizer', 'Project Manager');
    if (quizAnswers[5] === 'Notion Nerd') traits.push('Documentation Lover', 'Organized');
    
    if (quizAnswers[7] === 'Dark') traits.push('Dark Theme Lover', 'Night Mode');
    if (quizAnswers[7] === 'Light') traits.push('Light Theme Lover', 'Day Mode');
    
    if (quizAnswers[10] === '💻 Minimalist Laptop') traits.push('Minimalist', 'Portable');
    if (quizAnswers[10] === '🏙️ Multi-Monitor Command Center') traits.push('Power User', 'Multi-Tasker');
    if (quizAnswers[10] === '☕ Cozy Coffee Shop') traits.push('Social Coder', 'Networking');
  }
  
  if (memeReactions) {
    const funnyCount = memeReactions.filter(r => r.reaction === '😂').length;
    if (funnyCount > 2) traits.push('Meme Lover', 'Humor Appreciator');
    
    const stressMemes = memeReactions.filter(r => 
      ['This is Fine (Production)', 'Explaining a Bug'].includes(r.memeId) && r.reaction === '😂'
    ).length;
    if (stressMemes > 0) traits.push('Stress Handler', 'Resilient');
  }
  
  // Add some default traits
  traits.push('Developer', 'Problem Solver');
  
  return [...new Set(traits)]; // Remove duplicates
};

// Update user profile with quiz answers and meme reactions
router.put('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { quizAnswers, memeReactions } = req.body;
    
    console.log('🔄 Profile update request for user:', userId);
    console.log('📝 Quiz answers:', Object.keys(quizAnswers || {}).length);
    console.log('😄 Meme reactions:', (memeReactions || []).length);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        quizAnswers, 
        memeReactions,
        profileComplete: true, // Mark profile as complete
        traits: generateTraitsFromQuiz(quizAnswers, memeReactions)
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      console.error('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ Profile updated successfully for:', updatedUser.name);
    res.json(updatedUser);
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Find most similar users based on quiz answers and meme reactions
router.post('/similar', async (req, res) => {
  try {
    const { currentUserId, quizAnswers, memeReactions } = req.body;
    
    console.log('🔍 Finding similar users for:', currentUserId);
    
    // Find ALL users who have quiz answers and meme reactions (excluding current user)
    const potentialMatches = await User.find({
      _id: { $ne: currentUserId },
      quizAnswers: { $exists: true, $ne: {} },
      memeReactions: { $exists: true, $ne: [] }
    }).select('name avatarUrl codename badges traits trustLevel profileRating devDna provider quizAnswers memeReactions');
    
    console.log(`📊 Found ${potentialMatches.length} potential matches for user ${currentUserId}`);
    
    if (potentialMatches.length === 0) {
      console.log('❌ No potential matches found in database');
      return res.json([]);
    }
    
    // Calculate similarity scores for each potential match
    const scoredMatches = potentialMatches.map(match => {
      let similarityScore = 0;
      let commonAnswers = 0;
      let commonReactions = 0;
      const matchingTraits = [];
      
      console.log(`\n🔍 Analyzing match: ${match.name} (${match._id})`);
      
      // Compare quiz answers with hidden weights
      for (const [questionId, userAnswer] of Object.entries(quizAnswers)) {
        const matchAnswer = match.quizAnswers[questionId];
        if (userAnswer && matchAnswer) {
          const weight = QUESTION_WEIGHTS[Number(questionId)] || 0.5;
          if (userAnswer === matchAnswer) {
            similarityScore += Math.round(40 * weight);
            commonAnswers++;
            matchingTraits.push(`Same answer on question ${questionId}`);
          } else if (areAnswersSimilar(userAnswer, matchAnswer)) {
            similarityScore += Math.round(25 * weight);
            matchingTraits.push(`Similar preference on question ${questionId}`);
          } else {
            similarityScore += Math.round(5 * weight);
          }
        }
      }
      
      // Compare meme reactions
      const userReactions = new Set(memeReactions.map(r => `${r.memeId}:${r.reaction}`));
      const matchReactions = new Set(match.memeReactions.map(r => `${r.memeId}:${r.reaction}`));
      
      const commonReactionsList = [...userReactions].filter(r => matchReactions.has(r));
      commonReactions = commonReactionsList.length;
      
      if (commonReactions > 0) {
        similarityScore += Math.min(50, commonReactions * MEME_REACTION_WEIGHT);
        matchingTraits.push(`${commonReactions} similar meme reactions`);
      }
      
      // Engagement bonus
      if (memeReactions.length > 0 && match.memeReactions.length > 0) {
        similarityScore += MEME_ENGAGEMENT_BONUS;
        matchingTraits.push('Both engaged with memes');
      }
      
      // Provider compatibility bonus
      if (match.provider === 'github' && quizAnswers[5] === 'Git Guru') {
        similarityScore += PROVIDER_COMPAT_BONUS;
        matchingTraits.push('Both value version control');
      }
      
      if (match.provider === 'linkedin' && quizAnswers[10] === '☕ Cozy Coffee Shop') {
        similarityScore += PROVIDER_COMPAT_BONUS;
        matchingTraits.push('Both appreciate networking');
      }
      
      // Work schedule compatibility
      if (quizAnswers[1] === match.quizAnswers[1]) {
        similarityScore += 20;
        matchingTraits.push('Same work schedule');
      }
      
      // Terminal style compatibility
      if (quizAnswers[2] === match.quizAnswers[2]) {
        similarityScore += 15;
        matchingTraits.push('Same terminal style');
      }
      
      // Determine compatibility level
      let compatibility = 'low';
      if (similarityScore >= 40) compatibility = 'high';
      else if (similarityScore >= 20) compatibility = 'medium';
      
      console.log(`   Final score: ${similarityScore} (${compatibility} compatibility)`);
      console.log(`   Matching traits:`, matchingTraits);
      
      return {
        userId: match._id,
        user: {
          ...match.toObject(),
          id: match._id
        },
        similarityScore,
        commonAnswers,
        commonReactions,
        matchingTraits,
        compatibility
      };
    });
    
    // Sort by similarity score (highest first) and return minimum 3 matches
    const sortedMatches = scoredMatches.sort((a, b) => b.similarityScore - a.similarityScore);
    const minMatches = Math.min(3, potentialMatches.length);
    const topMatches = sortedMatches.slice(0, Math.max(minMatches, 3));
    
    console.log(`🎯 Top ${topMatches.length} matches found with scores:`, topMatches.map(m => `${m.user.name}: ${m.similarityScore}`));
    
    res.json(topMatches);
    
  } catch (error) {
    console.error('❌ Error finding similar users:', error);
    res.status(500).json({ error: 'Failed to find similar users' });
  }
});

// Real-time matching endpoint - called when user completes onboarding
router.post('/realtime-match', async (req, res) => {
  try {
    const { currentUserId } = req.body;
    
    console.log('🔄 Real-time matching triggered for user:', currentUserId);
    
    const currentUser = await User.findById(currentUserId);
    if (!currentUser || !currentUser.quizAnswers || !currentUser.memeReactions) {
      return res.status(400).json({ error: 'User not found or incomplete profile' });
    }
    
    console.log('✅ Found user with complete profile:', currentUser.name);
    
    // Find ALL other users who have quiz answers and meme reactions
    const potentialMatches = await User.find({
      _id: { $ne: currentUserId },
      quizAnswers: { $exists: true, $ne: {} },
      memeReactions: { $exists: true, $ne: [] }
    }).select('name avatarUrl codename badges traits trustLevel profileRating devDna provider quizAnswers memeReactions');
    
    console.log(`🔄 Found ${potentialMatches.length} potential real-time matches`);
    
    if (potentialMatches.length === 0) {
      return res.json({ message: 'No other users found yet', matches: [] });
    }
    
    // Calculate similarity scores
    const scoredMatches = potentialMatches.map(match => {
      let similarityScore = 0;
      const matchingTraits = [];
      
      // Compare quiz answers with weights
      for (const [questionId, userAnswer] of Object.entries(currentUser.quizAnswers)) {
        const matchAnswer = match.quizAnswers[questionId];
        if (userAnswer && matchAnswer) {
          const weight = QUESTION_WEIGHTS[Number(questionId)] || 0.5;
          if (userAnswer === matchAnswer) {
            similarityScore += Math.round(40 * weight);
            matchingTraits.push(`Same answer on question ${questionId}`);
          } else if (areAnswersSimilar(userAnswer, matchAnswer)) {
            similarityScore += Math.round(25 * weight);
            matchingTraits.push(`Similar preference on question ${questionId}`);
          } else {
            similarityScore += Math.round(5 * weight);
          }
        }
      }
      
      // Compare meme reactions
      const userReactions = new Set(currentUser.memeReactions.map(r => `${r.memeId}:${r.reaction}`));
      const matchReactions = new Set(match.memeReactions.map(r => `${r.memeId}:${r.reaction}`));
      
      const commonReactions = [...userReactions].filter(r => matchReactions.has(r));
      if (commonReactions.length > 0) {
        similarityScore += Math.min(50, commonReactions.length * MEME_REACTION_WEIGHT);
        matchingTraits.push(`${commonReactions.length} similar meme reactions`);
      }
      
      // Engagement bonus
      if (currentUser.memeReactions.length > 0 && match.memeReactions.length > 0) {
        similarityScore += MEME_ENGAGEMENT_BONUS;
        matchingTraits.push('Both engaged with memes');
      }
      
      return {
        userId: match._id,
        user: {
          ...match.toObject(),
          id: match._id
        },
        similarityScore,
        matchingTraits
      };
    });
    
    // Sort and return top matches
    const sortedMatches = scoredMatches.sort((a, b) => b.similarityScore - a.similarityScore);
    const topMatches = sortedMatches.slice(0, Math.max(3, potentialMatches.length));
    
    console.log(`🔄 Real-time matches found:`, topMatches.map(m => `${m.user.name}: ${m.similarityScore}`));
    
    res.json({
      message: `Found ${topMatches.length} matches!`,
      matches: topMatches
    });
    
  } catch (error) {
    console.error('❌ Real-time matching error:', error);
    res.status(500).json({ error: 'Failed to perform real-time matching' });
  }
});

// Refresh matches endpoint
router.post('/refresh-matches', async (req, res) => {
  try {
    const { currentUserId } = req.body;
    
    console.log('🔄 Refresh matches requested for user:', currentUserId);
    
    const currentUser = await User.findById(currentUserId);
    if (!currentUser || !currentUser.quizAnswers || !currentUser.memeReactions) {
      return res.status(400).json({ error: 'User not found or incomplete profile' });
    }
    
    // Find ALL other users who have quiz answers and meme reactions
    const potentialMatches = await User.find({
      _id: { $ne: currentUserId },
      quizAnswers: { $exists: true, $ne: {} },
      memeReactions: { $exists: true, $ne: [] }
    }).select('name avatarUrl codename badges traits trustLevel profileRating devDna provider quizAnswers memeReactions');
    
    console.log(`🔄 Found ${potentialMatches.length} potential matches for refresh`);
    
    if (potentialMatches.length === 0) {
      return res.json({ message: 'No other users found yet', matches: [] });
    }
    
    // Calculate similarity scores
    const scoredMatches = potentialMatches.map(match => {
      let similarityScore = 0;
      const matchingTraits = [];
      
      // Compare quiz answers with weights
      for (const [questionId, userAnswer] of Object.entries(currentUser.quizAnswers)) {
        const matchAnswer = match.quizAnswers[questionId];
        if (userAnswer && matchAnswer) {
          const weight = QUESTION_WEIGHTS[Number(questionId)] || 0.5;
          if (userAnswer === matchAnswer) {
            similarityScore += Math.round(40 * weight);
            matchingTraits.push(`Same answer on question ${questionId}`);
          } else if (areAnswersSimilar(userAnswer, matchAnswer)) {
            similarityScore += Math.round(25 * weight);
            matchingTraits.push(`Similar preference on question ${questionId}`);
          } else {
            similarityScore += Math.round(5 * weight);
          }
        }
      }
      
      // Compare meme reactions
      const userReactions = new Set(currentUser.memeReactions.map(r => `${r.memeId}:${r.reaction}`));
      const matchReactions = new Set(match.memeReactions.map(r => `${r.memeId}:${r.reaction}`));
      
      const commonReactions = [...userReactions].filter(r => matchReactions.has(r));
      if (commonReactions.length > 0) {
        similarityScore += Math.min(50, commonReactions.length * MEME_REACTION_WEIGHT);
        matchingTraits.push(`${commonReactions.length} similar meme reactions`);
      }
      
      // Engagement bonus
      if (currentUser.memeReactions.length > 0 && match.memeReactions.length > 0) {
        similarityScore += MEME_ENGAGEMENT_BONUS;
        matchingTraits.push('Both engaged with memes');
      }
      
      return {
        userId: match._id,
        user: {
          ...match.toObject(),
          id: match._id
        },
        similarityScore,
        matchingTraits
      };
    });
    
    // Sort and return top matches
    const sortedMatches = scoredMatches.sort((a, b) => b.similarityScore - a.similarityScore);
    const topMatches = sortedMatches.slice(0, Math.max(3, potentialMatches.length));
    
    console.log(`🔄 Refresh matches found:`, topMatches.map(m => `${m.user.name}: ${m.similarityScore}`));
    
    res.json({
      message: `Found ${topMatches.length} matches!`,
      matches: topMatches
    });
    
  } catch (error) {
    console.error('❌ Refresh matches error:', error);
    res.status(500).json({ error: 'Failed to refresh matches' });
  }
});

// Debug endpoint to see all users in database with detailed quiz answers
router.get('/debug/all-users', async (req, res) => {
  try {
    const allUsers = await User.find({}).select('name email provider quizAnswers memeReactions profileComplete');
    
    const userStats = allUsers.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      provider: user.provider,
      hasQuizAnswers: !!user.quizAnswers && Object.keys(user.quizAnswers).length > 0,
      hasMemeReactions: !!user.memeReactions && user.memeReactions.length > 0,
      profileComplete: user.profileComplete || false,
      quizAnswerCount: user.quizAnswers ? Object.keys(user.quizAnswers).length : 0,
      memeReactionCount: user.memeReactions ? user.memeReactions.length : 0,
      quizAnswers: user.quizAnswers || {},
      memeReactions: user.memeReactions || [],
      quizAnswersWithWeights: user.quizAnswers ? Object.entries(user.quizAnswers).map(([questionId, answer]) => ({
        questionId: Number(questionId),
        answer: answer,
        weight: QUESTION_WEIGHTS[Number(questionId)] || 0.5
      })) : []
    }));
    
    res.json({
      totalUsers: allUsers.length,
      usersWithQuizAnswers: userStats.filter(u => u.hasQuizAnswers).length,
      usersWithMemeReactions: userStats.filter(u => u.hasMemeReactions).length,
      usersWithCompleteProfiles: userStats.filter(u => u.profileComplete).length,
      questionWeights: QUESTION_WEIGHTS,
      memeReactionWeight: MEME_REACTION_WEIGHT,
      users: userStats
    });
  } catch (error) {
    console.error('Error fetching debug user data:', error);
    res.status(500).json({ error: 'Failed to fetch debug data' });
  }
});

// Test endpoint to simulate matching for a specific user
router.get('/debug/test-matching/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.quizAnswers || !user.memeReactions) {
      return res.status(400).json({ error: 'User has not completed onboarding' });
    }
    
    console.log(`🧪 Testing matching for user: ${user.name} (${user._id})`);
    
    const potentialMatches = await User.find({
      _id: { $ne: userId },
      quizAnswers: { $exists: true, $ne: {} },
      memeReactions: { $exists: true, $ne: [] }
    }).select('name avatarUrl codename badges traits trustLevel profileRating devDna provider quizAnswers memeReactions');
    
    console.log(`🔍 Found ${potentialMatches.length} potential matches in database`);
    
    const scoredMatches = potentialMatches.map(match => {
      let similarityScore = 0;
      let commonAnswers = 0;
      let commonReactions = 0;
      const matchingTraits = [];
      
      // Compare quiz answers with weights
      for (const [questionId, userAnswer] of Object.entries(user.quizAnswers)) {
        const matchAnswer = match.quizAnswers[questionId];
        if (userAnswer && matchAnswer) {
          const weight = QUESTION_WEIGHTS[Number(questionId)] || 0.5;
          console.log(`   Q${questionId}: User="${userAnswer}" vs Match="${matchAnswer}" (weight: ${weight})`);
          
          if (userAnswer === matchAnswer) {
            const points = Math.round(40 * weight);
            similarityScore += points;
            commonAnswers++;
            matchingTraits.push(`Same answer on question ${questionId} (+${points} points)`);
            console.log(`     ✅ EXACT MATCH! +${points} points`);
          } else if (areAnswersSimilar(userAnswer, matchAnswer)) {
            const points = Math.round(25 * weight);
            similarityScore += points;
            matchingTraits.push(`Similar preference on question ${questionId} (+${points} points)`);
            console.log(`     🔶 SIMILAR MATCH! +${points} points`);
          } else {
            const points = Math.round(5 * weight);
            similarityScore += points;
            console.log(`     ❌ NO MATCH! +${points} points (diversity bonus)`);
          }
        }
      }
      
      // Compare meme reactions
      const userReactions = new Set(user.memeReactions.map(r => `${r.memeId}:${r.reaction}`));
      const matchReactions = new Set(match.memeReactions.map(r => `${r.memeId}:${r.reaction}`));
      
      const commonReactionsList = [...userReactions].filter(r => matchReactions.has(r));
      commonReactions = commonReactionsList.length;
      
      if (commonReactions > 0) {
        const points = Math.min(50, commonReactions * MEME_REACTION_WEIGHT);
        similarityScore += points;
        matchingTraits.push(`${commonReactions} similar meme reactions (+${points} points)`);
        console.log(`   😄 Meme reactions: ${commonReactions} common (+${points} points)`);
      }
      
      console.log(`   🎯 Final score: ${similarityScore}`);
      console.log(`   📋 Matching traits:`, matchingTraits);
      
      return {
        userId: match._id,
        user: {
          ...match.toObject(),
          id: match._id
        },
        similarityScore,
        commonAnswers,
        commonReactions,
        matchingTraits
      };
    });
    
    const topMatches = scoredMatches
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5);
    
    console.log(`\n🏆 Top matches:`);
    topMatches.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.user.name}: ${match.similarityScore} points`);
    });
    
    res.json({
      testUser: {
        id: user._id,
        name: user.name,
        quizAnswers: user.quizAnswers,
        memeReactions: user.memeReactions
      },
      potentialMatchesCount: potentialMatches.length,
      topMatches,
      questionWeights: QUESTION_WEIGHTS,
      memeReactionWeight: MEME_REACTION_WEIGHT
    });
    
  } catch (error) {
    console.error('Error testing matching:', error);
    res.status(500).json({ error: 'Failed to test matching' });
  }
});

export default router;

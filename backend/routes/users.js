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

// New: Upsert user and return Mongo _id so frontend saves use a valid id
router.post('/sync', async (req, res) => {
  try {
    const { provider, providerId, email, name, avatarUrl } = req.body || {};
    if (!provider || !email) {
      return res.status(400).json({ error: 'provider and email are required' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        provider: provider.toLowerCase(),
        providerId: providerId || email,
        email,
        name: name || email.split('@')[0],
        avatarUrl,
      });
      await user.save();
      console.log('✅ Created new user via /sync:', email);
    } else {
      // ensure provider fields are filled
      user.provider = user.provider || provider.toLowerCase();
      user.providerId = user.providerId || providerId || email;
      if (name && user.name !== name) user.name = name;
      if (avatarUrl && user.avatarUrl !== avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();
      console.log('🔄 Synced existing user via /sync:', email);
    }

    res.json({
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      provider: user.provider,
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    console.error('Error in /api/users/sync:', err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Helper function to determine if answers are similar
const areAnswersSimilar = (answer1, answer2) => {
  const similarGroups = {
    workSchedule: ['Morning', 'Night', 'Flexible'],
    terminalStyle: ['Customized Zsh/Fish', 'Default Bash', 'Modern GUI terminal'],
    projectManagement: ['Kanban board', 'GitHub Issues', 'Documentation-first'],
    uiPreference: ['Light', 'Dark'],
    codeStyle: ['Tabs', 'Spaces'],
    stateManagement: ['Context API', 'Zustand/Jotai', 'Redux/Redux-Saga'],
    namingConvention: ['camelCase', 'PascalCase', 'snake_case'],
    workEnvironment: ['Single laptop', 'Multi‑monitor desk', 'Coffee shop/Co‑working']
  };
  
  for (const [category, answers] of Object.entries(similarGroups)) {
    if (answers.includes(answer1) && answers.includes(answer2)) {
      return true;
    }
  }
  
  // Also consider answers that are close in meaning
  const meaningSimilar = {
    'Morning': ['Flexible'],
    'Night': ['Flexible'],
    'Customized Zsh/Fish': ['Modern GUI terminal'],
    'GitHub Issues': ['Documentation-first'],
    'Tabs': ['Spaces'],
    'Light': ['Dark'],
    'Single laptop': ['Coffee shop/Co‑working']
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
    if (quizAnswers[1] === 'Morning') traits.push('Early Bird', 'Morning Person');
    if (quizAnswers[1] === 'Night') traits.push('Night Owl', 'Late Night Coder');
    if (quizAnswers[1] === 'Flexible') traits.push('Flexible Schedule');
    
    if (quizAnswers[2] === 'Customized Zsh/Fish') traits.push('Terminal Customizer', 'CLI Enthusiast');
    if (quizAnswers[2] === 'Default Bash') traits.push('Simplicity Lover');
    if (quizAnswers[2] === 'Modern GUI terminal') traits.push('Modern Tools', 'Innovation Seeker');
    
    if (quizAnswers[4] === 'Spaces') traits.push('Clean Code', 'Format Enthusiast');
    if (quizAnswers[4] === 'Tabs') traits.push('Efficient', 'Quick Coder');
    
    if (quizAnswers[5] === 'GitHub Issues') traits.push('Version Control Oriented');
    if (quizAnswers[5] === 'Kanban board') traits.push('Visual Organizer', 'Project Manager');
    if (quizAnswers[5] === 'Documentation-first') traits.push('Documentation Lover', 'Organized');
    
    if (quizAnswers[7] === 'Dark') traits.push('Dark Theme Lover', 'Night Mode');
    if (quizAnswers[7] === 'Light') traits.push('Light Theme Lover', 'Day Mode');
    
    if (quizAnswers[10] === 'Single laptop') traits.push('Minimalist', 'Portable');
    if (quizAnswers[10] === 'Multi‑monitor desk') traits.push('Power User', 'Multi-Tasker');
    if (quizAnswers[10] === 'Coffee shop/Co‑working') traits.push('Social Coder', 'Networking');
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

// Generate badges and codename from quiz answers
const generateProfileFromQuiz = (quizAnswers) => {
  const traits = generateTraitsFromQuiz(quizAnswers || {}, []);
  const badges = [];
  if (quizAnswers) {
    if (quizAnswers[5] === 'GitHub Issues') badges.push('Version Control Oriented');
    if (quizAnswers[7] === 'Dark') badges.push('Dark Theme Aficionado');
    if (quizAnswers[4] === 'Spaces') badges.push('Clean Formatter');
    if (quizAnswers[1] === 'Night') badges.push('Night Coder');
    if (quizAnswers[2] === 'Modern GUI terminal') badges.push('Modern Terminal User');
  }
  const base = quizAnswers?.[1] === 'Night' ? 'Night' : (quizAnswers?.[1] === 'Morning' ? 'Sun' : 'Flex');
  const code = Math.random().toString(36).substr(2, 4).toUpperCase();
  const codename = `${base}_${code}`;
  return { traits, badges: badges.length ? badges : ['Developer'], codename };
};

// Compute DevDNA cosine similarity percent [0..100]
const computeDevDnaSimilarityPercent = (dnaA, dnaB) => {
  if (!dnaA || !dnaB) return 0;
  const mapA = new Map((dnaA.topLanguages || []).map(({ lang, value }) => [lang, Number(value) || 0]));
  const mapB = new Map((dnaB.topLanguages || []).map(({ lang, value }) => [lang, Number(value) || 0]));
  const langs = new Set([...mapA.keys(), ...mapB.keys()]);
  const vecA = [];
  const vecB = [];
  for (const lang of langs) {
    vecA.push(mapA.get(lang) || 0);
    vecB.push(mapB.get(lang) || 0);
  }
  const dot = vecA.reduce((acc, v, i) => acc + v * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, v) => acc + v * v, 0)) || 1;
  const normB = Math.sqrt(vecB.reduce((acc, v) => acc + v * v, 0)) || 1;
  const cosine = dot / (normA * normB);
  const bounded = Math.max(0, Math.min(1, isNaN(cosine) ? 0 : cosine));
  return Math.round(bounded * 100);
};

const DEVDNA_PERCENT_WEIGHT = Number(process.env.DEVDNA_PERCENT_WEIGHT || 10); // contribute up to X percent

// Simple MMR diversity reranking
const mmrRerank = (items, k = 3, lambda = Number(process.env.MMR_LAMBDA || 0.7)) => {
  const selected = [];
  const remaining = [...items];
  const similarityBetween = (a, b) => {
    const setA = new Set(a.matchingTraits || []);
    const setB = new Set(b.matchingTraits || []);
    const inter = [...setA].filter(x => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size || 1;
    return inter / union; // Jaccard
  };
  while (selected.length < k && remaining.length > 0) {
    let best = null;
    let bestScore = -Infinity;
    for (const cand of remaining) {
      const relevance = cand.similarityScore;
      const redundancy = selected.length ? Math.max(...selected.map(s => similarityBetween(cand, s))) : 0;
      const mmrScore = lambda * relevance - (1 - lambda) * (redundancy * 100);
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        best = cand;
      }
    }
    selected.push(best);
    const idx = remaining.indexOf(best);
    if (idx >= 0) remaining.splice(idx, 1);
  }
  return selected;
};

// Update user profile with quiz answers and meme reactions (partial updates allowed)
router.put('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { quizAnswers, memeReactions, profileComplete } = req.body;
    
    console.log('🔄 Profile update request for user:', userId);
    console.log('📝 Incoming quiz answers:', Object.keys(quizAnswers || {}).length);
    console.log('😄 Incoming meme reactions:', (memeReactions || []).length);
    
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Merge quiz answers
    if (quizAnswers && typeof quizAnswers === 'object') {
      user.quizAnswers = { ...(user.quizAnswers || {}), ...quizAnswers };
      // Update traits/badges/codename from answers (avoid mock defaults)
      const prof = generateProfileFromQuiz(user.quizAnswers);
      user.traits = prof.traits;
      user.badges = prof.badges;
      if (!user.codename || user.codename.startsWith('Dev_')) {
        user.codename = prof.codename;
      }
    }

    // Merge meme reactions by memeId (replace reaction for same memeId)
    if (Array.isArray(memeReactions) && memeReactions.length > 0) {
      const byId = new Map();
      for (const r of (user.memeReactions || [])) {
        byId.set(r.memeId, r);
      }
      for (const r of memeReactions) {
        byId.set(r.memeId, { memeId: r.memeId, reaction: r.reaction });
      }
      user.memeReactions = Array.from(byId.values());
    }

    // Only set profileComplete if explicitly provided; else preserve current
    if (typeof profileComplete === 'boolean') {
      user.profileComplete = profileComplete;
    }

    // Update traits opportunistically based on latest data
    user.traits = generateTraitsFromQuiz(user.quizAnswers || {}, user.memeReactions || []);

    const updatedUser = await user.save();
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
    
    // Calculate similarity scores for each potential match (normalized 0..100)
    const scoredMatches = potentialMatches.map(match => {
      const matchingTraits = [];
      
      // Quiz similarity percent
      const quizPercent = computeQuizSimilarityPercent(quizAnswers || {}, match.quizAnswers || {});
      if (quizPercent >= QUIZ_HIGH_MATCH_THRESHOLD) {
        matchingTraits.push(`High quiz match (${quizPercent}%)`);
      }

      // DevDNA similarity
      const devDnaPercent = computeDevDnaSimilarityPercent({ topLanguages: [] }, match.devDna || {});
      const devDnaContribution = Math.round((devDnaPercent / 100) * DEVDNA_PERCENT_WEIGHT);
      if (devDnaContribution > 0) matchingTraits.push(`DevDNA similarity (+${devDnaContribution}%)`);

      // Meme reactions contribution (percent)
      const userReactions = new Set((memeReactions || []).map(r => `${r.memeId}:${r.reaction}`));
      const matchReactions = new Set((match.memeReactions || []).map(r => `${r.memeId}:${r.reaction}`));
      const commonReactionsList = [...userReactions].filter(r => matchReactions.has(r));
      const memePercentRaw = (commonReactionsList.length || 0) * MEME_PERCENT_PER_MATCH;
      const memePercent = Math.min(MEME_PERCENT_CAP, memePercentRaw);
      if (memePercent > 0) matchingTraits.push(`${commonReactionsList.length} similar meme reactions (+${memePercent}%)`);
      
      // Engagement bonus
      const engaged = (memeReactions || []).length > 0 && (match.memeReactions || []).length > 0;
      const engagementBonus = engaged ? MEME_ENGAGEMENT_BONUS : 0;
      if (engagementBonus > 0) matchingTraits.push('Both engaged with memes');
      
      // Provider compatibility bonus
      let providerBonus = 0;
      if (match.provider === 'github' && quizAnswers && quizAnswers[5] === 'Git Guru') {
        providerBonus += PROVIDER_COMPAT_BONUS;
        matchingTraits.push('Both value version control');
      }
      if (match.provider === 'linkedin' && quizAnswers && quizAnswers[10] === '☕ Cozy Coffee Shop') {
        providerBonus += PROVIDER_COMPAT_BONUS;
        matchingTraits.push('Both appreciate networking');
      }
      
      // Final normalized score
      const similarityScore = Math.max(0, Math.min(100, Math.round(quizPercent + memePercent + engagementBonus + providerBonus + devDnaContribution)));

      // Compatibility label
      let compatibility = 'low';
      if (similarityScore >= 80) compatibility = 'high';
      else if (similarityScore >= 50) compatibility = 'medium';
      
      return {
        userId: match._id,
        user: { ...match.toObject(), id: match._id },
        similarityScore,
        quizPercent,
        memePercent,
        engagementBonus,
        providerBonus,
        matchingTraits,
        compatibility
      };
    });
    
    // Sort by similarity score (highest first) and return exactly top 3 matches if possible
    const sortedMatches = scoredMatches.sort((a, b) => b.similarityScore - a.similarityScore);
    const topMatches = mmrRerank(sortedMatches, Math.min(3, sortedMatches.length));
    
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
    
    // Calculate similarity scores (normalized 0..100)
    const scoredMatches = potentialMatches.map(match => {
      const matchingTraits = [];
      
      const quizPercent = computeQuizSimilarityPercent(currentUser.quizAnswers || {}, match.quizAnswers || {});
      if (quizPercent >= QUIZ_HIGH_MATCH_THRESHOLD) matchingTraits.push(`High quiz match (${quizPercent}%)`);

      const userReactions = new Set((currentUser.memeReactions || []).map(r => `${r.memeId}:${r.reaction}`));
      const matchReactions = new Set((match.memeReactions || []).map(r => `${r.memeId}:${r.reaction}`));
      const commonReactions = [...userReactions].filter(r => matchReactions.has(r));
      const memePercent = Math.min(MEME_PERCENT_CAP, (commonReactions.length || 0) * MEME_PERCENT_PER_MATCH);
      if (memePercent > 0) matchingTraits.push(`${commonReactions.length} similar meme reactions (+${memePercent}%)`);

      const devDnaPercent = computeDevDnaSimilarityPercent(currentUser.devDna || {}, match.devDna || {});
      const devDnaContribution = Math.round((devDnaPercent / 100) * DEVDNA_PERCENT_WEIGHT);
      if (devDnaContribution > 0) matchingTraits.push(`DevDNA similarity (+${devDnaContribution}%)`);

      const engaged = (currentUser.memeReactions || []).length > 0 && (match.memeReactions || []).length > 0;
      const engagementBonus = engaged ? MEME_ENGAGEMENT_BONUS : 0;
      if (engagementBonus > 0) matchingTraits.push('Both engaged with memes');

      const similarityScore = Math.max(0, Math.min(100, Math.round(quizPercent + memePercent + engagementBonus + devDnaContribution)));
      let compatibility = 'low';
      if (similarityScore >= 80) compatibility = 'high';
      else if (similarityScore >= 50) compatibility = 'medium';
      
      return {
        userId: match._id,
        user: { ...match.toObject(), id: match._id },
        similarityScore,
        quizPercent,
        memePercent,
        engagementBonus,
        matchingTraits,
        compatibility
      };
    });
    
    // Sort and return exactly top 3 matches if possible
    const sortedMatches = scoredMatches.sort((a, b) => b.similarityScore - a.similarityScore);
    const topMatches = mmrRerank(sortedMatches, Math.min(3, sortedMatches.length));
    
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
    
    // Calculate similarity scores (normalized 0..100)
    const scoredMatches = potentialMatches.map(match => {
      const matchingTraits = [];
      
      const quizPercent = computeQuizSimilarityPercent(currentUser.quizAnswers || {}, match.quizAnswers || {});
      if (quizPercent >= QUIZ_HIGH_MATCH_THRESHOLD) matchingTraits.push(`High quiz match (${quizPercent}%)`);

      const userReactions = new Set((currentUser.memeReactions || []).map(r => `${r.memeId}:${r.reaction}`));
      const matchReactions = new Set((match.memeReactions || []).map(r => `${r.memeId}:${r.reaction}`));
      const commonReactions = [...userReactions].filter(r => matchReactions.has(r));
      const memePercent = Math.min(MEME_PERCENT_CAP, (commonReactions.length || 0) * MEME_PERCENT_PER_MATCH);
      if (memePercent > 0) matchingTraits.push(`${commonReactions.length} similar meme reactions (+${memePercent}%)`);

      const engaged = (currentUser.memeReactions || []).length > 0 && (match.memeReactions || []).length > 0;
      const engagementBonus = engaged ? MEME_ENGAGEMENT_BONUS : 0;
      if (engagementBonus > 0) matchingTraits.push('Both engaged with memes');

      const similarityScore = Math.max(0, Math.min(100, Math.round(quizPercent + memePercent + engagementBonus)));
      let compatibility = 'low';
      if (similarityScore >= 80) compatibility = 'high';
      else if (similarityScore >= 50) compatibility = 'medium';
      
      return {
        userId: match._id,
        user: { ...match.toObject(), id: match._id },
        similarityScore,
        quizPercent,
        memePercent,
        engagementBonus,
        matchingTraits,
        compatibility
      };
    });
    
    // Sort and return exactly top 3 matches if possible
    const sortedMatches = scoredMatches.sort((a, b) => b.similarityScore - a.similarityScore);
    const topMatches = sortedMatches.slice(0, Math.min(3, sortedMatches.length));
    
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

// Debug: Get connection state for current user (for testing)
router.get('/debug/connections', async (req, res) => {
  try {
    // Get all users and their connection states
    const users = await User.find({}).select('name email connectionRequestsSent connectionRequestsIncoming mutualConnections').lean();
    
    const connectionSummary = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      sent: user.connectionRequestsSent || [],
      incoming: user.connectionRequestsIncoming || [],
      mutual: user.mutualConnections || []
    }));
    
    res.json({
      totalUsers: users.length,
      connections: connectionSummary
    });
  } catch (e) {
    console.error('Debug connections error:', e);
    res.status(500).json({ error: 'Failed to get debug info' });
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

// New: return raw potential matches (used by frontend mongoMatchingService)
router.post('/matches', async (req, res) => {
  try {
    const { currentUserId, excludeIds = [] } = req.body;

    // Tier 1: Fully completed profiles with both quiz answers and meme reactions
    const tier1Filter = {
      _id: { $ne: currentUserId, $nin: excludeIds },
      profileComplete: true,
      quizAnswers: { $exists: true, $ne: {} },
      memeReactions: { $exists: true, $ne: [] }
    };

    let potentialMatches = await User.find(tier1Filter)
      .select('name avatarUrl codename badges traits trustLevel profileRating devDna provider quizAnswers memeReactions')
      .limit(10);

    // Tier 2: Has either quiz answers or meme reactions
    if (!potentialMatches || potentialMatches.length === 0) {
      const tier2Filter = {
        _id: { $ne: currentUserId, $nin: excludeIds },
        $or: [
          { quizAnswers: { $exists: true, $ne: {} } },
          { memeReactions: { $exists: true, $ne: [] } }
        ]
      };
      potentialMatches = await User.find(tier2Filter)
        .select('name avatarUrl codename badges traits trustLevel profileRating devDna provider quizAnswers memeReactions')
        .limit(10);
    }

    // Tier 3: Anyone else available (guarantee at least one)
    if (!potentialMatches || potentialMatches.length === 0) {
      const tier3Filter = { _id: { $ne: currentUserId, $nin: excludeIds } };
      potentialMatches = await User.find(tier3Filter)
        .select('name avatarUrl codename badges traits trustLevel profileRating devDna provider quizAnswers memeReactions')
        .limit(10);
    }

    res.json(potentialMatches);
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    res.status(500).json({ error: 'Failed to fetch potential matches' });
  }
});

// Record a pass
router.post('/pass', async (req, res) => {
  try {
    const { userId, passedUserId } = req.body;
    if (!userId || !passedUserId || userId === passedUserId) return res.status(400).json({ error: 'Invalid ids' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const set = new Set((user.passedMatches || []).map(id => String(id)));
    if (!set.has(String(passedUserId))) {
      user.passedMatches.push(passedUserId);
      await user.save();
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('pass error', e);
    res.status(500).json({ error: 'Failed to record pass' });
  }
});

// Send a connection request
router.post('/connections/request', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId || fromUserId === toUserId) {
      return res.status(400).json({ error: 'Invalid user ids' });
    }

    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId)
    ]);
    if (!fromUser || !toUser) return res.status(404).json({ error: 'User not found' });

    // Block request if receiver has passed the sender
    const receiverPassed = new Set((toUser.passedMatches || []).map(id => String(id)));
    if (receiverPassed.has(String(fromUser._id))) {
      return res.status(403).json({ error: 'User has passed you' });
    }

    // Prevent duplicates
    const sentSet = new Set((fromUser.connectionRequestsSent || []).map(id => String(id)));
    const incomingSet = new Set((toUser.connectionRequestsIncoming || []).map(id => String(id)));
    if (!sentSet.has(String(toUser._id))) fromUser.connectionRequestsSent.push(toUser._id);
    if (!incomingSet.has(String(fromUser._id))) toUser.connectionRequestsIncoming.push(fromUser._id);

    await Promise.all([fromUser.save(), toUser.save()]);

    res.json({ success: true });
  } catch (e) {
    console.error('send request error', e);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Accept a connection request
router.post('/connections/accept', async (req, res) => {
  try {
    const { userId, fromUserId } = req.body; // userId accepts from fromUserId
    const [user, fromUser] = await Promise.all([
      User.findById(userId),
      User.findById(fromUserId)
    ]);
    if (!user || !fromUser) return res.status(404).json({ error: 'User not found' });

    // Remove from incoming/sent
    user.connectionRequestsIncoming = (user.connectionRequestsIncoming || []).filter(id => String(id) !== String(fromUser._id));
    fromUser.connectionRequestsSent = (fromUser.connectionRequestsSent || []).filter(id => String(id) !== String(user._id));

    // Add to mutual
    const aSet = new Set((user.mutualConnections || []).map(id => String(id)));
    const bSet = new Set((fromUser.mutualConnections || []).map(id => String(id)));
    if (!aSet.has(String(fromUser._id))) user.mutualConnections.push(fromUser._id);
    if (!bSet.has(String(user._id))) fromUser.mutualConnections.push(user._id);

    await Promise.all([user.save(), fromUser.save()]);

    res.json({ success: true });
  } catch (e) {
    console.error('accept request error', e);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Reject a connection request
router.post('/connections/reject', async (req, res) => {
  try {
    const { userId, fromUserId } = req.body;
    const [user, fromUser] = await Promise.all([
      User.findById(userId),
      User.findById(fromUserId)
    ]);
    if (!user || !fromUser) return res.status(404).json({ error: 'User not found' });

    user.connectionRequestsIncoming = (user.connectionRequestsIncoming || []).filter(id => String(id) !== String(fromUser._id));
    fromUser.connectionRequestsSent = (fromUser.connectionRequestsSent || []).filter(id => String(id) !== String(user._id));

    await Promise.all([user.save(), fromUser.save()]);

    res.json({ success: true });
  } catch (e) {
    console.error('reject request error', e);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// Get connection state for a user
router.get('/connections/state/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const includeProfiles = String(req.query.includeProfiles || 'false') === 'true';

    const user = await User.findById(userId).select('connectionRequestsSent connectionRequestsIncoming mutualConnections');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const payload = {
      sent: user.connectionRequestsSent || [],
      incoming: user.connectionRequestsIncoming || [],
      mutual: user.mutualConnections || []
    };

    if (includeProfiles) {
      const [sentDocs, incomingDocs, mutualDocs] = await Promise.all([
        User.find({ _id: { $in: payload.sent } }).select('name avatarUrl codename').lean(),
        User.find({ _id: { $in: payload.incoming } }).select('name avatarUrl codename').lean(),
        User.find({ _id: { $in: payload.mutual } }).select('name avatarUrl codename').lean()
      ]);
      payload.sentProfiles = (sentDocs || []).map(d => ({ ...d, id: d._id }));
      payload.incomingProfiles = (incomingDocs || []).map(d => ({ ...d, id: d._id }));
      payload.mutualProfiles = (mutualDocs || []).map(d => ({ ...d, id: d._id }));
    }

    res.json(payload);
  } catch (e) {
    console.error('get state error', e);
    res.status(500).json({ error: 'Failed to get state' });
  }
});

// Public user profile (minimal fields) by id
router.get('/public/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select('name avatarUrl codename badges traits provider profileRating trustLevel devDna');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ...user.toObject(), id: user._id });
  } catch (e) {
    console.error('public profile error', e);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

export default router;

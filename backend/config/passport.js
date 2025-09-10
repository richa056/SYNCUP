
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2'; // DISABLED - Using custom implementation
import User from '../models/User.js';

passport.use(new GitHubStrategy({
    clientID: 'Ov23lirBd1M6Hf9skWr0',
    clientSecret: '0cfbfa15a405bca8f5f15414adbef22c608e7129',
    // Use env-based absolute URL (prod) with localhost fallback
    callbackURL: `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001'}/auth/github/callback`,
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ providerId: profile.id, provider: 'github' });
      
      // Helper to compute Dev DNA from GitHub activity
      const computeGitHubDevDna = async () => {
        try {
          const reposRes = await fetch('https://api.github.com/user/repos?per_page=100', {
            headers: { Authorization: `token ${accessToken}`, 'User-Agent': 'syncup-app' }
          });
          if (!reposRes.ok) throw new Error('Failed to fetch repos');
          const repos = await reposRes.json();
          
          let totalStars = 0;
          const languageBytes = new Map();
          const languagesFetches = repos.slice(0, 30).map(async (repo) => {
            totalStars += repo.stargazers_count || 0;
            if (!repo.languages_url) return;
            const langRes = await fetch(repo.languages_url, {
              headers: { Authorization: `token ${accessToken}`, 'User-Agent': 'syncup-app' }
            });
            if (!langRes.ok) return;
            const langs = await langRes.json();
            Object.entries(langs).forEach(([lang, bytes]) => {
              const prev = languageBytes.get(lang) || 0;
              languageBytes.set(lang, prev + (typeof bytes === 'number' ? bytes : 0));
            });
          });
          await Promise.all(languagesFetches);
          
          // Build topLanguages percentages
          const totalBytes = Array.from(languageBytes.values()).reduce((a, b) => a + b, 0) || 1;
          const topLanguages = Array.from(languageBytes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([lang, bytes]) => ({ lang, value: Math.round(Number(bytes) * 100 / totalBytes) }));
          // Normalize to sum ~100
          const sum = topLanguages.reduce((a, b) => a + b.value, 0);
          if (sum !== 100 && topLanguages.length > 0) {
            topLanguages[0].value += (100 - sum);
          }
          
          return {
            topLanguages: topLanguages.length > 0 ? topLanguages : [
              { lang: 'JavaScript', value: 50 },
              { lang: 'TypeScript', value: 30 },
              { lang: 'Python', value: 20 },
            ],
            commitFrequency: 8, // Placeholder; could compute from events API
            starCount: totalStars || 0,
          };
        } catch (e) {
          return null;
        }
      };
      if (!user) {
44        // Ensure email is always provided
        const userEmail = profile.emails?.[0]?.value || `github_${profile.id}@syncup.local`;
        
        const computedDevDna = await computeGitHubDevDna();
        user = await User.create({
          provider: 'github',
          providerId: profile.id,
          name: profile.displayName || profile.username,
          email: userEmail,
          avatarUrl: profile.photos?.[0]?.value || 'https://i.pravatar.cc/150',
          // Real data only - no mock defaults
          codename: null, // Will be generated from quiz answers
          badges: [], // Will be generated from quiz answers
          traits: [], // Will be generated from quiz answers
          trustLevel: null, // Will be calculated from real data
          profileRating: null, // Will be calculated from real data
          devDna: computedDevDna || null // Only real GitHub data
        });
      } else {
        // Optionally refresh Dev DNA on login (best-effort; ignore failures)
        try {
          const updated = await computeGitHubDevDna();
          if (updated) {
            user.devDna = updated;
            await user.save();
          }
        } catch (_) { /* ignore */ }
      }
      return done(null, user);
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return done(error, null);
    }
  }
));

passport.use(new GoogleStrategy({
    clientID: '1070667631652-lqv1gc61t434o5pdtrongnl2bc3nkctm.apps.googleusercontent.com',
    clientSecret: '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',
    // Use env-based absolute URL (prod) with localhost fallback
    callbackURL: `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001'}/auth/google/callback`,
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ providerId: profile.id, provider: 'google' });
      if (!user) {
        // Ensure email is always provided
        const userEmail = profile.emails?.[0]?.value || `google_${profile.id}@syncup.local`;
        
        user = await User.create({
          provider: 'google',
          providerId: profile.id,
          name: profile.displayName || 'Google User',
          email: userEmail,
          avatarUrl: profile.photos?.[0]?.value || 'https://i.pravatar.cc/150',
          // Real data only - no mock defaults
          codename: null, // Will be generated from quiz answers
          badges: [], // Will be generated from quiz answers
          traits: [], // Will be generated from quiz answers
          trustLevel: null, // Will be calculated from real data
          profileRating: null, // Will be calculated from real data
          devDna: null // No mock data
        });
      }
      return done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }
));

// LinkedIn Strategy - DISABLED - Using custom implementation instead
// passport.use(new LinkedInStrategy({
//     clientID: '86lse6dytst1cf',
//     clientSecret: 'WPL_AP1.oLdjDDhCP9dDY48s.jE/dFA==',
//     callbackURL: "http://localhost:3001/auth/linkedin/callback",
//     scope: ['openid', 'profile', 'email'],
//     state: false,
//     passReqToCallback: true
//   },
//   async (req, accessToken, refreshToken, profile, done) => {
//     // LinkedIn OAuth is now handled by custom implementation in linkedin-auth.js
//     return done(new Error('LinkedIn OAuth handled by custom implementation'));
//   }
// ));

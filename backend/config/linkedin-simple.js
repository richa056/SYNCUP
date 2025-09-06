import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import User from '../models/User.js';

// Simple LinkedIn strategy without complex state handling
export const setupLinkedInStrategy = () => {
  passport.use(new LinkedInStrategy({
    clientID: '86lse6dytst1cf',
    clientSecret: 'WPL_AP1.oLdjDDhCP9dDY48s.jE/dFA==',
    callbackURL: `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001'}/auth/linkedin/callback`,
    scope: ['openid', 'profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('LinkedIn simple strategy - profile received:', profile);
      
      let user = await User.findOne({ providerId: profile.id, provider: 'linkedin' });
      if (!user) {
        user = await User.create({
          provider: 'linkedin',
          providerId: profile.id,
          name: profile.displayName || 'LinkedIn User',
          email: `linkedin_${profile.id}@syncup.local`,
          avatarUrl: profile.photos?.[0]?.value || 'https://i.pravatar.cc/150',
          codename: 'LinkedIn_' + Math.random().toString(36).substr(2, 6),
          badges: ['Professional Networker', 'Industry Expert', 'Career Developer'],
          traits: ['Business Minded', 'Network Builder', 'Professional Growth'],
          trustLevel: 88,
          profileRating: 90,
          devDna: {
            topLanguages: [
              { lang: 'JavaScript', value: 40 },
              { lang: 'Python', value: 35 },
              { lang: 'SQL', value: 25 }
            ],
            commitFrequency: 6,
            starCount: 80
          }
        });
      }
      return done(null, user);
    } catch (error) {
      console.error('LinkedIn simple strategy error:', error);
      return done(error, null);
    }
  }));
};

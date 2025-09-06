import express from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const LINKEDIN_CLIENT_ID = '86lse6dytst1cf';
const LINKEDIN_CLIENT_SECRET = 'WPL_AP1.oLdjDDhCP9dDY48s.jE/dFA==';
const REDIRECT_URI = `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001'}/auth/linkedin/callback`;

// Test endpoint to verify routes are working
router.get('/linkedin/test', (req, res) => {
    console.log('LinkedIn test endpoint hit!');
    res.json({ 
        message: 'LinkedIn custom OAuth routes are working',
        clientId: LINKEDIN_CLIENT_ID,
        redirectUri: REDIRECT_URI,
        timestamp: new Date().toISOString()
    });
});

// Step 1: Redirect to LinkedIn OAuth
router.get('/linkedin', (req, res) => {
    console.log('=== LinkedIn OAuth Initiation ===');
    console.log('Request headers:', req.headers);
    console.log('Request query:', req.query);
    
    const state = Math.random().toString(36).substring(7);
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${LINKEDIN_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `scope=${encodeURIComponent('openid profile email')}&` +
        `state=${state}`;
    
    console.log('Redirecting to LinkedIn OAuth:', authUrl);
    console.log('Client ID:', LINKEDIN_CLIENT_ID);
    console.log('Redirect URI:', REDIRECT_URI);
    console.log('Scopes: openid profile email');
    console.log('State:', state);
    
    res.redirect(authUrl);
});

// Step 2: Handle LinkedIn callback
router.get('/linkedin/callback', async (req, res) => {
    console.log('=== LinkedIn OAuth Callback ===');
    console.log('Full callback URL:', req.url);
    console.log('Request headers:', req.headers);
    console.log('Request query:', req.query);
    
    const { code, state, error, error_description } = req.query;
    
    console.log('LinkedIn callback received:', { 
        code: code ? 'PRESENT' : 'MISSING', 
        state, 
        error, 
        error_description 
    });
    
    if (error) {
        console.error('LinkedIn OAuth error:', error);
        console.error('Error description:', error_description);
        return res.redirect('https://syncup-six.vercel.app/#/login?error=linkedin_oauth_failed');
    }
    
    if (!code) {
        console.error('No authorization code received');
        console.error('Available query parameters:', Object.keys(req.query));
        return res.redirect('https://syncup-six.vercel.app/#/login?error=linkedin_oauth_failed');
    }
    
    try {
        // Step 3: Exchange code for access token
        console.log('=== Exchanging Code for Access Token ===');
        console.log('Authorization code:', code.substring(0, 10) + '...');
        
        const tokenRequestBody = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: LINKEDIN_CLIENT_ID,
            client_secret: LINKEDIN_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
        });
        
        console.log('Token request body:', tokenRequestBody.toString());
        
        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenRequestBody,
        });
        
        console.log('Token response status:', tokenResponse.status);
        console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange failed:', tokenResponse.status, errorText);
            return res.redirect('https://syncup-six.vercel.app/#/login?error=linkedin_token_failed');
        }
        
        const tokenData = await tokenResponse.json();
        console.log('Access token received:', !!tokenData.access_token);
        console.log('Token data keys:', Object.keys(tokenData));
        
        // Step 4: Fetch user profile
        console.log('=== Fetching User Profile ===');
        const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
            },
        });
        
        console.log('Profile response status:', profileResponse.status);
        console.log('Profile response headers:', Object.fromEntries(profileResponse.headers.entries()));
        
        if (!profileResponse.ok) {
            const errorText = await profileResponse.text();
            console.error('Profile fetch failed:', profileResponse.status, errorText);
            return res.redirect('https://syncup-six.vercel.app/#/login?error=linkedin_profile_failed');
        }
        
        const profile = await profileResponse.json();
        console.log('LinkedIn profile received:', profile);
        console.log('Profile keys:', Object.keys(profile));
        
        // Step 5: Create or find user
        console.log('=== Creating/Finding User ===');
        let user = await User.findOne({ 
            $or: [
                { providerId: profile.sub, provider: 'linkedin' },
                { email: profile.email }
            ]
        });
        
        if (!user) {
            console.log('Creating new LinkedIn user...');
            try {
                user = await User.create({
                    provider: 'linkedin',
                    providerId: profile.sub,
                    name: profile.name || profile.given_name + ' ' + profile.family_name || 'LinkedIn User',
                    email: profile.email || `linkedin_${profile.sub}@syncup.local`,
                    avatarUrl: profile.picture || 'https://i.pravatar.cc/150',
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
                console.log('New user created:', user.name);
            } catch (createError) {
                console.log('User creation failed, trying to find existing user by email...');
                user = await User.findOne({ email: profile.email });
                if (!user) {
                    throw createError;
                }
                console.log('Found existing user by email:', user.name);
            }
        } else {
            console.log('Existing user found:', user.name);
        }
        
        // Step 6: Create JWT token and redirect
        console.log('=== Creating JWT Token ===');
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            provider: user.provider,
            codename: user.codename || 'Dev_' + Math.random().toString(36).substr(2, 6),
            badges: user.badges || ['New Developer'],
            traits: user.traits || ['Eager Learner'],
            trustLevel: user.trustLevel || 75,
            profileRating: user.profileRating || 80,
            devDna: user.devDna || {
                topLanguages: [
                    { lang: 'JavaScript', value: 40 },
                    { lang: 'Python', value: 30 },
                    { lang: 'HTML/CSS', value: 30 }
                ],
                commitFrequency: 5,
                starCount: 10
            }
        };
        
        const token = jwt.sign(payload, 'syncup_jwt_secret_key_2024', { expiresIn: '1d' });
        
        console.log('LinkedIn OAuth successful for user:', user.name);
        const redirectUrl = `https://syncup-six.vercel.app/#/auth/callback?token=${encodeURIComponent(token)}`;
        console.log('Redirecting to:', redirectUrl);
        console.log('=== LinkedIn OAuth Complete ===');
        
        res.redirect(redirectUrl);
        
    } catch (error) {
        console.error('=== LinkedIn OAuth Error ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.redirect('https://syncup-six.vercel.app/#/login?error=linkedin_oauth_failed');
    }
});

export default router;

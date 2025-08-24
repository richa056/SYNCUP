
import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

const createTokenAndRedirect = (req, res) => {
    const payload = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl,
        provider: req.user.provider,
        // Add required fields for DeveloperProfile
        codename: req.user.codename || 'Dev_' + Math.random().toString(36).substr(2, 6),
        badges: req.user.badges || ['New Developer'],
        traits: req.user.traits || ['Eager Learner'],
        trustLevel: req.user.trustLevel || 75,
        profileRating: req.user.profileRating || 80,
        devDna: req.user.devDna || {
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

    console.log('OAuth successful for user:', req.user.name);
    console.log('Redirecting to frontend with token...');

    // Use default redirect URL since we're not using state
    const redirectUrl = `http://localhost:5173/#/auth/callback?token=${encodeURIComponent(token)}`;
    
    console.log('Final redirect URL:', redirectUrl);
    res.redirect(redirectUrl);
};

// GitHub Auth (pass frontend redirect as OAuth state)
router.get('/github', (req, res, next) => {
    const state = req.query.redirect || 'http://localhost:5173/#/auth/callback';
    return passport.authenticate('github', { scope: ['user:email'], state })(req, res, next);
});
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login/failed', session: false }), createTokenAndRedirect);

// Google Auth (pass frontend redirect as OAuth state)
router.get('/google', (req, res, next) => {
    const state = req.query.redirect || 'http://localhost:5173/#/auth/callback';
    return passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login/failed', session: false }), createTokenAndRedirect);

// LinkedIn Auth - DISABLED - Using custom implementation in linkedin-auth.js
// router.get('/linkedin', (req, res, next) => {
//     const redirectUrl = req.query.redirect || 'http://localhost:5173/#/auth/callback';
//     console.log('LinkedIn OAuth initiated with redirect:', redirectUrl);
//     console.log('LinkedIn OAuth request headers:', req.headers);
//     return passport.authenticate('linkedin')(req, res, next);
// });
// router.get('/linkedin/callback', (req, res, next) => {
//     console.log('LinkedIn callback received with query:', req.query);
//     console.log('LinkedIn callback URL:', req.url);
//     console.log('LinkedIn callback headers:', req.headers);
//     
//     passport.authenticate('linkedin', { 
//         failureRedirect: '/login/failed', 
//         session: false,
//         failWithError: true
//     })(req, res, next);
// }, createTokenAndRedirect);

// Handle LinkedIn OAuth errors specifically
// router.get('/linkedin/error', (req, res) => {
//     const error = req.query.error;
//     const errorDescription = req.query.error_description;
//     
//     console.error('LinkedIn OAuth error:', error, errorDescription);
//     
//     // Redirect to frontend with error information
//     const frontendUrl = 'http://localhost:5173/#/login?error=linkedin_oauth_failed';
//     res.redirect(frontendUrl);
// });

router.get('/login/failed', (req, res) => {
    res.status(401).json({
        success: false,
        message: 'failure',
    });
});

router.get('/logout', (req, res) => {
    // In a stateless JWT setup, logout is handled client-side by deleting the token.
    // This endpoint can be used if there's any server-side cleanup needed in the future.
    res.json({ success: true, message: 'logout handled by client' });
});

export default router;

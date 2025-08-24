import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Removed MOCK_USER_PROFILE import - using real user data
import { useProfileBuilder } from '../context/ProfileBuilderContext';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { setCompanionMessage } = useProfileBuilder();
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Prevent multiple processing
    if (hasProcessed) {
      return;
    }
    
    setHasProcessed(true);
    
    const processAuth = async () => {
      const token = searchParams.get('token');
      
      if (token) {
        try {
          console.log('Processing token:', token.substring(0, 20) + '...');
          
          // Decode JWT (base64url-safe)
          const base64Url = token.split('.')[1] || '';
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
          const payload = JSON.parse(atob(padded));
          
          console.log('Decoded payload:', payload);
          
          // Persist the auth token so AuthContext can validate session presence
          localStorage.setItem('syncup_auth_token', token);
          
          // Build a valid DeveloperProfile from token data
          const user = {
            id: String(payload.id || 'user_' + Date.now()),
            name: payload.name || 'Anonymous Developer',
            avatarUrl: payload.avatarUrl || 'https://via.placeholder.com/150',
            codename: payload.codename || 'CodeCraft',
            badges: payload.badges || ['New Developer'],
            traits: payload.traits || ['Eager Learner'],
            trustLevel: payload.trustLevel || 75,
            profileRating: payload.profileRating || 4.0,
            devDna: payload.devDna || {
              topLanguages: [
                { lang: 'JavaScript', value: 40 },
                { lang: 'Python', value: 30 },
                { lang: 'HTML/CSS', value: 30 }
              ],
              commitFrequency: 5,
              starCount: 10
            },
          };
          
          // Store user data immediately in localStorage
          localStorage.setItem('syncup_current_user', JSON.stringify(user));
          
          // Set companion message
          setCompanionMessage("Welcome! Let's start with a few quick questions to understand your developer style.");
          
          const provider = (payload.provider || 'github').toLowerCase();
          
          // Login the user first with callback to navigate after state is set
          login(user, () => {
            console.log('AuthCallback: Login complete, navigating to onboarding');
            // Navigate to onboarding after authentication state is set
            navigate(`/onboarding?provider=${provider}`, { replace: true });
          });
          
        } catch (err) {
          console.error('Auth callback decode error:', err);
          navigate('/');
        }
      } else {
        console.error('No token received');
        navigate('/');
      }
    };

    processAuth();
  }, [searchParams, login, navigate, setCompanionMessage, hasProcessed]);

  // No loading screen - just return null while processing
  return null;
};

export default AuthCallback;

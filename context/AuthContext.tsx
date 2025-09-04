
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeveloperProfile } from '../types';

export type User = DeveloperProfile;

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, callback?: () => void) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'syncup_current_user';
const AUTH_TOKEN_KEY = 'syncup_auth_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (storedUser && token) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        console.log('AuthContext: Loaded user from storage:', user.name);
      } else {
        console.log('AuthContext: No stored user data found');
      }
    } catch (error) {
      console.error("Failed to load user from storage", error);
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } finally {
      setIsLoading(false);
      console.log('AuthContext: Loading complete, isAuthenticated:', isAuthenticated);
    }
  }, []);

  const login = (user: User, callback?: () => void) => {
    // Prevent multiple simultaneous logins
    if (isLoggingIn) {
      console.log('AuthContext: Login already in progress, skipping');
      return;
    }
    
    setIsLoggingIn(true);
    console.log('AuthContext: Logging in user:', user.name);
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    
    // Execute callback after state is set
    if (callback) {
      // Use setTimeout to ensure state update is processed
      setTimeout(() => {
        console.log('AuthContext: Executing login callback');
        callback();
        setIsLoggingIn(false);
      }, 100);
    } else {
      setIsLoggingIn(false);
    }
  };

  // Add a function to check and sync authentication state
  const checkAuthState = () => {
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (storedUser && token) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        console.log('AuthContext: Synced auth state from localStorage');
        return true;
      }
    } catch (error) {
      console.error("Failed to sync auth state", error);
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    // Clear other app data for a full reset
    localStorage.removeItem('syncup_quiz_answers');
    localStorage.removeItem('syncup_meme_reactions');
    localStorage.removeItem('syncup_liked_matches');
    navigate('/');
  };

  // Expose checkAuthState in the context value
  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



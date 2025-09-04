

import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LoginScreen from './pages/LoginScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import MemeCheckScreen from './pages/MemeCheckScreen';
import DashboardScreen from './pages/DashboardScreen';
import ChatScreen from './pages/ChatScreen';
import AuthCallback from './pages/AuthCallback';
import CompanionAvatar from './components/CompanionAvatar';
import TestComponent from './components/TestComponent';

const AnimatedBackground = () => (
  <div className="absolute inset-0 moving-gradient">
    {/* Radial glow accents */}
    <div className="bg-glow-spot top-10 left-10 w-64 h-64 rounded-full bg-brand-primary/40"></div>
    <div className="bg-glow-spot bottom-10 right-10 w-72 h-72 rounded-full bg-brand-secondary/40"></div>
    <div className="bg-glow-spot top-1/3 right-1/4 w-80 h-80 rounded-full bg-brand-accent/40"></div>
    <div className="absolute inset-0 bg-black/30"></div>
  </div>
);

function App() {
  const location = useLocation();

  console.log('App: Rendering with location:', location.pathname);

  return (
    <div className="min-h-screen w-full font-sans overflow-x-hidden relative">
      <AnimatedBackground />
      <CompanionAvatar />

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/" element={<LoginScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/meme-check" element={<MemeCheckScreen />} />
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/chat/:matchId" element={<ChatScreen />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/test" element={<TestComponent />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;

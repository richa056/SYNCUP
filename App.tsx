

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

const SimpleBackground = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <div className="absolute inset-0 bg-black/20"></div>
  </div>
);

function App() {
  const location = useLocation();

  console.log('App: Rendering with location:', location.pathname);

  return (
    <div className="min-h-screen w-full font-sans overflow-x-hidden relative">
      <SimpleBackground />
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

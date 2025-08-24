
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { ChatMessage } from '../types';
import { useAuth } from './AuthContext';

const CONVERSATIONS_STORAGE_KEY = 'syncup_conversations';

// Initial mock conversations, only used if localStorage is empty
const initialConversations: Record<string, ChatMessage[]> = {
  'match_01': [
    { id: `msg-${Date.now()}-1`, text: "Hey! Saw we matched. Your codename is epic.", senderId: 'match_01', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    { id: `msg-${Date.now()}-2`, text: "Haha thanks! Merge Sorcerer sounds pretty cool too.", senderId: 'user_01', timestamp: new Date(Date.now() - 1000 * 60 * 4) },
  ],
  'match_02': [
    { id: `msg-${Date.now()}-3`, text: "GraphQL Guru... I'm intrigued!", senderId: 'match_02', timestamp: new Date(Date.now() - 1000 * 60 * 10) },
  ]
};

const mockReplies = [
    "Wow, that's a cool project! What was the tech stack?",
    "Totally agree! I've been saying that for years.",
    "lol, classic dev problem.",
    "Have you tried the new Bun runtime? It's crazy fast.",
    "I'm more of a Vim person myself, but I respect the VSCode grind.",
    "That's interesting, tell me more.",
];

interface ChatContextType {
  conversations: Record<string, ChatMessage[]>;
  sendMessage: (matchId: string, text: string) => void;
  getConversation: (matchId: string) => ChatMessage[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const storedConvos = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (storedConvos) {
        const parsed = JSON.parse(storedConvos);
        // Ensure timestamps are Date objects
        Object.keys(parsed).forEach(key => {
            parsed[key].forEach((msg: ChatMessage) => {
                msg.timestamp = new Date(msg.timestamp);
            });
        });
        return parsed;
      }
      return initialConversations;
    } catch {
      return initialConversations;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error("Failed to save conversations to localStorage", error);
    }
  }, [conversations]);

  const getConversation = useCallback((matchId: string): ChatMessage[] => {
    return conversations[matchId] || [];
  }, [conversations]);

  const sendMessage = (matchId: string, text: string) => {
    if (!currentUser) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      text,
      senderId: currentUser.id,
      timestamp: new Date(),
    };

    setConversations(prev => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), newMessage],
    }));

    // Mock reply from the match
    setTimeout(() => {
        const replyText = mockReplies[Math.floor(Math.random() * mockReplies.length)];
        const replyMessage: ChatMessage = {
            id: `msg-${Date.now()}-reply`,
            text: replyText,
            senderId: matchId,
            timestamp: new Date(),
        };
         setConversations(prev => ({
            ...prev,
            [matchId]: [...(prev[matchId] || []), replyMessage],
        }));
    }, 1500 + Math.random() * 1000);
  };

  const value = { conversations, sendMessage, getConversation };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

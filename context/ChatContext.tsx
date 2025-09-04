
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { ChatMessage } from '../types';
import { useAuth } from './AuthContext';
import { messagingService } from '../services/messagingService';

const CONVERSATIONS_STORAGE_KEY = 'syncup_conversations';

const buildConversationId = (a: string, b: string) => {
  return [a, b].sort().join('::');
};

interface ChatContextType {
  conversations: Record<string, ChatMessage[]>;
  sendMessage: (peerUserId: string, text: string) => Promise<void>;
  getConversation: (peerUserId: string) => ChatMessage[];
  addIncomingMessage: (peerUserId: string, message: ChatMessage) => void;
  subscribeToConversation: (peerUserId: string) => () => void;
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
      return {};
    } catch {
      return {};
    }
  });

  // Connect to messaging service when user is available
  useEffect(() => {
    if (currentUser?.id) {
      messagingService.connect(currentUser.id);
      
      // Cleanup on unmount
      return () => {
        messagingService.disconnect();
      };
    }
  }, [currentUser?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error("Failed to save conversations to localStorage", error);
    }
  }, [conversations]);

  const getConversation = useCallback((peerUserId: string): ChatMessage[] => {
    if (!currentUser?.id) return [];
    const convId = buildConversationId(currentUser.id, peerUserId);
    return conversations[convId] || [];
  }, [conversations, currentUser?.id]);

  const sendMessage = async (peerUserId: string, text: string) => {
    if (!currentUser?.id || !text.trim()) return;

    const convId = buildConversationId(currentUser.id, peerUserId);

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text: text.trim(),
      senderId: currentUser.id,
      timestamp: new Date(),
    } as ChatMessage;

    // Optimistic local append
    setConversations(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMessage],
    }));

    // Send via messaging service
    const ok = await messagingService.sendMessage(convId, peerUserId, text.trim(), currentUser.id);
    if (!ok) {
      console.warn('Message not delivered to server; retained locally');
    }
  };

  const addIncomingMessage = (peerUserId: string, message: ChatMessage) => {
    if (!currentUser?.id) return;
    const convId = buildConversationId(currentUser.id, peerUserId);
    setConversations(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), message],
    }));
  };

  // Subscribe to server events for this peer; returns an unsubscribe function
  const subscribeToConversation = (peerUserId: string) => {
    if (!currentUser?.id) return () => {};
    const convId = buildConversationId(currentUser.id, peerUserId);

    const handler = (message: ChatMessage) => {
      addIncomingMessage(peerUserId, message);
    };

    messagingService.onMessage(convId, handler);
    return () => messagingService.offMessage(convId);
  };

  const value = { 
    conversations, 
    sendMessage, 
    getConversation, 
    addIncomingMessage,
    subscribeToConversation
  };

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



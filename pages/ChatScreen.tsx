import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfileBuilder } from '../context/ProfileBuilderContext';
import { Send, ArrowLeft, User, MessageCircle } from 'lucide-react';
import { messagingService } from '../services/messagingService';
import { apiCall } from '../utils/api';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface ChatScreenProps {
  // Add any props if needed
}

const buildConversationId = (a: string, b: string) => [a, b].sort().join('::');

const ChatScreen: React.FC<ChatScreenProps> = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { analyzedMatches, mutualConnections, manualRefreshConnections } = useProfileBuilder();
  
  // Refresh connection state when component loads
  useEffect(() => {
    if (currentUser?.id) {
      console.log('🔍 ChatScreen: refreshing connections on load');
      manualRefreshConnections();
    }
  }, [currentUser?.id, manualRefreshConnections]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  
  // Find the profile we're chatting with (may not be in analyzedMatches after actions)
  const [fallbackProfile, setFallbackProfile] = useState<any | null>(null);
  const otherProfile = analyzedMatches.find(profile => profile.id === matchId) || fallbackProfile;
  
  // Check if we have a mutual connection
  const hasMutualConnection = mutualConnections.has(matchId || '');
  
  // If we have a mutual connection but no profile in buffer, fetch minimal public profile
  useEffect(() => {
    const fetchPublicProfileIfNeeded = async () => {
      if (!matchId || !hasMutualConnection) return;
      if (otherProfile) return;
      try {
        const res = await apiCall(`/api/users/public/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          setFallbackProfile({ ...data, id: data.id || data._id });
        }
      } catch {}
    };
    fetchPublicProfileIfNeeded();
  }, [matchId, hasMutualConnection, otherProfile]);

  // Establish SSE connection and subscribe to this conversation
  useEffect(() => {
    if (!currentUser?.id || !matchId || !hasMutualConnection) return;

    // Ensure SSE is connected for this user
    messagingService.connect(currentUser.id);

    const convId = buildConversationId(currentUser.id, matchId);

    // Load server-side history once
    (async () => {
      const history = await messagingService.getConversationHistory(convId, 200);
      if (history.length > 0) {
        const normalized = history.map((h: any) => ({
          id: h.id,
          senderId: h.senderId,
          receiverId: h.senderId === currentUser.id ? matchId : currentUser.id,
          content: h.text,
          timestamp: new Date(h.timestamp),
          isRead: true
        }));
        // mark seen ids to avoid duplicates later
        normalized.forEach(n => seenIdsRef.current.add(n.id));
        setMessages(prev => {
          const existing = new Map(prev.map((m: Message) => [m.id, m]));
          normalized.forEach((n: Message) => existing.set(n.id, n));
          return Array.from(existing.values()).sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime());
        });
      }
    })();

    const handler = (incoming: any) => {
      // Ignore own messages (sender renders optimistically)
      if (incoming.senderId === currentUser.id) return;
      if (seenIdsRef.current.has(incoming.id)) return;
      seenIdsRef.current.add(incoming.id);

      const msg: Message = {
        id: incoming.id,
        senderId: incoming.senderId,
        receiverId: incoming.senderId === currentUser.id ? matchId : currentUser.id,
        content: incoming.text,
        timestamp: new Date(incoming.timestamp),
        isRead: true
      };
      setMessages(prev => [...prev, msg]);
    };

    messagingService.onMessage(convId, handler);
    return () => messagingService.offMessage(convId);
  }, [currentUser?.id, matchId, hasMutualConnection]);
  
  useEffect(() => {
    if (!matchId || !hasMutualConnection) {
      navigate('/dashboard');
      return;
    }
    
    // Load chat history from localStorage
    const chatKey = `chat_${currentUser?.id}_${matchId}`;
    const storedMessages = localStorage.getItem(chatKey);
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        // Seed seen ids to avoid double-render
        parsedMessages.forEach((m: any) => {
          if (m.id) seenIdsRef.current.add(m.id);
        });
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
    
    const typingInterval = setInterval(() => {
      if (Math.random() < 0.08) {
        setOtherUserTyping(true);
        setTimeout(() => setOtherUserTyping(false), 2000 + Math.random() * 2000);
      }
    }, 6000);
    
    return () => clearInterval(typingInterval);
  }, [matchId, hasMutualConnection, currentUser?.id, navigate]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (currentUser?.id && matchId) {
      const chatKey = `chat_${currentUser.id}_${matchId}`;
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
  }, [messages, currentUser?.id, matchId]);
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !matchId || !currentUser?.id) return;
    
    const message: Message = {
      id: `local-${Date.now()}-${Math.random()}`,
      senderId: currentUser.id,
      receiverId: matchId,
      content: newMessage.trim(),
      timestamp: new Date(),
      isRead: false
    };
    // Mark this id as seen to avoid accidental duplicates
    seenIdsRef.current.add(message.id);
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    const convId = buildConversationId(currentUser.id, matchId);
    await messagingService.sendMessage(convId, matchId, message.content, currentUser.id);
    
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 900);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  if (!hasMutualConnection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Connection Required</h1>
          <p className="mb-6">You need to have a mutual connection to chat with this developer.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-3">
            <img
              src={otherProfile.avatarUrl}
              alt={otherProfile.name}
              className="w-10 h-10 rounded-full border-2 border-white/20"
            />
            <div>
              <h1 className="text-white font-semibold">{otherProfile.name}</h1>
              <p className="text-white/70 text-sm">{otherProfile.codename}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
        {messages.length === 0 ? (
          <div className="text-center text-white/70 py-8">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Start a conversation with {otherProfile.name}!</p>
            <p className="text-sm">Send the first message to begin chatting.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUser?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-blue-200' : 'text-white/50'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicators */}
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-white/20 text-white px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {isTyping && (
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-white/20 text-white placeholder-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;

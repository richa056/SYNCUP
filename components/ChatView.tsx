import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { DeveloperProfile } from '../types';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

interface ChatViewProps {
  match: DeveloperProfile;
  onBack: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0, x: 300 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 25, stiffness: 180 } },
  exit: { opacity: 0, x: -300, transition: { duration: 0.2 } }
};

const ChatView: React.FC<ChatViewProps> = ({ match, onBack }) => {
  const { getConversation, sendMessage } = useChat();
  const { currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messages = getConversation(match.id);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(match.id, newMessage.trim());
      setNewMessage('');
    }
  };

  if (!currentUser) return null; // Should not happen if routed correctly

  return (
    <motion.div
      key="chat-view"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-brand-surface/80 backdrop-blur-sm rounded-3xl h-[calc(100vh-4rem)] flex flex-col text-shadow-sm shadow-black/20"
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-brand-primary/20 flex-shrink-0">
        <motion.button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-brand-primary/20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft size={24} />
        </motion.button>
        <img src={match.avatarUrl} alt={match.name} className="w-12 h-12 rounded-full" />
        <div>
          <h3 className="font-bold text-lg">{match.name}</h3>
          <p className="text-sm text-brand-text-secondary">"{match.codename}"</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className={`flex items-end gap-2 my-3 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              {msg.senderId !== currentUser.id && <img src={match.avatarUrl} className="w-6 h-6 rounded-full self-start"/> }
              <div
                className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.senderId === currentUser.id
                  ? 'bg-brand-primary text-white rounded-br-none'
                  : 'bg-brand-surface-darker rounded-bl-none'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </motion.div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-brand-primary/20 flex items-center gap-3 flex-shrink-0">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Message ${match.name}...`}
          className="flex-1 bg-brand-bg px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all"
          autoComplete="off"
        />
        <motion.button
          type="submit"
          className="bg-brand-secondary p-3 rounded-full text-white disabled:bg-gray-600"
          disabled={!newMessage.trim()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Send size={20} />
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ChatView;
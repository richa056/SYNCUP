import { ChatMessage } from '../types';

class MessagingService {
  private eventSource: EventSource | null = null;
  private messageCallbacks: Map<string, (message: ChatMessage) => void> = new Map();
  private isConnected = false;

  connect(userId: string) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource(`/api/messaging/stream/${userId}`);
      
      this.eventSource.onopen = () => {
        this.isConnected = true;
      };
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message') {
            const message: ChatMessage = {
              id: data.message.id,
              text: data.message.text,
              senderId: data.message.senderId,
              timestamp: new Date(data.message.timestamp)
            };
            const callback = this.messageCallbacks.get(data.conversationId);
            if (callback) callback(message);
          }
        } catch {}
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        setTimeout(() => this.connect(userId), 5000);
      };
    } catch {
      this.isConnected = false;
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }

  onMessage(conversationId: string, callback: (message: ChatMessage) => void) {
    this.messageCallbacks.set(conversationId, callback);
  }

  offMessage(conversationId: string) {
    this.messageCallbacks.delete(conversationId);
  }

  async sendMessage(conversationId: string, receiverId: string, text: string, senderId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, receiverId, text, senderId, timestamp: new Date().toISOString() }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getConversationHistory(conversationId: string, limit = 200): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`/api/messaging/conversation/${conversationId}?limit=${limit}`);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.messages || []).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {
      return [];
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const messagingService = new MessagingService();

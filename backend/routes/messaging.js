import express from 'express';
import User from '../models/User.js';
import Message from '../models/Message.js';

const router = express.Router();

// Store active connections for real-time messaging
const activeConnections = new Map();
const messageQueue = new Map();

// Server-Sent Events endpoint for real-time messaging
router.get('/stream/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  activeConnections.set(userId, res);
  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

  if (messageQueue.has(userId)) {
    const messages = messageQueue.get(userId);
    messages.forEach(msg => {
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
    });
    messageQueue.delete(userId);
  }

  req.on('close', () => {
    activeConnections.delete(userId);
  });

  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
  }, 30000);

  req.on('close', () => clearInterval(keepAlive));
});

// Send message endpoint
router.post('/send', async (req, res) => {
  try {
    const { conversationId, receiverId, text, timestamp, senderId } = req.body;
    if (!conversationId || !receiverId || !text || !timestamp || !senderId) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const messageDoc = await Message.create({
      conversationId,
      senderId,
      receiverId,
      text,
      timestamp
    });

    const payload = {
      id: String(messageDoc._id),
      text: messageDoc.text,
      senderId: messageDoc.senderId,
      timestamp: messageDoc.timestamp
    };

    const deliver = (userId) => {
      const conn = activeConnections.get(userId);
      if (conn) {
        conn.write(`data: ${JSON.stringify({ type: 'message', message: payload, conversationId })}\n\n`);
      } else {
        if (!messageQueue.has(userId)) messageQueue.set(userId, []);
        messageQueue.get(userId).push({ type: 'message', message: payload, conversationId });
      }
    };

    // Deliver only to receiver. Sender renders optimistically.
    deliver(receiverId);

    res.json({ success: true, messageId: String(messageDoc._id) });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversation history
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    const docs = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .limit(limit)
      .lean();

    const messages = docs.map(d => ({
      id: String(d._id),
      text: d.text,
      senderId: d.senderId,
      timestamp: d.timestamp
    }));

    res.json({ messages });
  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
});

export default router;

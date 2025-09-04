import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, index: true, required: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: false });

MessageSchema.index({ conversationId: 1, timestamp: 1 });

export default mongoose.model('Message', MessageSchema);

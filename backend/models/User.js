
import mongoose from 'mongoose';

const DevDnaSchema = new mongoose.Schema({
    topLanguages: [{ lang: String, value: Number }],
    commitFrequency: { type: Number, default: 0 },
    starCount: { type: Number, default: 0 },
});

const UserSchema = new mongoose.Schema({
    provider: { type: String, required: true, enum: ['github', 'google', 'linkedin'] },
    providerId: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    
    // Developer Profile fields - no mock defaults
    codename: { type: String }, // Will be generated from quiz answers
    badges: { type: [String] }, // Will be generated from quiz answers
    traits: { type: [String] }, // Will be generated from quiz answers
    trustLevel: { type: Number }, // Will be calculated from real data
    profileRating: { type: Number }, // Will be calculated from real data
    devDna: { type: DevDnaSchema }, // Only real data

    // Onboarding Data
    quizAnswers: { type: mongoose.Schema.Types.Mixed, default: {} },
    memeReactions: [{ memeId: String, reaction: String }],
    profileComplete: { type: Boolean, default: false },
    
    // Connections
    connectionRequestsSent: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    connectionRequestsIncoming: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    mutualConnections: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    passedMatches: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    
    // App Data
    likedMatches: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User'
    },

}, { timestamps: true });

UserSchema.index({ provider: 1, providerId: 1 }, { unique: true });
UserSchema.index({ profileComplete: 1 });
UserSchema.index({ 'memeReactions.memeId': 1 });
// Lightweight index on quizAnswers presence (field exists)
UserSchema.index({ quizAnswers: 1 });

export default mongoose.model('User', UserSchema);

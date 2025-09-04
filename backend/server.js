
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import connectDB from './config/db.js';
import './config/passport.js'; // This will execute the passport configuration
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import linkedinAuthRoutes from './routes/linkedin-auth.js';
import userRoutes from './routes/users.js';
import messagingRoutes from './routes/messaging.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: [
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    // Allow private LAN ranges: 10.0.0.0/8, 172.16.0.0 - 172.31.0.0, 192.168.0.0/16
    /^http:\/\/(10|192\.168|172\.(1[6-9]|2[0-9]|3[0-1]))(\.[0-9]{1,3}){2}(:\d+)?$/
  ],
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api', apiRoutes);
app.use('/auth', linkedinAuthRoutes); // Custom LinkedIn OAuth routes (must come before authRoutes)
app.use('/auth', authRoutes); // Regular auth routes (GitHub, Google)
app.use('/api/users', userRoutes); // User matching and profile routes
app.use('/api/messaging', messagingRoutes); // Real-time messaging routes

app.get('/', (req, res) => {
    res.json({
        status: 'running',
        message: 'SyncUp API is running...',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/auth',
            api: '/api'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

const PORT = 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));

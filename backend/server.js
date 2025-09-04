
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
// CORS: reflect requesting origin to ensure ACAO header is present in all responses
app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (e.g., curl, health checks)
    if (!origin) return callback(null, true);
    const allowed = [
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      /^http:\/\/(10|192\.168|172\.(1[6-9]|2[0-9]|3[0-1]))(\.[0-9]{1,3}){2}(:\d+)?$/,
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/(.*\.)?onrender\.com$/
    ];
    const ok = allowed.some(rx => rx.test(origin));
    return callback(null, ok);
  },
  credentials: false, // we are not sending cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight
app.options('*', cors());
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

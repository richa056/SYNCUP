
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

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: [/^http:\/\/localhost:5173$/, /^http:\/\/localhost:5174$/, /^http:\/\/localhost:5175$/],
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api', apiRoutes);
app.use('/auth', linkedinAuthRoutes); // Custom LinkedIn OAuth routes (must come before authRoutes)
app.use('/auth', authRoutes); // Regular auth routes (GitHub, Google)
app.use('/api/users', userRoutes); // User matching and profile routes

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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

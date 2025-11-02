import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/database.js';
import './config/passport.js';
import authRoutes from './routes/auth.js';
import adminAuthRoutes from './routes/adminAuth.js';
import teamMembersRoutes from './routes/teamMembers.js';
import freelancersRoutes from './routes/freelancers.js';
import mentorsRoutes from './routes/mentors.js';
import enrollmentsRoutes from './routes/enrollments.js';
import notificationsRoutes from './routes/notifications.js';
import courseRenewalRoutes from './routes/courseRenewal.js';
import { checkRenewals } from './utils/renewalCheck.js';

dotenv.config();

// Connect to database
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/uploads', express.static(join(__dirname, 'public', 'uploads')));

// CORS configuration - Allow multiple origins
const defaultOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:8080', // Admin panel dev
  'http://localhost:3000', // Alternative dev port
];

// Parse FRONTEND_URL environment variable (comma-separated list)
const allowedOrigins = process.env.FRONTEND_URL 
  ? [
      ...process.env.FRONTEND_URL.split(',').map(url => url.trim()),
      ...defaultOrigins // Always include localhost for development
    ]
  : defaultOrigins;

// Log allowed origins in production for debugging
if (process.env.NODE_ENV === 'production') {
  console.log('Allowed CORS origins:', allowedOrigins);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // Check against allowed origins (case-insensitive comparison of hostname)
    const originUrl = new URL(origin);
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('localhost')) {
        return originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1';
      }
      try {
        const allowedUrl = new URL(allowedOrigin);
        return originUrl.origin === allowedUrl.origin;
      } catch {
        return origin === allowedOrigin;
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed origins:`, allowedOrigins);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/team-members', teamMembersRoutes);
app.use('/api/freelancers', freelancersRoutes);
app.use('/api/mentors', mentorsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/course-renewal', courseRenewalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Schedule renewal check to run every hour
  setInterval(async () => {
    await checkRenewals();
  }, 60 * 60 * 1000); // 1 hour in milliseconds
  
  // Also run once on startup
  checkRenewals();
});


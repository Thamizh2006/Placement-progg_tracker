import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';

import adminRoutes from './routes/adminRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import authRoutes from './routes/authRoutes.js';
import doubtRoutes from './routes/doubtRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import hodRoutes from './routes/hodRoutes.js';
import { createRateLimiter } from './middleware/rateLimitMiddleware.js';
import { applySecurityHeaders } from './middleware/securityMiddleware.js';
import progressRoutes from './routes/progressRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import testRoutes from './routes/testRoutes.js';
import { startExecutionProcessor } from './utils/executionQueue.js';

dotenv.config();

const app = express();
const isDatabaseReady = () => mongoose.connection.readyState === 1;
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

mongoose.set('strictQuery', false);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (!isProduction && allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS blocked for this origin'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());
app.use(applySecurityHeaders);
app.use('/uploads', express.static(path.resolve(process.cwd(), 'backend', 'uploads')));

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 12,
  keyPrefix: 'auth',
  message: 'Too many auth requests. Please wait a few minutes and try again.',
});

app.get('/api/health', (_req, res) => {
  const databaseReady = isDatabaseReady();

  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'degraded',
    database: databaseReady ? 'connected' : 'disconnected',
  });
});

app.get('/api', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'API running' });
});

app.get('/', (_req, res) => {
  res.status(200).type('text/plain').send('API running');
});

app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

app.use('/api', (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }

  if (!isDatabaseReady()) {
    return res.status(503).json({
      message: 'Database unavailable. Check MONGO_URI and try again.',
    });
  }

  next();
});

app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/doubt', doubtRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/tests', testRoutes);

console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');

if (isProduction && allowedOrigins.length === 0) {
  console.warn(
    'No FRONTEND_URL or ALLOWED_ORIGINS configured. Browser requests may be blocked by CORS.'
  );
}

mongoose
  .connect(process.env.MONGO_URI?.trim())
  .then(() => {
    console.log('MongoDB connected');
    startExecutionProcessor();
  })
  .catch((error) => {
    console.error('DB error:', error.message);
    console.error('Authentication APIs require a reachable MongoDB instance. Update MONGO_URI and redeploy.');
  });

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB runtime error:', error.message);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

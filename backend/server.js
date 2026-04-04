import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

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

mongoose.set('strictQuery', false);

app.use(cors());
app.use(express.json());
app.use(applySecurityHeaders);

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

app.use('/api', (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }

  if (!isDatabaseReady()) {
    return res.status(503).json({
      message: 'Database unavailable. Start MongoDB and try again.',
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

mongoose
  .connect(process.env.MONGO_URI?.trim())
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((error) => {
    console.error('DB error:', error.message);
    console.error(
      'Authentication APIs require MongoDB. Start MongoDB on 127.0.0.1:27017 or update MONGO_URI in .env.'
    );
  });

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB runtime error:', error.message);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startExecutionProcessor();
});

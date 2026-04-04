import express from 'express';
import {
  register,
  login,
  deleteAccount,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';

import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.post('/logout', protect, logout);

router.delete('/delete-me', protect, deleteAccount);

router.delete('/delete-user/:userId', protect, deleteAccount);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;

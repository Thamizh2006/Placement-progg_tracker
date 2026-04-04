import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import Progress from '../models/progressModel.js';
import User from '../models/userModel.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const sanitizeUser = (user) => ({
  _id: user._id,
  email: user.email,
  role: user.role,
  department: user.department || null,
  selectedCategory: user.selectedCategory || null,
  assignedFaculty: user.assignedFaculty || null,
  createdAt: user.createdAt,
});

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const validatePasswordStrength = (password = '') => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  return hasMinLength && hasUppercase && hasLowercase && hasNumber;
};

/* ===========================
   REGISTER
=========================== */
export const register = async (req, res) => {
  try {
    const { password, role, department } = req.body;
    const email = normalizeEmail(req.body.email);

    const allowedRoles = ['student', 'faculty', 'hod', 'placement', 'superadmin'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    if (['student', 'faculty', 'hod'].includes(role) && !department) {
      return res.status(400).json({ message: 'Department is required for this role' });
    }

    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        message: 'Password must be 8+ characters with uppercase, lowercase, and a number',
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      department: department || null,
    });

    res.status(201).json({
      message: `${role} registered successfully`,
      user: sanitizeUser(user),
    });

    await logAuditEvent({
      req,
      actor: user,
      action: 'register',
      entityType: 'user',
      entityId: user._id.toString(),
      description: `${user.email} registered as ${user.role}`,
      metadata: { department: user.department },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   LOGIN
=========================== */
export const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: `${email} not found` });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: `Logged in as ${user.role} successfully`,
      token,
      role: user.role,
      user: sanitizeUser(user),
    });

    await logAuditEvent({
      req,
      actor: user,
      action: 'login',
      entityType: 'user',
      entityId: user._id.toString(),
      description: `${user.email} signed in`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   LOGOUT
=========================== */
export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.status(200).json({ message: 'Logged out successfully' });

    await logAuditEvent({
      req,
      actor: req.user,
      action: 'logout',
      entityType: 'user',
      entityId: req.user._id.toString(),
      description: `${req.user.email} signed out`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   DELETE ACCOUNT
=========================== */
export const deleteAccount = async (req, res) => {
  try {
    let targetUserId = req.user._id;

    if (req.params.userId) {
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Only superadmin can delete other users' });
      }
      targetUserId = req.params.userId;
    }

    const user = await User.findByIdAndDelete(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Progress.deleteMany({ student: targetUserId });

    res.status(200).json({ message: 'User deleted successfully' });

    await logAuditEvent({
      req,
      actor: req.user,
      action: 'delete-account',
      entityType: 'user',
      entityId: targetUserId.toString(),
      description: `${req.user.email} deleted user ${targetUserId}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   RESET PASSWORD
=========================== */
export const resetPassword = async (req, res) => {
  try {
    const resetToken = req.params.token;
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   FORGOT PASSWORD
=========================== */
export const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const appBaseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const resetUrl = `${appBaseUrl}/api/auth/reset-password/${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset',
      html: `
        <h3>Password Reset</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
    });

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

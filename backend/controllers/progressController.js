import User from '../models/userModel.js';
import Progress from '../models/progressModel.js';
import Category from '../models/categoryModel.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import Doubt from '../models/doubtModel.js';
import Report from '../models/reportModel.js';
import { calculateReadiness } from '../utils/intelligenceEngine.js';
import { createNotification } from '../utils/notificationService.js';

export const getCategories = async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const selectCategory = async (req, res) => {
  try {
    const { category } = req.body;

    const validCategory = await Category.findOne({ name: category });
    if (!validCategory) {
      return res.status(404).json({ message: 'Invalid category' });
    }

    let progress = await Progress.findOne({
      student: req.user._id,
    });

    if (progress) {
      progress.category = category;
      progress.completedTasks = [];
      progress.progressPercentage = 0;
      progress.eligible = false;
      await progress.save();

      await User.findByIdAndUpdate(req.user._id, {
        selectedCategory: category,
      });

      await logAuditEvent({
        req,
        actor: req.user,
        action: 'select-category',
        entityType: 'progress',
        entityId: progress._id.toString(),
        description: `${req.user.email} updated category to ${category}`,
        metadata: { category, studentId: req.user._id.toString() },
      });

      return res.json({
        message: 'Category updated successfully',
        progress,
      });
    }

    progress = await Progress.create({
      student: req.user._id,
      category,
      completedTasks: [],
      progressPercentage: 0,
      eligible: false,
    });

    await User.findByIdAndUpdate(req.user._id, {
      selectedCategory: category,
    });

    res.status(201).json(progress);

    await logAuditEvent({
      req,
      actor: req.user,
      action: 'select-category',
      entityType: 'progress',
      entityId: progress._id.toString(),
      description: `${req.user.email} selected category ${category}`,
      metadata: { category, studentId: req.user._id.toString() },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkEligibility = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      student: req.user._id,
    });

    if (!progress) {
      return res.status(404).json({
        message: 'No progress found',
      });
    }

    const category = await Category.findOne({
      name: progress.category,
    });

    if (!category) {
      return res.status(404).json({
        message: 'Category not found',
      });
    }

    // Calculate total tasks dynamically
    const totalTasks = category.rows.reduce((sum, row) => sum + row.tasks.length, 0);

    const completedTasks = progress.completedTasks.length;

    const percentage = totalTasks === 0 ? 0 : ((completedTasks / totalTasks) * 100).toFixed(2);

    // Eligibility rule
    const eligible = percentage >= 75;

    res.status(200).json({
      category: progress.category,
      completedTasks,
      totalTasks,
      percentage: Number(percentage),
      eligible,
      message: eligible ? 'Eligible for placement' : 'Not eligible yet',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: UPDATE TASK WITH PROOF
=========================== */
export const updateTask = async (req, res) => {
  try {
    const { rowTitle, taskName, proofUrl, proofType } = req.body;

    if (!rowTitle || !taskName) {
      return res.status(400).json({
        message: 'rowTitle and taskName are required',
      });
    }

    // Validate proofType if provided
    if (proofType && !['screenshot', 'document'].includes(proofType)) {
      return res.status(400).json({
        message: "proofType must be either 'screenshot' or 'document'",
      });
    }

    const progress = await Progress.findOne({
      student: req.user._id,
    });

    if (!progress) {
      return res.status(404).json({
        message: 'Select category first',
      });
    }

    // Prevent duplicate
    const exists = progress.completedTasks.some(
      (t) => t.rowTitle === rowTitle && t.taskName === taskName
    );

    if (exists) {
      return res.status(400).json({
        message: 'Task already completed',
      });
    }

    // Add task with optional proof
    progress.completedTasks.push({
      rowTitle,
      taskName,
      proofUrl: proofUrl || null,
      proofType: proofType || null,
      completedAt: new Date(),
    });

    // Recalculate percentage
    const category = await Category.findOne({
      name: progress.category,
    });

    const totalTasks = category.rows.reduce((sum, row) => sum + row.tasks.length, 0);

    const newProgress = Math.round((progress.completedTasks.length / totalTasks) * 100);

    progress.progressPercentage = newProgress;
    progress.eligible = newProgress >= 75;

    await progress.save();

    await createNotification({
      recipient: req.user._id,
      actor: req.user._id,
      type: 'progress-updated',
      title: 'Progress updated',
      message: `${taskName} was marked complete in ${rowTitle}.`,
      link: '/student/progress',
      priority: newProgress >= 75 ? 'high' : 'medium',
      metadata: { rowTitle, taskName, progressPercentage: newProgress },
    });

    res.status(200).json({
      message: 'Task updated successfully',
      progress,
    });

    await logAuditEvent({
      req,
      actor: req.user,
      action: 'complete-task',
      entityType: 'progress-task',
      entityId: progress._id.toString(),
      description: `${req.user.email} completed task ${taskName}`,
      metadata: {
        rowTitle,
        taskName,
        category: progress.category,
        studentId: req.user._id.toString(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: GET OWN PROGRESS
=========================== */
export const getMyProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      student: req.user._id,
    });

    if (!progress) {
      const categories = await Category.find().sort({ name: 1 });
      return res.status(404).json({
        message: 'No progress found',
        categories,
      });
    }

    const category = await Category.findOne({ name: progress.category });

    res.json({
      progress,
      category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllStudentProgress = async (req, res) => {
  try {
    const allProgress = await Progress.find().populate('student', 'email role selectedCategory');

    res.json(allProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReadinessInsights = async (req, res) => {
  try {
    const progress = await Progress.findOne({ student: req.user._id });

    if (!progress) {
      return res.status(404).json({ message: 'No progress found' });
    }

    const [categoryDoc, pendingDoubts, reportCount, student] = await Promise.all([
      Category.findOne({ name: progress.category }),
      Doubt.countDocuments({ student: req.user._id, status: 'pending' }),
      Report.countDocuments({ student: req.user._id }),
      User.findById(req.user._id).select('assignedFaculty'),
    ]);

    const readiness = calculateReadiness({
      progress,
      categoryDoc,
      pendingDoubts,
      mentorAssigned: Boolean(student?.assignedFaculty),
      reportCount,
    });

    res.json({
      category: progress.category,
      progressPercentage: progress.progressPercentage || 0,
      ...readiness,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import User from '../models/userModel.js';
import Doubt from '../models/doubtModel.js';
import Progress from '../models/progressModel.js';
import Category from '../models/categoryModel.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { analyzeWeakAreas, generateDoubtAssistance } from '../utils/intelligenceEngine.js';
import { createNotifications } from '../utils/notificationService.js';

/* ===========================
   STUDENT: ASK DOUBT TO MENTOR
=========================== */
export const askDoubt = async (req, res) => {
  try {
    const { subject, message, taskName, category } = req.body;
    const studentId = req.user._id;

    // Check if student has a mentor assigned
    const student = await User.findById(studentId);

    if (!student.assignedFaculty) {
      return res.status(400).json({
        message: 'Please choose a mentor first before asking doubts',
      });
    }

    const progress = await Progress.findOne({ student: studentId });
    const categoryDoc = progress?.category
      ? await Category.findOne({ name: progress.category })
      : null;
    const weakAreas = analyzeWeakAreas({ categoryDoc, progress }).weakAreas;
    const aiSuggestion = generateDoubtAssistance({
      subject,
      message,
      taskName,
      category,
      weakAreas,
    });

    const doubt = await Doubt.create({
      student: studentId,
      faculty: student.assignedFaculty,
      subject,
      message,
      taskName: taskName || null,
      category: category || null,
      status: 'pending',
      aiSuggestion,
    });

    res.status(201).json({
      message: 'Doubt submitted successfully',
      doubt,
    });

    await logAuditEvent({
      req,
      actor: req.user,
      action: 'ask-doubt',
      entityType: 'doubt',
      entityId: doubt._id.toString(),
      description: `${req.user.email} raised a doubt for mentor review`,
      metadata: {
        subject,
        category: category || null,
        taskName: taskName || null,
        studentId: req.user._id.toString(),
        facultyId: student.assignedFaculty.toString(),
      },
    });

    await createNotifications([
      {
        recipient: req.user._id,
        actor: student.assignedFaculty,
        type: 'doubt-created',
        title: 'Doubt submitted',
        message: `Your doubt "${subject}" was sent to your mentor.`,
        link: '/student/doubts',
        priority: 'medium',
        metadata: { doubtId: doubt._id.toString() },
      },
      {
        recipient: student.assignedFaculty,
        actor: req.user._id,
        type: 'doubt-created',
        title: 'New student doubt',
        message: `${req.user.email} needs help with "${subject}".`,
        link: '/faculty/doubts',
        priority: 'high',
        metadata: { doubtId: doubt._id.toString(), studentId: req.user._id.toString() },
      },
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoubtAssistant = async (req, res) => {
  try {
    const { subject, message, taskName, category } = req.body;
    const progress = await Progress.findOne({ student: req.user._id });
    const categoryDoc = progress?.category
      ? await Category.findOne({ name: progress.category })
      : null;
    const weakAreas = analyzeWeakAreas({ categoryDoc, progress }).weakAreas;

    res.json(
      generateDoubtAssistance({
        subject,
        message,
        taskName,
        category,
        weakAreas,
      })
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: GET MY DOUBTS
=========================== */
export const getMyDoubts = async (req, res) => {
  try {
    const doubts = await Doubt.find({ student: req.user._id })
      .populate('faculty', 'email')
      .sort({ createdAt: -1 });

    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: GET MY DOUBT BY ID
=========================== */
export const getMyDoubtById = async (req, res) => {
  try {
    const { doubtId } = req.params;

    const doubt = await Doubt.findOne({
      _id: doubtId,
      student: req.user._id,
    }).populate('faculty', 'email');

    if (!doubt) {
      return res.status(404).json({
        message: 'Doubt not found',
      });
    }

    res.json(doubt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: GET MY DOUBT THREAD
=========================== */
export const getMyDoubtThread = async (req, res) => {
  try {
    const { doubtId } = req.params;

    const doubt = await Doubt.findOne({
      _id: doubtId,
      student: req.user._id,
    })
      .populate('faculty', 'email department')
      .populate('student', 'email department');

    if (!doubt) {
      return res.status(404).json({
        message: 'Doubt not found',
      });
    }

    res.json(doubt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   FACULTY: GET DOUBTS FROM MY STUDENTS
=========================== */
export const getStudentDoubts = async (req, res) => {
  try {
    const { status } = req.query;

    let query = { faculty: req.user._id };

    if (status) {
      query.status = status;
    }

    const doubts = await Doubt.find(query)
      .populate('student', 'email department selectedCategory')
      .sort({ createdAt: -1 });

    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   FACULTY: RESPOND TO DOUBT
=========================== */
export const respondToDoubt = async (req, res) => {
  try {
    const { doubtId } = req.params;
    const { response } = req.body;

    const doubt = await Doubt.findOne({
      _id: doubtId,
      faculty: req.user._id,
    });

    if (!doubt) {
      return res.status(404).json({
        message: 'Doubt not found or not assigned to you',
      });
    }

    doubt.response = response;
    doubt.responseDate = new Date();
    doubt.status = 'answered';

    await doubt.save();

    res.status(200).json({
      message: 'Response submitted successfully',
      doubt,
    });

    await logAuditEvent({
      req,
      actor: req.user,
      action: 'respond-doubt',
      entityType: 'doubt',
      entityId: doubt._id.toString(),
      description: `${req.user.email} responded to a student doubt`,
      metadata: {
        studentId: doubt.student.toString(),
        facultyId: req.user._id.toString(),
      },
    });

    await createNotifications([
      {
        recipient: doubt.student,
        actor: req.user._id,
        type: 'doubt-answered',
        title: 'Mentor replied to your doubt',
        message: `You received a response for "${doubt.subject}".`,
        link: '/student/doubts',
        priority: 'high',
        metadata: { doubtId: doubt._id.toString() },
      },
      {
        recipient: req.user._id,
        actor: doubt.student,
        type: 'doubt-answered',
        title: 'Doubt resolved',
        message: `Your response for "${doubt.subject}" was sent to the student.`,
        link: '/faculty/doubts',
        priority: 'low',
        metadata: { doubtId: doubt._id.toString() },
      },
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   FACULTY: GET DOUBT COUNT STATS
=========================== */
export const getDoubtStats = async (req, res) => {
  try {
    const totalDoubts = await Doubt.countDocuments({ faculty: req.user._id });
    const pendingDoubts = await Doubt.countDocuments({
      faculty: req.user._id,
      status: 'pending',
    });
    const answeredDoubts = await Doubt.countDocuments({
      faculty: req.user._id,
      status: 'answered',
    });

    res.json({
      totalDoubts,
      pendingDoubts,
      answeredDoubts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   HOD: GET ALL DOUBTS IN DEPARTMENT
=========================== */
export const getDepartmentDoubts = async (req, res) => {
  try {
    const hodDepartment = req.user.department;
    const { status } = req.query;

    // Get all faculty in the department
    const faculty = await User.find({
      role: 'faculty',
      department: hodDepartment,
    }).select('_id');

    const facultyIds = faculty.map((f) => f._id);

    let query = { faculty: { $in: facultyIds } };

    if (status) {
      query.status = status;
    }

    const doubts = await Doubt.find(query)
      .populate('student', 'email department')
      .populate('faculty', 'email')
      .sort({ createdAt: -1 });

    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN/SUPERADMIN: GET ALL DOUBTS
=========================== */
export const getAllDoubts = async (req, res) => {
  try {
    const { status, department } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    let doubts = await Doubt.find(query)
      .populate('student', 'email department')
      .populate('faculty', 'email department')
      .sort({ createdAt: -1 });

    // Filter by department if specified
    if (department) {
      doubts = doubts.filter(
        (d) => d.student?.department === department || d.faculty?.department === department
      );
    }

    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

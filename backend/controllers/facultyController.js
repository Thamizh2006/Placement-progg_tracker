import User from '../models/userModel.js';
import Progress from '../models/progressModel.js';
import Doubt from '../models/doubtModel.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { createNotifications } from '../utils/notificationService.js';

/* ===========================
   FACULTY: GET ASSIGNED STUDENTS
=========================== */
export const getAssignedStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      assignedFaculty: req.user._id,
    }).select('-password');

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   FACULTY: GET STUDENT PROGRESS
=========================== */
export const getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({
      _id: studentId,
      role: 'student',
      assignedFaculty: req.user._id,
    });

    if (!student) {
      return res.status(403).json({
        message: 'Student not assigned to you',
      });
    }

    const progress = await Progress.findOne({
      student: studentId,
    }).populate('student', 'email selectedCategory');

    if (!progress) {
      return res.status(404).json({
        message: 'No progress found for this student',
      });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   FACULTY: GET ALL ASSIGNED STUDENTS PROGRESS
=========================== */
export const getAllAssignedStudentsProgress = async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      assignedFaculty: req.user._id,
    }).select('-password');

    const studentProgress = await Promise.all(
      students.map(async (student) => {
        const progress = await Progress.findOne({
          student: student._id,
        });

        return {
          student: {
            _id: student._id,
            email: student.email,
            selectedCategory: student.selectedCategory,
            department: student.department,
            createdAt: student.createdAt,
          },
          progress: progress || null,
          eligible: progress ? progress.progressPercentage >= 75 : false,
        };
      })
    );

    res.json(studentProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   FACULTY: GET ALL STUDENTS
=========================== */
export const getAllStudents = async (req, res) => {
  try {
    const { department } = req.query;

    let query = { role: 'student' };
    if (department) {
      query.department = department;
    }

    const students = await User.find(query)
      .select('-password')
      .populate('assignedFaculty', 'email');

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   FACULTY: GET DASHBOARD STATS
=========================== */
export const getFacultyDashboard = async (req, res) => {
  try {
    const assignedStudentsCount = await User.countDocuments({
      role: 'student',
      assignedFaculty: req.user._id,
    });

    const totalStudentsCount = await User.countDocuments({
      role: 'student',
    });

    const assignedStudents = await User.find({
      role: 'student',
      assignedFaculty: req.user._id,
    }).select('-password');

    let totalProgress = 0;
    let eligibleCount = 0;

    for (const student of assignedStudents) {
      const progress = await Progress.findOne({
        student: student._id,
      });

      if (progress) {
        totalProgress += progress.progressPercentage;
        if (progress.progressPercentage >= 75) {
          eligibleCount++;
        }
      }
    }

    const averageProgress =
      assignedStudentsCount > 0 ? Math.round(totalProgress / assignedStudentsCount) : 0;

    // Get doubt stats
    const totalDoubts = await Doubt.countDocuments({ faculty: req.user._id });
    const pendingDoubts = await Doubt.countDocuments({
      faculty: req.user._id,
      status: 'pending',
    });

    res.json({
      assignedStudentsCount,
      totalStudentsCount,
      eligibleCount,
      averageProgress,
      pendingCount: assignedStudentsCount - eligibleCount,
      totalDoubts,
      pendingDoubts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   FACULTY: GET MY DOUBTS
=========================== */
export const getMyDoubts = async (req, res) => {
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
   FACULTY: GET DOUBT STATISTICS
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

    // Get recent unanswered doubts
    const recentPendingDoubts = await Doubt.find({
      faculty: req.user._id,
      status: 'pending',
    })
      .populate('student', 'email department')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalDoubts,
      pendingDoubts,
      answeredDoubts,
      recentPendingDoubts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   FACULTY: GET SPECIFIC DOUBT THREAD
=========================== */
export const getDoubtThread = async (req, res) => {
  try {
    const { doubtId } = req.params;

    const doubt = await Doubt.findOne({
      _id: doubtId,
      faculty: req.user._id,
    }).populate('student', 'email department selectedCategory');

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

import User from '../models/userModel.js';
import Progress from '../models/progressModel.js';
import Doubt from '../models/doubtModel.js';
import Report from '../models/reportModel.js';
import Category from '../models/categoryModel.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import {
  analyzeWeakAreas,
  calculateReadiness,
  rankMentors,
} from '../utils/intelligenceEngine.js';
import { createNotifications } from '../utils/notificationService.js';

/* ===========================
   STUDENT: GET ALL AVAILABLE FACULTY
=========================== */
export const getAllFaculty = async (req, res) => {
  try {
    const { department } = req.query;

    let query = { role: 'faculty' };
    if (department) {
      query.department = department;
    }

    const faculty = await User.find(query).select('-password');

    const facultyWithStudentCount = await Promise.all(
      faculty.map(async (f) => {
        const studentCount = await User.countDocuments({
          role: 'student',
          assignedFaculty: f._id,
        });

        return {
          ...f.toObject(),
          assignedStudentsCount: studentCount,
        };
      })
    );

    res.json(facultyWithStudentCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: CHOOSE MENTOR (FACULTY)
=========================== */
export const chooseMentor = async (req, res) => {
  try {
    const { facultyId } = req.body;
    const studentId = req.user._id;

    const faculty = await User.findOne({
      _id: facultyId,
      role: 'faculty',
    });

    if (!faculty) {
      return res.status(404).json({
        message: 'Faculty not found',
      });
    }

    const student = await User.findByIdAndUpdate(
      studentId,
      { assignedFaculty: facultyId },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: `You have successfully chosen ${faculty.email} as your mentor`,
      student: {
        _id: student._id,
        email: student.email,
        assignedFaculty: student.assignedFaculty,
      },
    });

    await logAuditEvent({
      req,
      actor: req.user,
      action: 'choose-mentor',
      entityType: 'mentor',
      entityId: faculty._id.toString(),
      description: `${req.user.email} chose ${faculty.email} as mentor`,
      metadata: {
        studentId: req.user._id.toString(),
        facultyId: faculty._id.toString(),
      },
    });

    await createNotifications([
      {
        recipient: req.user._id,
        actor: faculty._id,
        type: 'mentor-assigned',
        title: 'Mentor assigned',
        message: `${faculty.email} is now your mentor.`,
        link: '/student/mentor',
        priority: 'high',
        metadata: { facultyId: faculty._id.toString() },
      },
      {
        recipient: faculty._id,
        actor: req.user._id,
        type: 'mentor-assigned',
        title: 'New mentee assigned',
        message: `${req.user.email} selected you as mentor.`,
        link: '/faculty/students',
        priority: 'medium',
        metadata: { studentId: req.user._id.toString() },
      },
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: GET CURRENT MENTOR
=========================== */
export const getMyMentor = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .select('assignedFaculty')
      .populate('assignedFaculty', 'email department');

    if (!student.assignedFaculty) {
      return res.status(404).json({
        message: "You haven't chosen a mentor yet",
      });
    }

    res.json({
      mentor: student.assignedFaculty,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: CHANGE MENTOR
=========================== */
export const changeMentor = async (req, res) => {
  try {
    const { facultyId } = req.body;
    const studentId = req.user._id;

    const faculty = await User.findOne({
      _id: facultyId,
      role: 'faculty',
    });

    if (!faculty) {
      return res.status(404).json({
        message: 'Faculty not found',
      });
    }

    const currentStudent = await User.findById(studentId);
    const oldMentor = currentStudent.assignedFaculty;

    const student = await User.findByIdAndUpdate(
      studentId,
      { assignedFaculty: facultyId },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: `You have successfully changed your mentor`,
      oldMentor: oldMentor,
      newMentor: {
        _id: faculty._id,
        email: faculty.email,
      },
    });

    await logAuditEvent({
      req,
      actor: req.user,
      action: 'change-mentor',
      entityType: 'mentor',
      entityId: faculty._id.toString(),
      description: `${req.user.email} changed mentor to ${faculty.email}`,
      metadata: {
        studentId: req.user._id.toString(),
        facultyId: faculty._id.toString(),
        previousFacultyId: oldMentor?.toString?.() || null,
      },
    });

    await createNotifications([
      {
        recipient: req.user._id,
        actor: faculty._id,
        type: 'mentor-changed',
        title: 'Mentor updated',
        message: `${faculty.email} is now assigned as your mentor.`,
        link: '/student/mentor',
        priority: 'high',
        metadata: { facultyId: faculty._id.toString() },
      },
      {
        recipient: faculty._id,
        actor: req.user._id,
        type: 'mentor-assigned',
        title: 'New mentee mapped to you',
        message: `${req.user.email} is now in your mentoring queue.`,
        link: '/faculty/students',
        priority: 'medium',
        metadata: { studentId: req.user._id.toString() },
      },
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: GET MY PROGRESS
=========================== */
export const getMyProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      student: req.user._id,
    }).populate('student', 'email department selectedCategory');

    if (!progress) {
      return res.status(404).json({
        message: 'No progress found. Please select a category first.',
      });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: CHECK ELIGIBILITY
=========================== */
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

    const eligible = progress.progressPercentage >= 75;

    res.json({
      category: progress.category,
      progressPercentage: progress.progressPercentage,
      eligible,
      completedTasks: progress.completedTasks.length,
      message: eligible
        ? 'Congratulations! You are eligible for placement'
        : 'Keep going! You need 75% progress to be eligible',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: GET DASHBOARD DATA
=========================== */
export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Get student with assigned mentor
    const student = await User.findById(studentId)
      .select('email department assignedFaculty')
      .populate('assignedFaculty', 'email department');
    
    // Get progress
    const progress = await Progress.findOne({ student: studentId });
    
    const pendingDoubts = await Doubt.countDocuments({
      student: studentId,
      status: 'pending',
    });

    const reportsReady = await Report.countDocuments({ student: studentId });
    const categoryDoc = progress?.category
      ? await Category.findOne({ name: progress.category })
      : null;
    const readiness = calculateReadiness({
      progress,
      categoryDoc,
      pendingDoubts,
      mentorAssigned: Boolean(student.assignedFaculty),
      reportCount: reportsReady,
    });

    const departmentStudents = await User.find({
      role: 'student',
      department: student.department,
    }).select('_id email');

    const leaderboardProgress = await Progress.find({
      student: { $in: departmentStudents.map((entry) => entry._id) },
    }).select('student progressPercentage');

    const leaderboard = leaderboardProgress
      .map((entry) => {
        const matchedStudent = departmentStudents.find(
          (studentEntry) => String(studentEntry._id) === String(entry.student)
        );

        return {
          studentId: entry.student,
          email: matchedStudent?.email || 'Student',
          progressPercentage: entry.progressPercentage || 0,
        };
      })
      .sort((left, right) => right.progressPercentage - left.progressPercentage)
      .slice(0, 5);
    
    res.json({
      progress: progress?.progressPercentage || 0,
      mentor: student.assignedFaculty
        ? {
            name: student.assignedFaculty.email.split('@')[0],
            email: student.assignedFaculty.email,
            department: student.assignedFaculty.department,
          }
        : null,
      pendingDoubts,
      reportsReady,
      readiness,
      weakAreas: readiness.weakAreas || [],
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMentorRecommendations = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select(
      'department assignedFaculty selectedCategory'
    );
    const progress = await Progress.findOne({ student: req.user._id });
    const categoryName = progress?.category || student?.selectedCategory;
    const categoryDoc = categoryName ? await Category.findOne({ name: categoryName }) : null;

    const faculty = await User.find({
      role: 'faculty',
      department: student.department,
    }).select('-password');

    const facultyIds = faculty.map((member) => member._id);
    const assignedStudents = await User.find({
      role: 'student',
      assignedFaculty: { $in: facultyIds },
    }).select('_id assignedFaculty');

    const progressEntries = await Progress.find({
      student: { $in: assignedStudents.map((entry) => entry._id) },
    }).select('student progressPercentage category completedTasks');

    const facultyStudentsMap = assignedStudents.reduce((map, studentEntry) => {
      const key = String(studentEntry.assignedFaculty);
      const current = map.get(key) || [];
      current.push(studentEntry);
      map.set(key, current);
      return map;
    }, new Map());

    const progressByStudentId = progressEntries.reduce((map, entry) => {
      map.set(String(entry.student), entry);
      return map;
    }, new Map());

    const recommendations = await rankMentors({
      facultyMembers: faculty,
      studentProgress: progress,
      categoryDoc,
      facultyStudentsMap,
      progressByStudentId,
    });

    const weakAreas = analyzeWeakAreas({ categoryDoc, progress }).weakAreas;

    res.json({
      weakAreas,
      recommendedMentorId: recommendations[0]?._id || null,
      recommendations,
      summary: weakAreas.length
        ? `Student is weaker in ${weakAreas
            .slice(0, 2)
            .map((area) => area.label)
            .join(' & ')}. Top mentor suggestions are ranked by current results and faculty load.`
        : 'Mentor ranking is based on current mentee performance and available bandwidth.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

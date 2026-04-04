import User from '../models/userModel.js';
import Progress from '../models/progressModel.js';
import Doubt from '../models/doubtModel.js';
import Report from '../models/reportModel.js';
import Category from '../models/categoryModel.js';
import AuditLog from '../models/auditLogModel.js';
import { calculateReadiness, getAtRiskReason } from '../utils/intelligenceEngine.js';
import { createNotifications } from '../utils/notificationService.js';

/* ===========================
   HOD: ASSIGN STUDENT TO FACULTY
=========================== */
export const assignStudentToFaculty = async (req, res) => {
  try {
    const { studentId, facultyId } = req.body;
    const hodDepartment = req.user.department;

    const student = await User.findOne({
      _id: studentId,
      role: 'student',
      department: hodDepartment,
    });

    if (!student) {
      return res.status(404).json({
        message: 'Student not found in your department',
      });
    }

    const faculty = await User.findOne({
      _id: facultyId,
      role: 'faculty',
      department: hodDepartment,
    });

    if (!faculty) {
      return res.status(404).json({
        message: 'Faculty not found in your department',
      });
    }

    student.assignedFaculty = facultyId;
    await student.save();

    res.status(200).json({
      message: 'Mentor assigned successfully',
      student: student.email,
      mentor: faculty.email,
    });

    await createNotifications([
      {
        recipient: student._id,
        actor: req.user._id,
        type: 'mentor-assigned',
        title: 'Mentor assigned by HoD',
        message: `${faculty.email} was assigned as your mentor.`,
        link: '/student/mentor',
        priority: 'high',
        metadata: { facultyId: faculty._id.toString() },
      },
      {
        recipient: faculty._id,
        actor: req.user._id,
        type: 'mentor-assigned',
        title: 'New mentor assignment',
        message: `${student.email} was assigned to you by HoD.`,
        link: '/faculty/students',
        priority: 'medium',
        metadata: { studentId: student._id.toString() },
      },
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   HOD: GET DASHBOARD
=========================== */
export const getHodDashboard = async (req, res) => {
  try {
    const hodDepartment = req.user.department;

    // Get student counts
    const totalStudents = await User.countDocuments({
      role: 'student',
      department: hodDepartment,
    });

    // Get faculty count
    const facultyCount = await User.countDocuments({
      role: 'faculty',
      department: hodDepartment,
    });

    // Get students with progress
    const students = await User.find({
      role: 'student',
      department: hodDepartment,
    }).select('_id');

    const studentIds = students.map((s) => s._id);

    const progressData = await Progress.find({
      student: { $in: studentIds },
    });

    // Calculate stats
    let totalProgress = 0;
    let eligibleCount = 0;
    let categoryBreakdown = { '5lpa': 0, '7lpa': 0, '10lpa': 0 };

    for (const progress of progressData) {
      totalProgress += progress.progressPercentage;
      if (progress.progressPercentage >= 75) {
        eligibleCount++;
      }
      if (progress.category && categoryBreakdown[progress.category] !== undefined) {
        categoryBreakdown[progress.category]++;
      }
    }

    const averageProgress =
      progressData.length > 0 ? Math.round(totalProgress / progressData.length) : 0;

    // Get doubt stats
    const facultyIds = await User.find({
      role: 'faculty',
      department: hodDepartment,
    }).select('_id');

    const facultyIdList = facultyIds.map((f) => f._id);

    const totalDoubts = await Doubt.countDocuments({
      faculty: { $in: facultyIdList },
    });

    const pendingDoubts = await Doubt.countDocuments({
      faculty: { $in: facultyIdList },
      status: 'pending',
    });

    const categoryDocs = await Category.find({
      name: { $in: progressData.map((entry) => entry.category).filter(Boolean) },
    });
    const categoryMap = categoryDocs.reduce((map, category) => {
      map.set(category.name, category);
      return map;
    }, new Map());

    const reportsByStudent = await Report.aggregate([
      {
        $match: {
          student: { $in: studentIds },
        },
      },
      {
        $group: {
          _id: '$student',
          count: { $sum: 1 },
        },
      },
    ]);

    const reportCountMap = reportsByStudent.reduce((map, entry) => {
      map.set(String(entry._id), entry.count);
      return map;
    }, new Map());

    const doubtCounts = await Doubt.aggregate([
      {
        $match: {
          student: { $in: studentIds },
          status: 'pending',
        },
      },
      {
        $group: {
          _id: '$student',
          count: { $sum: 1 },
        },
      },
    ]);

    const doubtCountMap = doubtCounts.reduce((map, entry) => {
      map.set(String(entry._id), entry.count);
      return map;
    }, new Map());

    const atRiskCount = progressData.reduce((count, progress) => {
      const readiness = calculateReadiness({
        progress,
        categoryDoc: categoryMap.get(progress.category),
        pendingDoubts: doubtCountMap.get(String(progress.student)) || 0,
        mentorAssigned: true,
        reportCount: reportCountMap.get(String(progress.student)) || 0,
      });

      return count + (readiness.readinessScore < 55 ? 1 : 0);
    }, 0);

    const recentActivity = await AuditLog.find({
      actor: { $in: [...studentIds, ...facultyIdList] },
    })
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({
      department: hodDepartment,
      totalStudents,
      facultyCount,
      eligibleCount,
      averageProgress,
      categoryBreakdown,
      totalDoubts,
      pendingDoubts,
      pendingCount: totalStudents - eligibleCount,
      atRiskCount,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   HOD: GET DEPARTMENT FACULTY
=========================== */
export const getDepartmentFaculty = async (req, res) => {
  try {
    const hodDepartment = req.user.department;

    const faculty = await User.find({
      role: 'faculty',
      department: hodDepartment,
    }).select('-password');

    // Get student count for each faculty
    const facultyWithStudents = await Promise.all(
      faculty.map(async (f) => {
        const studentCount = await User.countDocuments({
          role: 'student',
          assignedFaculty: f._id,
        });

        const eligibleCount = await Progress.countDocuments({
          student: { $in: await User.find({ assignedFaculty: f._id }).select('_id') },
          progressPercentage: { $gte: 75 },
        });

        return {
          ...f.toObject(),
          assignedStudentsCount: studentCount,
          eligibleStudentsCount: eligibleCount,
        };
      })
    );

    res.json(facultyWithStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   HOD: GET DEPARTMENT STUDENTS
=========================== */
export const getDepartmentStudents = async (req, res) => {
  try {
    const hodDepartment = req.user.department;
    const { category, eligible, minProgress } = req.query;

    let query = {
      role: 'student',
      department: hodDepartment,
    };

    const students = await User.find(query)
      .select('-password')
      .populate('assignedFaculty', 'email name');

    // Get progress for each student
    let studentProgress = await Promise.all(
      students.map(async (student) => {
        const progress = await Progress.findOne({
          student: student._id,
        });

        return {
          student: {
            _id: student._id,
            email: student.email,
            department: student.department,
            selectedCategory: student.selectedCategory,
            assignedFaculty: student.assignedFaculty,
            createdAt: student.createdAt,
          },
          progress: progress || null,
          eligible: progress ? progress.progressPercentage >= 75 : false,
        };
      })
    );

    // Apply filters
    if (category) {
      studentProgress = studentProgress.filter((sp) => sp.student.selectedCategory === category);
    }

    if (eligible !== undefined) {
      const isEligible = eligible === 'true';
      studentProgress = studentProgress.filter((sp) => sp.eligible === isEligible);
    }

    if (minProgress) {
      studentProgress = studentProgress.filter(
        (sp) => sp.progress && sp.progress.progressPercentage >= Number(minProgress)
      );
    }

    const categoryDocs = await Category.find();
    const categoryMap = categoryDocs.reduce((map, category) => {
      map.set(category.name, category);
      return map;
    }, new Map());

    const pendingDoubts = await Doubt.aggregate([
      {
        $match: {
          student: { $in: students.map((student) => student._id) },
          status: 'pending',
        },
      },
      {
        $group: {
          _id: '$student',
          count: { $sum: 1 },
        },
      },
    ]);

    const doubtMap = pendingDoubts.reduce((map, entry) => {
      map.set(String(entry._id), entry.count);
      return map;
    }, new Map());

    const reports = await Report.aggregate([
      {
        $match: {
          student: { $in: students.map((student) => student._id) },
        },
      },
      {
        $group: {
          _id: '$student',
          count: { $sum: 1 },
        },
      },
    ]);

    const reportMap = reports.reduce((map, entry) => {
      map.set(String(entry._id), entry.count);
      return map;
    }, new Map());

    const enrichedStudents = studentProgress.map((entry) => {
      const readiness = calculateReadiness({
        progress: entry.progress,
        categoryDoc: categoryMap.get(entry.progress?.category || entry.student.selectedCategory),
        pendingDoubts: doubtMap.get(String(entry.student._id)) || 0,
        mentorAssigned: Boolean(entry.student.assignedFaculty),
        reportCount: reportMap.get(String(entry.student._id)) || 0,
      });

      return {
        ...entry,
        readiness,
        atRiskReasons: getAtRiskReason({ progress: entry.progress, readiness }),
      };
    });

    res.json(enrichedStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   HOD: GET STUDENT DETAILS
=========================== */
export const getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const hodDepartment = req.user.department;

    const student = await User.findOne({
      _id: studentId,
      role: 'student',
      department: hodDepartment,
    })
      .select('-password')
      .populate('assignedFaculty', 'email');

    if (!student) {
      return res.status(404).json({
        message: 'Student not found in your department',
      });
    }

    const progress = await Progress.findOne({
      student: studentId,
    });

    const reports = await Report.find({
      student: studentId,
    })
      .sort({ generatedAt: -1 })
      .limit(5);

    const doubts = await Doubt.find({
      student: studentId,
    }).sort({ createdAt: -1 });

    res.json({
      student,
      progress,
      reports,
      doubts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   HOD: GET DOUBT SUMMARY
=========================== */
export const getDoubtSummary = async (req, res) => {
  try {
    const hodDepartment = req.user.department;

    const faculty = await User.find({
      role: 'faculty',
      department: hodDepartment,
    }).select('_id');

    const facultyIds = faculty.map((f) => f._id);

    const totalDoubts = await Doubt.countDocuments({
      faculty: { $in: facultyIds },
    });

    const pendingDoubts = await Doubt.countDocuments({
      faculty: { $in: facultyIds },
      status: 'pending',
    });

    const answeredDoubts = await Doubt.countDocuments({
      faculty: { $in: facultyIds },
      status: 'answered',
    });

    // Get recent pending doubts
    const recentPending = await Doubt.find({
      faculty: { $in: facultyIds },
      status: 'pending',
    })
      .populate('student', 'email')
      .populate('faculty', 'email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalDoubts,
      pendingDoubts,
      answeredDoubts,
      recentPending,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   HOD: GET FACULTY ASSIGNMENTS
=========================== */
export const getFacultyAssignments = async (req, res) => {
  try {
    const hodDepartment = req.user.department;

    const faculty = await User.find({
      role: 'faculty',
      department: hodDepartment,
    }).select('-password');

    const assignments = await Promise.all(
      faculty.map(async (f) => {
        const students = await User.find({
          role: 'student',
          assignedFaculty: f._id,
        }).select('email selectedCategory');

        const studentsWithProgress = await Promise.all(
          students.map(async (s) => {
            const progress = await Progress.findOne({ student: s._id });
            return {
              _id: s._id,
              email: s.email,
              selectedCategory: s.selectedCategory,
              progressPercentage: progress ? progress.progressPercentage : 0,
              eligible: progress ? progress.progressPercentage >= 75 : false,
            };
          })
        );

        return {
          faculty: {
            _id: f._id,
            email: f.email,
          },
          students: studentsWithProgress,
          totalStudents: studentsWithProgress.length,
          eligibleStudents: studentsWithProgress.filter((s) => s.eligible).length,
        };
      })
    );

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   HOD: GET DEPARTMENT STAFF
=========================== */
export const getDepartmentStaff = async (req, res) => {
  try {
    const hodDepartment = req.user.department;

    const staff = await User.find({
      department: hodDepartment,
      role: { $in: ['faculty', 'hod'] },
    }).select('-password');

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

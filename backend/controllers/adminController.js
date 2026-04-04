import bcrypt from 'bcrypt';
import Doubt from '../models/doubtModel.js';
import Progress from '../models/progressModel.js';
import Report from '../models/reportModel.js';
import User from '../models/userModel.js';
import AuditLog from '../models/auditLogModel.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const DEPARTMENTS = [
  'CSE',
  'ECE',
  'EEE',
  'MECH',
  'IT',
  'ADS',
  'CYBER SECURITY',
  'CHEMICAL',
  'BIOTECHNOLOGY',
];

const ACCESS_MATRIX = {
  superadmin: {
    label: 'Superadmin',
    permissions: [
      'Create and manage every role',
      'View complete user directory',
      'Delete faculty accounts',
      'Review department-wide analytics',
      'Monitor report and doubt activity',
    ],
    manageableRoles: ['student', 'faculty', 'hod', 'placement', 'superadmin'],
  },
  placement: {
    label: 'Placement Admin',
    permissions: [
      'Manage students, faculty, and HOD accounts',
      'Assign students to faculty mentors',
      'Review placement analytics',
      'Track doubts and report readiness',
    ],
    manageableRoles: ['student', 'faculty', 'hod'],
  },
};

const sanitizeUser = (user) => ({
  _id: user._id,
  email: user.email,
  role: user.role,
  department: user.department || null,
  selectedCategory: user.selectedCategory || null,
  assignedFaculty: user.assignedFaculty || null,
  createdAt: user.createdAt,
});

const getManageableRoles = (role) => ACCESS_MATRIX[role]?.manageableRoles || [];

const validatePasswordStrength = (password = '') =>
  password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);

const getDepartmentStatsData = async () =>
  Promise.all(
    DEPARTMENTS.map(async (department) => {
      const students = await User.find({ role: 'student', department }).select('_id');
      const studentIds = students.map((student) => student._id);
      const progressData = await Progress.find({ student: { $in: studentIds } });

      const totalStudents = students.length;
      const eligibleStudents = progressData.filter((item) => item.progressPercentage >= 75).length;
      const avgProgress =
        progressData.length > 0
          ? Math.round(
              progressData.reduce((sum, item) => sum + item.progressPercentage, 0) /
                progressData.length
            )
          : 0;

      return {
        department,
        totalStudents,
        eligibleStudents,
        avgProgress,
        placementRate: totalStudents ? Math.round((eligibleStudents / totalStudents) * 100) : 0,
        categoryDistribution: {
          '5lpa': progressData.filter((item) => item.category === '5lpa').length,
          '7lpa': progressData.filter((item) => item.category === '7lpa').length,
          '10lpa': progressData.filter((item) => item.category === '10lpa').length,
        },
      };
    })
  );

const buildScopedStudentQuery = (req) => {
  const query = { role: 'student' };

  if (req.user.role === 'hod') {
    query.department = req.user.department;
  }

  return query;
};

/* ===========================
   ADMIN: GET FILTERED STUDENTS
=========================== */
export const getFilteredStudents = async (req, res) => {
  try {
    const { category, minProgress, department } = req.query;
    const userRole = req.user.role;
    const userDept = req.user.department;

    let progressQuery = {};

    if (category) {
      progressQuery.category = category;
    }

    if (minProgress) {
      progressQuery.progressPercentage = { $gte: Number(minProgress) };
    }

    let progressData = await Progress.find(progressQuery).populate({
      path: 'student',
      select: 'email role department assignedFaculty selectedCategory',
    });

    if (userRole === 'hod') {
      progressData = progressData.filter((item) => item.student?.department === userDept);
    }

    if (userRole === 'faculty') {
      progressData = progressData.filter(
        (item) => item.student?.assignedFaculty?.toString() === req.user._id.toString()
      );
    }

    if (department) {
      progressData = progressData.filter((item) => item.student?.department === department);
    }

    if (!['hod', 'faculty', 'placement', 'superadmin'].includes(userRole)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.status(200).json({
      total: progressData.length,
      students: progressData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: USER DIRECTORY
=========================== */
export const getUserDirectory = async (req, res) => {
  try {
    const manageableRoles = getManageableRoles(req.user.role);
    const { role, department, search, limit } = req.query;
    const parsedLimit = Math.min(Number(limit) || 100, 200);

    let query = {};

    if (role) {
      if (!manageableRoles.includes(role)) {
        return res.status(403).json({ message: 'You cannot view this role' });
      }
      query.role = role;
    } else {
      query.role = { $in: manageableRoles };
    }

    if (department && department !== 'ALL') {
      query.department = department;
    }

    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const users = await User.find(query)
      .select('-password -refreshToken')
      .populate('assignedFaculty', 'email department')
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    const counts = await Promise.all(
      manageableRoles.map(async (manageableRole) => ({
        role: manageableRole,
        total: await User.countDocuments({ role: manageableRole }),
      }))
    );

    res.json({
      counts,
      users: users.map(sanitizeUser),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: CREATE USER
=========================== */
export const createAdminUser = async (req, res) => {
  try {
    const { email, password, role, department, selectedCategory } = req.body;
    const manageableRoles = getManageableRoles(req.user.role);

    if (!manageableRoles.includes(role)) {
      return res.status(403).json({ message: 'You cannot create this role' });
    }

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        message: 'Password must be 8+ characters with uppercase, lowercase, and a number',
      });
    }

    if (['student', 'faculty', 'hod'].includes(role) && !department) {
      return res.status(400).json({ message: 'Department is required for this role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      department: department || undefined,
      selectedCategory: role === 'student' ? selectedCategory || null : null,
    });

    res.status(201).json({
      message: `${role} account created successfully`,
      user: sanitizeUser(user),
    });

    await logAuditEvent({
      req,
      actor: req.user,
      action: 'create-user',
      entityType: 'user',
      entityId: user._id.toString(),
      description: `${req.user.email} created ${user.email} as ${user.role}`,
      metadata: { department: user.department },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: GET ALL FACULTY
=========================== */
export const getAllFaculty = async (req, res) => {
  try {
    const { department } = req.query;

    let query = { role: 'faculty' };
    if (department && department !== 'ALL') {
      query.department = department;
    }

    const faculty = await User.find(query).select('-password');

    const facultyWithStudentCount = await Promise.all(
      faculty.map(async (member) => {
        const assignedStudents = await User.find({
          role: 'student',
          assignedFaculty: member._id,
        }).select('_id');

        const assignedStudentIds = assignedStudents.map((student) => student._id);
        const eligibleCount = await Progress.countDocuments({
          student: { $in: assignedStudentIds },
          progressPercentage: { $gte: 75 },
        });

        return {
          ...sanitizeUser(member),
          assignedStudentsCount: assignedStudents.length,
          eligibleStudentsCount: eligibleCount,
        };
      })
    );

    res.json(facultyWithStudentCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: GET ALL STUDENTS
=========================== */
export const getAllStudents = async (req, res) => {
  try {
    const { department, category } = req.query;

    let query = { role: 'student' };
    if (department && department !== 'ALL') {
      query.department = department;
    }

    let students = await User.find(query)
      .select('-password')
      .populate('assignedFaculty', 'email department');

    if (category) {
      const studentIds = students.map((student) => student._id);
      const progressWithCategory = await Progress.find({
        student: { $in: studentIds },
        category,
      }).select('student');

      const filteredIds = new Set(progressWithCategory.map((progress) => progress.student.toString()));
      students = students.filter((student) => filteredIds.has(student._id.toString()));
    }

    res.json(students.map(sanitizeUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: DELETE FACULTY ACCOUNT
=========================== */
export const deleteFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;

    const faculty = await User.findOne({ _id: facultyId, role: 'faculty' });

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    await User.updateMany({ assignedFaculty: facultyId }, { $set: { assignedFaculty: null } });
    await User.findByIdAndDelete(facultyId);

    res.status(200).json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: GET DASHBOARD STATS
=========================== */
export const getAdminDashboard = async (req, res) => {
  try {
    const studentCount = await User.countDocuments({ role: 'student' });
    const facultyCount = await User.countDocuments({ role: 'faculty' });
    const hodCount = await User.countDocuments({ role: 'hod' });
    const placementCount = await User.countDocuments({ role: 'placement' });
    const superadminCount = await User.countDocuments({ role: 'superadmin' });
    const reportsGenerated = await Report.countDocuments();

    const allProgress = await Progress.find().select('progressPercentage');
    const eligibleCount = allProgress.filter((item) => item.progressPercentage >= 75).length;
    const averageProgress =
      allProgress.length > 0
        ? Math.round(
            allProgress.reduce((sum, item) => sum + item.progressPercentage, 0) / allProgress.length
          )
        : 0;

    res.json({
      studentCount,
      facultyCount,
      hodCount,
      placementCount,
      superadminCount,
      eligibleCount,
      averageProgress,
      reportsGenerated,
      pendingCount: Math.max(studentCount - eligibleCount, 0),
      totalStudents: studentCount,
      totalFaculty: facultyCount,
      eligible: eligibleCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: OVERVIEW
=========================== */
export const getAdminOverview = async (req, res) => {
  try {
    const [
      dashboard,
      departmentStats,
      topFaculty,
      pendingDoubts,
      recentDoubts,
      recentReports,
      recentActivity,
    ] =
      await Promise.all([
        (async () => {
          const studentCount = await User.countDocuments({ role: 'student' });
          const facultyCount = await User.countDocuments({ role: 'faculty' });
          const hodCount = await User.countDocuments({ role: 'hod' });
          const placementCount = await User.countDocuments({ role: 'placement' });
          const superadminCount = await User.countDocuments({ role: 'superadmin' });
          const progressData = await Progress.find().select('progressPercentage');
          const reportsGenerated = await Report.countDocuments();
          const eligibleStudents = progressData.filter(
            (item) => item.progressPercentage >= 75
          ).length;
          const averageProgress = progressData.length
            ? Math.round(
                progressData.reduce((sum, item) => sum + item.progressPercentage, 0) /
                  progressData.length
              )
            : 0;

          return {
            totalStudents: studentCount,
            totalFaculty: facultyCount,
            totalHods: hodCount,
            totalPlacementAdmins: placementCount,
            totalSuperadmins: superadminCount,
            eligibleStudents,
            averageProgress,
            reportsGenerated,
          };
        })(),
        getDepartmentStatsData(),
        User.find({ role: 'faculty' })
          .select('-password -refreshToken')
          .sort({ createdAt: -1 })
          .limit(6),
        Doubt.countDocuments({ status: 'pending' }),
        Doubt.find()
          .populate('student', 'email department')
          .populate('faculty', 'email department')
          .sort({ createdAt: -1 })
          .limit(5),
        Report.find()
          .populate('student', 'email department')
          .sort({ generatedAt: -1 })
          .limit(5),
        AuditLog.find().sort({ createdAt: -1 }).limit(8),
      ]);

    const facultySnapshot = await Promise.all(
      topFaculty.map(async (faculty) => {
        const assignedStudents = await User.countDocuments({
          role: 'student',
          assignedFaculty: faculty._id,
        });

        return {
          ...sanitizeUser(faculty),
          assignedStudentsCount: assignedStudents,
        };
      })
    );

    const unassignedStudents = await User.find({
      ...buildScopedStudentQuery(req),
      assignedFaculty: null,
    })
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .limit(10);

    const facultyOptions = await User.find({ role: 'faculty' })
      .select('-password -refreshToken')
      .sort({ email: 1 })
      .limit(20);

    res.json({
      role: req.user.role,
      access: ACCESS_MATRIX[req.user.role],
      summary: {
        ...dashboard,
        pendingStudents: Math.max(dashboard.totalStudents - dashboard.eligibleStudents, 0),
        pendingDoubts,
      },
      quickActions: [
        { label: 'Students', path: '/admin/students', description: 'Monitor student readiness' },
        { label: 'Reports', path: '/admin/reports', description: 'Review latest generated reports' },
        { label: 'Analytics', path: '/admin/analytics', description: 'Track placement progress' },
        { label: 'Departments', path: '/admin/departments', description: 'Compare department health' },
      ],
      departments: departmentStats.sort((left, right) => right.totalStudents - left.totalStudents),
      faculty: facultySnapshot,
      recentDoubts: recentDoubts.map((doubt) => ({
        _id: doubt._id,
        subject: doubt.subject,
        status: doubt.status,
        category: doubt.category,
        createdAt: doubt.createdAt,
        student: doubt.student
          ? {
              email: doubt.student.email,
              department: doubt.student.department,
            }
          : null,
        faculty: doubt.faculty
          ? {
              email: doubt.faculty.email,
              department: doubt.faculty.department,
            }
          : null,
      })),
      recentReports: recentReports.map((report) => ({
        _id: report._id,
        type: report.type,
        category: report.category,
        progressPercentage: report.progressPercentage,
        eligible: report.eligible,
        generatedAt: report.generatedAt,
        student: report.student
          ? {
              email: report.student.email,
              department: report.student.department,
            }
          : null,
      })),
      recentActivity: recentActivity.map((item) => ({
        _id: item._id,
        action: item.action,
        description: item.description,
        actorEmail: item.actorEmail,
        actorRole: item.actorRole,
        createdAt: item.createdAt,
      })),
      assignmentPool: {
        students: unassignedStudents.map(sanitizeUser),
        faculty: facultyOptions.map(sanitizeUser),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: GET DETAILED REPORTS
=========================== */
export const getDetailedReports = async (req, res) => {
  try {
    const { department, eligible, category } = req.query;

    let studentQuery = { role: 'student' };
    if (department && department !== 'ALL') {
      studentQuery.department = department;
    }

    const students = await User.find(studentQuery)
      .select('-password')
      .populate('assignedFaculty', 'email');

    const reports = await Promise.all(
      students.map(async (student) => {
        const progress = await Progress.findOne({ student: student._id });

        if (!progress) return null;
        if (category && progress.category !== category) return null;

        if (eligible !== undefined) {
          const isEligible = progress.progressPercentage >= 75;
          if (eligible === 'true' && !isEligible) return null;
          if (eligible === 'false' && isEligible) return null;
        }

        return {
          student: {
            _id: student._id,
            email: student.email,
            department: student.department,
            assignedFaculty: student.assignedFaculty,
          },
          category: progress.category,
          progressPercentage: progress.progressPercentage,
          eligible: progress.progressPercentage >= 75,
          completedTasks: progress.completedTasks.length,
          updatedAt: progress.updatedAt,
        };
      })
    );

    const filteredReports = reports.filter(Boolean);

    res.json({
      total: filteredReports.length,
      reports: filteredReports,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: GET OVERALL STATS BY DEPARTMENT
=========================== */
export const getDepartmentStats = async (_req, res) => {
  try {
    const stats = await getDepartmentStatsData();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: GET ALL HODS
=========================== */
export const getAllHods = async (_req, res) => {
  try {
    const hods = await User.find({ role: 'hod' }).select('-password');
    res.json(hods.map(sanitizeUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: GET DOUBT STATISTICS
=========================== */
export const getDoubtStatistics = async (_req, res) => {
  try {
    const totalDoubts = await Doubt.countDocuments();
    const pendingDoubts = await Doubt.countDocuments({ status: 'pending' });
    const answeredDoubts = await Doubt.countDocuments({ status: 'answered' });

    const recentDoubts = await Doubt.find()
      .populate('student', 'email department')
      .populate('faculty', 'email department')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalDoubts,
      pendingDoubts,
      answeredDoubts,
      recentDoubts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: ASSIGN STUDENT TO FACULTY
=========================== */
export const assignStudentToFaculty = async (req, res) => {
  try {
    const { studentId, facultyId } = req.body;

    const student = await User.findOne({
      _id: studentId,
      ...buildScopedStudentQuery(req),
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const faculty = await User.findOne({ _id: facultyId, role: 'faculty' });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (req.user.role === 'hod' && faculty.department !== req.user.department) {
      return res.status(403).json({ message: 'You can only assign faculty in your department' });
    }

    student.assignedFaculty = facultyId;
    await student.save();

    res.status(200).json({
      message: 'Student assigned to faculty successfully',
      student: student.email,
      faculty: faculty.email,
    });

    await logAuditEvent({
      req,
      actor: req.user,
      action: 'assign-student',
      entityType: 'student-assignment',
      entityId: student._id.toString(),
      description: `${req.user.email} assigned ${student.email} to ${faculty.email}`,
      metadata: {
        studentEmail: student.email,
        facultyEmail: faculty.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

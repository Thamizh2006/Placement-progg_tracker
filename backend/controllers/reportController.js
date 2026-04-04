import User from '../models/userModel.js';
import Progress from '../models/progressModel.js';
import Category from '../models/categoryModel.js';
import Report from '../models/reportModel.js';

/* ===========================
   STUDENT: GENERATE PROGRESS REPORT
=========================== */
export const generateProgressReport = async (req, res) => {
  try {
    const studentId = req.user._id;

    const progress = await Progress.findOne({ student: studentId }).populate(
      'student',
      'email department selectedCategory'
    );

    if (!progress) {
      return res.status(404).json({
        message: 'No progress found. Please select a category first.',
      });
    }

    const category = await Category.findOne({ name: progress.category });

    if (!category) {
      return res.status(404).json({
        message: 'Category not found',
      });
    }

    const totalTasks = category.rows.reduce((sum, row) => sum + row.tasks.length, 0);

    const completedTaskCount = progress.completedTasks.length;
    const progressPercentage = Math.round((completedTaskCount / totalTasks) * 100);
    const eligible = progressPercentage >= 75;

    const report = await Report.create({
      student: studentId,
      type: 'complete',
      category: progress.category,
      progressPercentage,
      completedTasks: progress.completedTasks.map((task) => ({
        rowTitle: task.rowTitle,
        taskName: task.taskName,
        completedAt: task.completedAt,
      })),
      totalTasks,
      completedTaskCount,
      eligible,
      generatedAt: new Date(),
    });

    res.status(201).json({
      message: 'Report generated successfully',
      report: {
        _id: report._id,
        student: {
          email: progress.student.email,
          department: progress.student.department,
          category: progress.category,
        },
        progressPercentage: report.progressPercentage,
        completedTaskCount,
        totalTasks,
        eligible,
        completedTasks: report.completedTasks,
        generatedAt: report.generatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: GENERATE PDF REPORT
=========================== */
export const generatePDFReport = async (req, res) => {
  try {
    const studentId = req.user._id;

    const student = await User.findById(studentId);
    const progress = await Progress.findOne({ student: studentId }).populate(
      'student',
      'email department selectedCategory'
    );

    if (!progress) {
      return res.status(404).json({
        message: 'No progress found. Please select a category first.',
      });
    }

    const category = await Category.findOne({ name: progress.category });

    if (!category) {
      return res.status(404).json({
        message: 'Category not found',
      });
    }

    const totalTasks = category.rows.reduce((sum, row) => sum + row.tasks.length, 0);

    const completedTaskCount = progress.completedTasks.length;
    const progressPercentage = Math.round((completedTaskCount / totalTasks) * 100);
    const eligible = progressPercentage >= 75;

    // Generate report data
    const reportData = {
      student: {
        email: student.email,
        department: student.department,
        category: progress.category,
      },
      progressPercentage,
      completedTaskCount,
      totalTasks,
      eligible,
      completedTasks: progress.completedTasks,
      generatedAt: new Date(),
    };

    // Store in database
    const report = await Report.create({
      student: studentId,
      type: 'complete',
      category: progress.category,
      progressPercentage,
      completedTasks: progress.completedTasks.map((task) => ({
        rowTitle: task.rowTitle,
        taskName: task.taskName,
        completedAt: task.completedAt,
      })),
      totalTasks,
      completedTaskCount,
      eligible,
      generatedAt: new Date(),
    });

    res.status(201).json({
      message: 'PDF Report generated successfully',
      reportId: report._id,
      reportData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: DOWNLOAD MY REPORT
=========================== */
export const downloadMyReport = async (req, res) => {
  try {
    const studentId = req.user._id;

    const report = await Report.findOne({ student: studentId }).sort({ generatedAt: -1 });

    if (!report) {
      return res.status(404).json({
        message: 'No report found. Please generate a report first.',
      });
    }

    const student = await User.findById(studentId);

    res.json({
      message: 'Report retrieved successfully',
      report: {
        _id: report._id,
        student: {
          email: student.email,
          department: student.department,
          category: report.category,
        },
        type: report.type,
        progressPercentage: report.progressPercentage,
        completedTaskCount: report.completedTaskCount,
        totalTasks: report.totalTasks,
        eligible: report.eligible,
        completedTasks: report.completedTasks,
        generatedAt: report.generatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: GET MY REPORTS
=========================== */
export const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ student: req.user._id }).sort({ generatedAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   STUDENT: GET LATEST REPORT
=========================== */
export const getLatestReport = async (req, res) => {
  try {
    const report = await Report.findOne({ student: req.user._id }).sort({ generatedAt: -1 });

    if (!report) {
      return res.status(404).json({
        message: 'No report found',
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   FACULTY: GET STUDENT REPORT
=========================== */
export const getStudentReport = async (req, res) => {
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

    const report = await Report.findOne({ student: studentId }).sort({ generatedAt: -1 });

    if (!report) {
      return res.status(404).json({
        message: 'No report found for this student',
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: GET ALL REPORTS
=========================== */
export const getAllReports = async (req, res) => {
  try {
    const { department, eligible, category } = req.query;

    let query = {};

    let reports = await Report.find()
      .populate({
        path: 'student',
        select: 'email department selectedCategory',
      })
      .sort({ generatedAt: -1 });

    if (department) {
      reports = reports.filter((r) => r.student?.department === department);
    }

    if (eligible !== undefined) {
      reports = reports.filter((r) => r.eligible === (eligible === 'true'));
    }

    if (category) {
      reports = reports.filter((r) => r.category === category);
    }

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   ADMIN: GENERATE BULK REPORTS
=========================== */
export const generateBulkReports = async (req, res) => {
  try {
    const { department, category } = req.body;

    let studentQuery = { role: 'student' };

    if (department && department !== 'ALL') {
      studentQuery.department = department;
    }

    const students = await User.find(studentQuery);

    const reports = [];

    for (const student of students) {
      const progress = await Progress.findOne({ student: student._id });

      if (!progress) continue;

      if (category && progress.category !== category) continue;

      const categoryData = await Category.findOne({ name: progress.category });

      if (!categoryData) continue;

      const totalTasks = categoryData.rows.reduce((sum, row) => sum + row.tasks.length, 0);

      const completedTaskCount = progress.completedTasks.length;
      const progressPercentage = Math.round((completedTaskCount / totalTasks) * 100);
      const eligible = progressPercentage >= 75;

      const report = await Report.create({
        student: student._id,
        type: 'complete',
        category: progress.category,
        progressPercentage,
        completedTasks: progress.completedTasks.map((task) => ({
          rowTitle: task.rowTitle,
          taskName: task.taskName,
          completedAt: task.completedAt,
        })),
        totalTasks,
        completedTaskCount,
        eligible,
        generatedAt: new Date(),
      });

      reports.push(report);
    }

    res.status(201).json({
      message: `Generated ${reports.length} reports`,
      count: reports.length,
      reports,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   HOD: GET DEPARTMENT REPORTS
=========================== */
export const getDepartmentReports = async (req, res) => {
  try {
    const hodDepartment = req.user.department;
    const { eligible, category } = req.query;

    const students = await User.find({
      role: 'student',
      department: hodDepartment,
    }).select('_id');

    const studentIds = students.map((s) => s._id);

    let reports = await Report.find({
      student: { $in: studentIds },
    })
      .populate({
        path: 'student',
        select: 'email department',
      })
      .sort({ generatedAt: -1 });

    if (eligible !== undefined) {
      reports = reports.filter((r) => r.eligible === (eligible === 'true'));
    }

    if (category) {
      reports = reports.filter((r) => r.category === category);
    }

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   SUPERADMIN: GET CROSS-DEPARTMENT ANALYTICS
=========================== */
export const getCrossDepartmentAnalytics = async (req, res) => {
  try {
    const departments = [
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

    const analytics = await Promise.all(
      departments.map(async (dept) => {
        const students = await User.find({
          role: 'student',
          department: dept,
        });

        const studentIds = students.map((s) => s._id);

        const progressData = await Progress.find({
          student: { $in: studentIds },
        });

        const totalStudents = students.length;
        const eligibleStudents = progressData.filter((p) => p.progressPercentage >= 75).length;
        const avgProgress =
          progressData.length > 0
            ? Math.round(
                progressData.reduce((sum, p) => sum + p.progressPercentage, 0) / progressData.length
              )
            : 0;

        const categoryDistribution = {
          '5lpa': progressData.filter((p) => p.category === '5lpa').length,
          '7lpa': progressData.filter((p) => p.category === '7lpa').length,
          '10lpa': progressData.filter((p) => p.category === '10lpa').length,
        };

        return {
          department: dept,
          totalStudents,
          eligibleStudents,
          avgProgress,
          categoryDistribution,
          placementRate:
            totalStudents > 0 ? Math.round((eligibleStudents / totalStudents) * 100) : 0,
        };
      })
    );

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

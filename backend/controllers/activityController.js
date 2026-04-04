import AuditLog from '../models/auditLogModel.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('actor', 'email role')
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      readAt: null,
    });

    res.json({
      unreadCount,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipient: req.user._id },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActivityFeed = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 30);
    let activity = [];

    if (req.user.role === 'student') {
      activity = await AuditLog.find({
        $or: [
          { actor: req.user._id },
          { 'metadata.studentId': String(req.user._id) },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit);
    } else if (req.user.role === 'faculty') {
      const assignedStudents = await User.find({
        role: 'student',
        assignedFaculty: req.user._id,
      }).select('_id');

      const studentIds = assignedStudents.map((student) => String(student._id));

      activity = await AuditLog.find({
        $or: [
          { actor: req.user._id },
          { 'metadata.studentId': { $in: studentIds } },
          { 'metadata.facultyId': String(req.user._id) },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit);
    } else if (req.user.role === 'hod') {
      const departmentUsers = await User.find({
        department: req.user.department,
        role: { $in: ['student', 'faculty', 'hod'] },
      }).select('_id');

      activity = await AuditLog.find({
        actor: { $in: departmentUsers.map((user) => user._id) },
      })
        .sort({ createdAt: -1 })
        .limit(limit);
    } else {
      activity = await AuditLog.find().sort({ createdAt: -1 }).limit(limit);
    }

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

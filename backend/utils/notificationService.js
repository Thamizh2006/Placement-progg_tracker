import Notification from '../models/notificationModel.js';

const sanitizeNotification = (notification) => ({
  ...notification,
  metadata: notification.metadata || {},
});

export const createNotification = async (notification) => {
  if (!notification?.recipient || !notification?.title || !notification?.message || !notification?.type) {
    return null;
  }

  return Notification.create(sanitizeNotification(notification));
};

export const createNotifications = async (notifications = []) => {
  const validNotifications = notifications
    .map(sanitizeNotification)
    .filter(
      (notification) =>
        notification.recipient &&
        notification.title &&
        notification.message &&
        notification.type
    );

  if (!validNotifications.length) {
    return [];
  }

  return Notification.insertMany(validNotifications);
};

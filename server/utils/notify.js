import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmailNotificationHook } from "./email.js";

export const createNotification = async ({ userId, type, title, text, meta = {} }) => {
  const notification = await Notification.create({ user: userId, type, title, text, meta });

  const target = await User.findById(userId).select("email emailNotificationEnabled notificationPreferences");
  const emailEnabled = target?.emailNotificationEnabled;
  if (target && emailEnabled) {
    await sendEmailNotificationHook({ to: target.email, subject: title, message: text });
  }

  return notification;
};

export const createBulkNotification = async ({ userIds, type, title, text, meta = {} }) => {
  if (!userIds?.length) return;
  const docs = userIds.map((id) => ({ user: id, type, title, text, meta }));
  await Notification.insertMany(docs);
};

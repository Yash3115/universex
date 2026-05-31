const Notification = require("../models/notificationSchema");

const createNotification = async ({ recipient, sender, connection, post, comment, job, type, message }) => {
  if (!recipient || String(recipient) === String(sender)) return null;

  return Notification.create({
    recipient,
    sender,
    connection,
    post,
    comment,
    job,
    type,
    message,
  });
};

module.exports = { createNotification };
const Notification = require("../models/notificationSchema");

const createNotification = async ({ recipient, sender, connection, interaction, course, material, announcement, assignment, submission, assessment, question, answer, attendanceSession, officeHourSlot, officeHourBooking, post, comment, job, type, message }) => {
  if (!recipient || String(recipient) === String(sender)) return null;

  return Notification.create({
    recipient,
    sender,
    connection,
    interaction,
    course,
    material,
    announcement,
    assignment,
    submission,
    assessment,
    question,
    answer,
    attendanceSession,
    officeHourSlot,
    officeHourBooking,
    post,
    comment,
    job,
    type,
    message,
  });
};

module.exports = { createNotification };
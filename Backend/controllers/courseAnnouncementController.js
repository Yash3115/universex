const Course = require("../models/courseSchema");
const CourseAnnouncement = require("../models/courseAnnouncementSchema");
const { createNotification } = require("../utils/notificationService");

const ANNOUNCEMENT_POPULATE = [
  { path: "author", select: "firstName lastName image role facultyProfile", populate: { path: "facultyProfile" } },
  { path: "course", select: "title code college department professor enrollments" },
];

const isCourseInstructor = (course, userId) =>
  String(course.professor?._id || course.professor) === String(userId) ||
  (course.coInstructors || []).some((instructor) => String(instructor?._id || instructor) === String(userId));

const getEnrollment = (course, userId) =>
  (course.enrollments || []).find((item) => String(item.student?._id || item.student) === String(userId));

const isEnrolled = (course, userId) => getEnrollment(course, userId)?.status === "enrolled";

const canViewAnnouncement = (course, announcement, user) => {
  if (user.role === "Admin" || isCourseInstructor(course, user.id)) return true;
  if (announcement.visibility === "public") return true;
  if (announcement.visibility === "college") return course.college === user.college;
  return isEnrolled(course, user.id);
};

exports.createCourseAnnouncement = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!isCourseInstructor(course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only course instructors can post announcements" });
    }

    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();
    if (!title || !body) return res.status(400).json({ success: false, message: "Announcement title and body are required" });

    let announcement = await CourseAnnouncement.create({
      course: course._id,
      author: req.user.id,
      title,
      body,
      priority: ["normal", "important", "urgent"].includes(req.body.priority) ? req.body.priority : "normal",
      pinned: req.body.pinned === true || req.body.pinned === "true",
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      visibility: ["enrolled", "college", "public"].includes(req.body.visibility) ? req.body.visibility : "enrolled",
    });

    announcement = await announcement.populate(ANNOUNCEMENT_POPULATE);

    const enrolledRecipients = (course.enrollments || [])
      .filter((enrollment) => enrollment.status === "enrolled")
      .map((enrollment) => enrollment.student)
      .filter((studentId) => String(studentId) !== String(req.user.id));

    const priorityPrefix = announcement.priority === "urgent" ? "posted an urgent announcement" : "posted an announcement";
    await Promise.all(
      enrolledRecipients.map((recipient) =>
        createNotification({
          recipient,
          sender: req.user.id,
          course: course._id,
          announcement: announcement._id,
          type: "Academic",
          message: `${priorityPrefix} in ${course.code}`,
        })
      )
    );

    res.status(201).json({ success: true, message: "Announcement posted", announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to post announcement", error: error.message });
  }
};

exports.getCourseAnnouncements = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const { priority = "", search = "" } = req.query;
    const query = { course: course._id };
    if (["normal", "important", "urgent"].includes(priority)) query.priority = priority;
    if (search.trim()) query.$text = { $search: search.trim() };

    const announcements = await CourseAnnouncement.find(query)
      .populate(ANNOUNCEMENT_POPULATE)
      .sort({ pinned: -1, priority: -1, publishedAt: -1, createdAt: -1 });

    const visibleAnnouncements = announcements.filter((announcement) => canViewAnnouncement(course, announcement, req.user));
    const enrollment = getEnrollment(course, req.user.id);
    res.status(200).json({
      success: true,
      announcements: visibleAnnouncements,
      viewerContext: {
        isInstructor: req.user.role === "Admin" || isCourseInstructor(course, req.user.id),
        isEnrolled: enrollment?.status === "enrolled",
        enrollmentStatus: enrollment?.status || "none",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch announcements", error: error.message });
  }
};

exports.deleteCourseAnnouncement = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!isCourseInstructor(course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only course instructors can delete announcements" });
    }

    const announcement = await CourseAnnouncement.findOneAndDelete({ _id: req.params.announcementId, course: course._id });
    if (!announcement) return res.status(404).json({ success: false, message: "Announcement not found" });
    res.status(200).json({ success: true, message: "Announcement deleted", announcementId: announcement._id });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete announcement", error: error.message });
  }
};
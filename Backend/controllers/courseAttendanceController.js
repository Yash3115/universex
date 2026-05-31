const Course = require("../models/courseSchema");
const CourseAttendanceRecord = require("../models/courseAttendanceRecordSchema");
const CourseAttendanceSession = require("../models/courseAttendanceSessionSchema");
const { createNotification } = require("../utils/notificationService");

const SESSION_POPULATE = [
  { path: "professor", select: "firstName lastName image role facultyProfile", populate: { path: "facultyProfile" } },
  { path: "course", select: "title code college department professor enrollments" },
];
const RECORD_POPULATE = [{ path: "student", select: "firstName lastName email image college additionalDetails", populate: { path: "additionalDetails" } }];

const isCourseInstructor = (course, userId) =>
  String(course.professor?._id || course.professor) === String(userId) ||
  (course.coInstructors || []).some((instructor) => String(instructor?._id || instructor) === String(userId));

const getEnrollment = (course, userId) =>
  (course.enrollments || []).find((item) => String(item.student?._id || item.student) === String(userId));

const isEnrolled = (course, userId) => getEnrollment(course, userId)?.status === "enrolled";

const buildStats = (records = []) => {
  const counted = records.filter((record) => record.status !== "excused");
  const present = counted.filter((record) => ["present", "late"].includes(record.status)).length;
  return { present, total: counted.length, percentage: counted.length ? Math.round((present / counted.length) * 100) : 0 };
};

exports.createAttendanceSession = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!isCourseInstructor(course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only instructors can create attendance sessions" });
    }
    const title = String(req.body.title || "").trim();
    if (!title || !req.body.date) return res.status(400).json({ success: false, message: "Title and date are required" });
    let session = await CourseAttendanceSession.create({
      course: course._id,
      professor: req.user.id,
      title,
      topic: String(req.body.topic || "").trim(),
      date: new Date(req.body.date),
      startTime: String(req.body.startTime || "").trim(),
      endTime: String(req.body.endTime || "").trim(),
      location: String(req.body.location || "").trim(),
      notes: String(req.body.notes || "").trim(),
    });
    session = await session.populate(SESSION_POPULATE);
    res.status(201).json({ success: true, message: "Attendance session created", session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create attendance session", error: error.message });
  }
};

exports.getCourseAttendanceSessions = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!(req.user.role === "Admin" || isCourseInstructor(course, req.user.id) || isEnrolled(course, req.user.id))) {
      return res.status(403).json({ success: false, message: "Only course participants can view attendance" });
    }
    const sessions = await CourseAttendanceSession.find({ course: course._id }).populate(SESSION_POPULATE).sort({ date: -1 });
    const myRecords = await CourseAttendanceRecord.find({ course: course._id, student: req.user.id }).populate("session").sort({ markedAt: -1 });
    res.status(200).json({
      success: true,
      sessions,
      myRecords,
      myStats: buildStats(myRecords),
      viewerContext: { isInstructor: req.user.role === "Admin" || isCourseInstructor(course, req.user.id), isEnrolled: isEnrolled(course, req.user.id) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch attendance sessions", error: error.message });
  }
};

exports.updateAttendanceSession = async (req, res) => {
  try {
    let session = await CourseAttendanceSession.findById(req.params.sessionId).populate("course");
    if (!session) return res.status(404).json({ success: false, message: "Attendance session not found" });
    if (!isCourseInstructor(session.course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only instructors can update this session" });
    }
    const oldStatus = session.status;
    ["title", "topic", "startTime", "endTime", "location", "notes"].forEach((field) => {
      if (req.body[field] !== undefined) session[field] = req.body[field];
    });
    if (req.body.date) session.date = new Date(req.body.date);
    if (["scheduled", "completed", "cancelled"].includes(req.body.status)) session.status = req.body.status;
    await session.save();
    if (oldStatus !== "cancelled" && session.status === "cancelled") {
      await Promise.all((session.course.enrollments || []).filter((e) => e.status === "enrolled").map((e) => createNotification({ recipient: e.student, sender: req.user.id, course: session.course._id, attendanceSession: session._id, type: "Academic", message: `cancelled attendance session in ${session.course.code}` })));
    }
    session = await session.populate(SESSION_POPULATE);
    res.status(200).json({ success: true, message: "Attendance session updated", session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update attendance session", error: error.message });
  }
};

exports.markAttendanceRecords = async (req, res) => {
  try {
    const session = await CourseAttendanceSession.findById(req.params.sessionId).populate("course");
    if (!session) return res.status(404).json({ success: false, message: "Attendance session not found" });
    if (!isCourseInstructor(session.course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only instructors can mark attendance" });
    }
    const records = Array.isArray(req.body.records) ? req.body.records : [];
    const savedRecords = await Promise.all(records.map((record) => CourseAttendanceRecord.findOneAndUpdate(
      { session: session._id, student: record.studentId },
      { session: session._id, course: session.course._id, student: record.studentId, status: record.status, note: String(record.note || "").trim(), markedBy: req.user.id, markedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate(RECORD_POPULATE)));
    session.status = "completed";
    await session.save();
    res.status(200).json({ success: true, message: "Attendance marked", records: savedRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark attendance", error: error.message });
  }
};

exports.getAttendanceRecords = async (req, res) => {
  try {
    const session = await CourseAttendanceSession.findById(req.params.sessionId).populate("course");
    if (!session) return res.status(404).json({ success: false, message: "Attendance session not found" });
    if (!isCourseInstructor(session.course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only instructors can view all attendance records" });
    }
    const records = await CourseAttendanceRecord.find({ session: session._id }).populate(RECORD_POPULATE).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch attendance records", error: error.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const query = { student: req.user.id };
    if (req.params.courseId) query.course = req.params.courseId;
    const records = await CourseAttendanceRecord.find(query).populate("session").populate("course", "title code").sort({ markedAt: -1 });
    res.status(200).json({ success: true, records, stats: buildStats(records) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch attendance", error: error.message });
  }
};
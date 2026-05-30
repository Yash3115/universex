const Routine = require("../models/routineSchema");
const Attendance = require("../models/attendanceSchema");
const AcademicTask = require("../models/academicTaskSchema");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const normalizeRoutineEntries = (entries = []) =>
  entries
    .map((entry) => ({
      subject: String(entry.subject || "").trim(),
      day: entry.day,
      startTime: String(entry.startTime || "").trim(),
      endTime: String(entry.endTime || "").trim(),
      location: String(entry.location || "").trim(),
      instructor: String(entry.instructor || "").trim(),
      color: String(entry.color || "#2563eb").trim(),
    }))
    .filter((entry) => entry.subject && DAYS.includes(entry.day));

const buildAttendanceStats = (records = []) => {
  const statsBySubject = {};

  records.forEach((record) => {
    if (!statsBySubject[record.subject]) {
      statsBySubject[record.subject] = {
        subject: record.subject,
        attended: 0,
        missed: 0,
        total: 0,
        percentage: 0,
      };
    }

    if (record.status === "Cancelled") return;

    statsBySubject[record.subject].total += 1;
    if (record.status === "Attended") statsBySubject[record.subject].attended += 1;
    if (record.status === "Missed") statsBySubject[record.subject].missed += 1;
  });

  return Object.values(statsBySubject).map((stat) => ({
    ...stat,
    percentage: stat.total ? Math.round((stat.attended / stat.total) * 100) : 0,
  }));
};

exports.getAcademicOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const [routine, attendance, tasks] = await Promise.all([
      Routine.findOne({ user: userId }),
      Attendance.find({ user: userId }).sort({ date: -1 }).limit(100),
      AcademicTask.find({ user: userId }).sort({ dueDate: 1, createdAt: -1 }),
    ]);

    return res.status(200).json({
      success: true,
      routine: routine?.entries || [],
      attendance,
      attendanceStats: buildAttendanceStats(attendance),
      tasks,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load academic planner", error: error.message });
  }
};

exports.saveRoutine = async (req, res) => {
  try {
    const entries = normalizeRoutineEntries(req.body.entries);

    const routine = await Routine.findOneAndUpdate(
      { user: req.user.id },
      { entries },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "Routine saved", routine: routine.entries });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save routine", error: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { subject, date, status, note = "" } = req.body;

    if (!subject || !date || !["Attended", "Missed", "Cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Subject, date, and valid status are required" });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const record = await Attendance.findOneAndUpdate(
      { user: req.user.id, subject: subject.trim(), date: attendanceDate },
      { subject: subject.trim(), date: attendanceDate, status, note: note.trim() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const records = await Attendance.find({ user: req.user.id }).sort({ date: -1 }).limit(100);

    return res.status(200).json({
      success: true,
      message: "Attendance saved",
      attendance: record,
      attendanceRecords: records,
      attendanceStats: buildAttendanceStats(records),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save attendance", error: error.message });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    await Attendance.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    const records = await Attendance.find({ user: req.user.id }).sort({ date: -1 }).limit(100);
    return res.status(200).json({ success: true, attendanceRecords: records, attendanceStats: buildAttendanceStats(records) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete attendance", error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, subject = "", description = "", dueDate, priority = "medium" } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Task title is required" });
    }

    const task = await AcademicTask.create({
      user: req.user.id,
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
    });

    return res.status(201).json({ success: true, message: "Task created", task });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create task", error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const allowed = ["title", "subject", "description", "dueDate", "priority", "status"];
    const update = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });
    if (update.dueDate) update.dueDate = new Date(update.dueDate);

    const task = await AcademicTask.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, update, { new: true });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    return res.status(200).json({ success: true, message: "Task updated", task });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update task", error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await AcademicTask.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    return res.status(200).json({ success: true, message: "Task deleted", taskId: req.params.id });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete task", error: error.message });
  }
};
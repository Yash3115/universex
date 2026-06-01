const Course = require("../models/courseSchema");
const OfficeHourBooking = require("../models/officeHourBookingSchema");
const OfficeHourSlot = require("../models/officeHourSlotSchema");
const { createNotification } = require("../utils/notificationService");

const SLOT_POPULATE = [
  { path: "professor", select: "firstName lastName image role facultyProfile", populate: { path: "facultyProfile" } },
  { path: "course", select: "title code college department professor enrollments" },
];
const BOOKING_POPULATE = [
  { path: "slot", populate: SLOT_POPULATE },
  { path: "professor", select: "firstName lastName image role facultyProfile", populate: { path: "facultyProfile" } },
  { path: "student", select: "firstName lastName email image college additionalDetails", populate: { path: "additionalDetails" } },
  { path: "course", select: "title code" },
];

const isCourseInstructor = (course, userId) =>
  String(course.professor?._id || course.professor) === String(userId) ||
  (course.coInstructors || []).some((instructor) => String(instructor?._id || instructor) === String(userId));

const isEnrolled = (course, userId) =>
  (course.enrollments || []).some((item) => String(item.student?._id || item.student) === String(userId) && item.status === "enrolled");

exports.createOfficeHourSlot = async (req, res) => {
  try {
    if (!['Professor', 'Admin'].includes(req.user.role)) return res.status(403).json({ success: false, message: "Only professors can create office hours" });
    const { courseId, title, startAt, endAt, mode = "offline", location = "", meetingLink = "", capacity = 1, notes = "" } = req.body;
    if (!title?.trim() || !startAt || !endAt) return res.status(400).json({ success: false, message: "Title, start, and end time are required" });
    let course = null;
    if (courseId) {
      course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ success: false, message: "Course not found" });
      if (req.user.role !== "Admin" && !isCourseInstructor(course, req.user.id)) return res.status(403).json({ success: false, message: "Only course instructors can create slots for this course" });
    }
    let slot = await OfficeHourSlot.create({ professor: req.user.id, course: course?._id, title: title.trim(), startAt: new Date(startAt), endAt: new Date(endAt), mode, location, meetingLink, capacity: Math.max(Number(capacity) || 1, 1), notes });
    slot = await slot.populate(SLOT_POPULATE);
    res.status(201).json({ success: true, message: "Office hour slot created", slot });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create office hour slot", error: error.message });
  }
};

exports.getOfficeHourSlots = async (req, res) => {
  try {
    const courseId = req.params.courseId || req.query.courseId;
    let query = {};
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ success: false, message: "Course not found" });
      if (!(req.user.role === "Admin" || isCourseInstructor(course, req.user.id) || isEnrolled(course, req.user.id))) return res.status(403).json({ success: false, message: "Only course participants can view slots" });
      query.course = course._id;
    } else if (req.user.role === "Professor") {
      query.professor = req.user.id;
    } else if (req.user.role === "Student") {
      const courses = await Course.find({ enrollments: { $elemMatch: { student: req.user.id, status: "enrolled" } } }).select("_id");
      query.course = { $in: courses.map((course) => course._id) };
      query.status = "open";
    }
    const slots = await OfficeHourSlot.find(query).populate(SLOT_POPULATE).sort({ startAt: 1 }).limit(100);
    const bookings = await OfficeHourBooking.find({ slot: { $in: slots.map((slot) => slot._id) }, student: req.user.id }).populate(BOOKING_POPULATE);
    res.status(200).json({ success: true, slots, myBookings: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch office hour slots", error: error.message });
  }
};

exports.updateOfficeHourSlot = async (req, res) => {
  try {
    let slot = await OfficeHourSlot.findById(req.params.slotId).populate("course");
    if (!slot) return res.status(404).json({ success: false, message: "Office hour slot not found" });
    if (req.user.role !== "Admin" && String(slot.professor) !== String(req.user.id)) return res.status(403).json({ success: false, message: "Only slot owner can update this slot" });
    const oldStatus = slot.status;
    ["title", "mode", "location", "meetingLink", "notes"].forEach((field) => { if (req.body[field] !== undefined) slot[field] = req.body[field]; });
    if (req.body.startAt) slot.startAt = new Date(req.body.startAt);
    if (req.body.endAt) slot.endAt = new Date(req.body.endAt);
    if (req.body.capacity) slot.capacity = Math.max(Number(req.body.capacity) || 1, 1);
    if (["open", "closed", "cancelled"].includes(req.body.status)) slot.status = req.body.status;
    await slot.save();
    if (oldStatus !== "cancelled" && slot.status === "cancelled") {
      const bookings = await OfficeHourBooking.find({ slot: slot._id, status: { $in: ["requested", "confirmed"] } });
      await OfficeHourBooking.updateMany({ slot: slot._id, status: { $in: ["requested", "confirmed"] } }, { status: "cancelled" });
      await Promise.all(bookings.map((booking) => createNotification({ recipient: booking.student, sender: req.user.id, course: slot.course?._id, officeHourSlot: slot._id, officeHourBooking: booking._id, type: "Academic", message: "cancelled an office-hour slot" })));
    }
    slot = await slot.populate(SLOT_POPULATE);
    res.status(200).json({ success: true, message: "Office hour slot updated", slot });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update office hour slot", error: error.message });
  }
};

exports.bookOfficeHourSlot = async (req, res) => {
  try {
    const slot = await OfficeHourSlot.findById(req.params.slotId).populate("course");
    if (!slot) return res.status(404).json({ success: false, message: "Office hour slot not found" });
    if (req.user.role !== "Student") return res.status(403).json({ success: false, message: "Only students can book office hours" });
    if (slot.status !== "open") return res.status(400).json({ success: false, message: "This slot is not open" });
    if (slot.course && !isEnrolled(slot.course, req.user.id)) return res.status(403).json({ success: false, message: "Only enrolled students can book this slot" });
    const confirmedCount = await OfficeHourBooking.countDocuments({ slot: slot._id, status: "confirmed" });
    if (confirmedCount >= slot.capacity) return res.status(400).json({ success: false, message: "This slot is full" });
    let booking = await OfficeHourBooking.findOneAndUpdate(
      { slot: slot._id, student: req.user.id },
      { slot: slot._id, professor: slot.professor, student: req.user.id, course: slot.course?._id, reason: String(req.body.reason || "").trim(), status: "requested" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate(BOOKING_POPULATE);
    await createNotification({ recipient: slot.professor, sender: req.user.id, course: slot.course?._id, officeHourSlot: slot._id, officeHourBooking: booking._id, type: "Academic", message: "requested an office-hour booking" });
    res.status(201).json({ success: true, message: "Office hour booking requested", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to book office hour", error: error.message });
  }
};

exports.getMyOfficeHourBookings = async (req, res) => {
  try {
    const bookings = await OfficeHourBooking.find({ student: req.user.id }).populate(BOOKING_POPULATE).sort({ createdAt: -1 });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch bookings", error: error.message });
  }
};

exports.getProfessorOfficeHourBookings = async (req, res) => {
  try {
    if (!['Professor', 'Admin'].includes(req.user.role)) return res.status(403).json({ success: false, message: "Only professors can view professor bookings" });
    const query = req.user.role === "Admin" ? {} : { professor: req.user.id };
    const bookings = await OfficeHourBooking.find(query).populate(BOOKING_POPULATE).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch professor bookings", error: error.message });
  }
};

exports.updateOfficeHourBookingStatus = async (req, res) => {
  try {
    let booking = await OfficeHourBooking.findById(req.params.bookingId).populate("slot");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    const nextStatus = req.body.status;
    const isProfessor = req.user.role === "Admin" || String(booking.professor) === String(req.user.id);
    const isStudent = String(booking.student) === String(req.user.id);
    if (!isProfessor && !isStudent) return res.status(403).json({ success: false, message: "You cannot update this booking" });
    if (isStudent && nextStatus !== "cancelled") return res.status(403).json({ success: false, message: "Students can only cancel their booking" });
    if (!['confirmed', 'rejected', 'cancelled', 'completed'].includes(nextStatus)) return res.status(400).json({ success: false, message: "Valid status is required" });
    if (nextStatus === "confirmed") {
      const confirmedCount = await OfficeHourBooking.countDocuments({ slot: booking.slot._id, status: "confirmed", _id: { $ne: booking._id } });
      if (confirmedCount >= booking.slot.capacity) return res.status(400).json({ success: false, message: "This slot is full" });
    }
    booking.status = nextStatus;
    booking.note = String(req.body.note || booking.note || "").trim();
    await booking.save();
    booking = await OfficeHourBooking.findById(booking._id).populate(BOOKING_POPULATE);
    const recipient = isProfessor ? booking.student : booking.professor;
    await createNotification({ recipient, sender: req.user.id, course: booking.course?._id || booking.course, officeHourSlot: booking.slot?._id || booking.slot, officeHourBooking: booking._id, type: "Academic", message: `updated office-hour booking to ${nextStatus}` });
    res.status(200).json({ success: true, message: "Booking updated", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update booking", error: error.message });
  }
};
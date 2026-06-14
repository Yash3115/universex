const crypto = require("crypto");
const Course = require("../models/courseSchema");
const {
  canCreateCourse,
  canManageCourse,
  getEnrollment,
  isCourseInstructor,
} = require("../utils/coursePolicy");
const { buildCourseViewerContext, serializeCourse } = require("../utils/courseSerializer");

const COURSE_POPULATE = [
  { path: "professor", select: "firstName lastName email image college role verificationStatus facultyProfile", populate: { path: "facultyProfile" } },
  { path: "enrollments.student", select: "firstName lastName email image college additionalDetails", populate: { path: "additionalDetails" } },
];

const generateJoinCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();

const sendSerializedCourse = (res, status, payload, course, user) =>
  res.status(status).json({
    success: true,
    ...payload,
    course: serializeCourse(course, user),
    viewerContext: buildCourseViewerContext(course, user),
  });

exports.createCourse = async (req, res) => {
  try {
    if (!canCreateCourse(req.user)) {
      return res.status(403).json({ success: false, message: "Only professors can create courses" });
    }

    const { title, code, description = "", department = "", semester = "", academicYear = "", section = "", enrollmentPolicy = "open" } = req.body;
    if (!title?.trim() || !code?.trim()) {
      return res.status(400).json({ success: false, message: "Course title and code are required" });
    }

    let course = await Course.create({
      title: title.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      college: req.user.college,
      department: department.trim(),
      semester: semester.trim(),
      academicYear: academicYear.trim() || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      section: section.trim(),
      professor: req.user.id,
      enrollmentPolicy,
      joinCode: generateJoinCode(),
    });

    course = await course.populate(COURSE_POPULATE);
    return sendSerializedCourse(res, 201, { message: "Course created" }, course, req.user);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create course", error: error.message });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    const query = req.user.role === "Admin"
      ? { status: { $ne: "archived" } }
      : req.user.role === "Professor"
        ? { professor: req.user.id, status: { $ne: "archived" } }
        : { enrollments: { $elemMatch: { student: req.user.id, status: { $in: ["requested", "enrolled"] } } }, status: { $ne: "archived" } };

    const courses = await Course.find(query).populate(COURSE_POPULATE).sort({ updatedAt: -1 });
    return res.status(200).json({
      success: true,
      courses: courses.map((course) => serializeCourse(course, req.user)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch courses", error: error.message });
  }
};

exports.discoverCourses = async (req, res) => {
  try {
    const { search = "", department = "" } = req.query;
    const query = { college: req.user.college, status: "active" };
    if (department) query.department = department;
    if (search.trim()) {
      query.$or = [
        { title: new RegExp(search.trim(), "i") },
        { code: new RegExp(search.trim(), "i") },
        { description: new RegExp(search.trim(), "i") },
      ];
    }

    const courses = await Course.find(query).populate(COURSE_POPULATE).sort({ updatedAt: -1 }).limit(50);
    return res.status(200).json({
      success: true,
      courses: courses.map((course) => serializeCourse(course, req.user)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to discover courses", error: error.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(COURSE_POPULATE);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const canManage = canManageCourse(course, req.user);
    const enrollment = getEnrollment(course, req.user.id);
    if (!canManage && !enrollment && course.college !== req.user.college) {
      return res.status(403).json({ success: false, message: "You do not have access to this course" });
    }

    return sendSerializedCourse(res, 200, {}, course, req.user);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch course", error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!isCourseInstructor(course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only course instructors can update this course" });
    }

    const allowed = ["title", "description", "department", "semester", "academicYear", "section", "enrollmentPolicy", "status"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) course[field] = req.body[field];
    });
    await course.save();
    course = await course.populate(COURSE_POPULATE);
    return sendSerializedCourse(res, 200, { message: "Course updated" }, course, req.user);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update course", error: error.message });
  }
};

exports.joinCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (req.user.role !== "Student") {
      return res.status(403).json({ success: false, message: "Only students can join courses" });
    }
    if (course.college !== req.user.college) {
      return res.status(403).json({ success: false, message: "You can join only courses from your college" });
    }

    const { joinCode = "" } = req.body;
    if (course.enrollmentPolicy === "inviteOnly" && String(joinCode).trim().toUpperCase() !== course.joinCode) {
      return res.status(403).json({ success: false, message: "Valid join code is required" });
    }

    const existing = course.enrollments.find((item) => String(item.student) === String(req.user.id));
    if (existing) {
      course = await course.populate(COURSE_POPULATE);
      return sendSerializedCourse(res, 200, { message: "Enrollment already exists" }, course, req.user);
    }

    course.enrollments.push({
      student: req.user.id,
      status: course.enrollmentPolicy === "approval" ? "requested" : "enrolled",
    });
    await course.save();
    course = await course.populate(COURSE_POPULATE);
    return sendSerializedCourse(
      res,
      200,
      { message: course.enrollmentPolicy === "approval" ? "Enrollment requested" : "Joined course" },
      course,
      req.user
    );
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to join course", error: error.message });
  }
};

exports.updateEnrollment = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.body;
    if (!["enrolled", "rejected", "requested"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid enrollment status is required" });
    }
    let course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!isCourseInstructor(course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only course instructors can manage enrollment" });
    }
    const enrollment = course.enrollments.find((item) => String(item.student) === String(studentId));
    if (!enrollment) return res.status(404).json({ success: false, message: "Enrollment not found" });
    enrollment.status = status;
    await course.save();
    course = await course.populate(COURSE_POPULATE);
    return sendSerializedCourse(res, 200, { message: "Enrollment updated" }, course, req.user);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update enrollment", error: error.message });
  }
};

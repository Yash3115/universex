const Assignment = require("../models/assignmentSchema");
const AssignmentSubmission = require("../models/assignmentSubmissionSchema");
const Course = require("../models/courseSchema");
const AcademicTask = require("../models/academicTaskSchema");
const { createNotification } = require("../utils/notificationService");
const { uploadCourseFileToCloudinary } = require("../utils/fileUploader");

const ASSIGNMENT_POPULATE = [
  { path: "professor", select: "firstName lastName image role facultyProfile", populate: { path: "facultyProfile" } },
  { path: "course", select: "title code college department professor enrollments" },
];

const SUBMISSION_POPULATE = [
  { path: "student", select: "firstName lastName email image college additionalDetails", populate: { path: "additionalDetails" } },
  { path: "assignment", select: "title totalMarks dueDate course" },
  { path: "course", select: "title code professor" },
];

const isCourseInstructor = (course, userId) =>
  String(course.professor?._id || course.professor) === String(userId) ||
  (course.coInstructors || []).some((instructor) => String(instructor?._id || instructor) === String(userId));

const getEnrollment = (course, userId) =>
  (course.enrollments || []).find((item) => String(item.student?._id || item.student) === String(userId));

const isEnrolled = (course, userId) => getEnrollment(course, userId)?.status === "enrolled";

const canViewAssignment = (course, assignment, user) => {
  if (user.role === "Admin" || isCourseInstructor(course, user.id)) return true;
  if (assignment.visibility === "public") return true;
  if (assignment.visibility === "college") return course.college === user.college;
  return isEnrolled(course, user.id);
};

const uploadMaybe = async (file, folder) => (file ? uploadCourseFileToCloudinary(file, folder) : null);

const enrichAssignments = async (assignments, user) => {
  const assignmentIds = assignments.map((assignment) => assignment._id);
  const [submissions, allCounts] = await Promise.all([
    AssignmentSubmission.find({ assignment: { $in: assignmentIds }, student: user.id }),
    AssignmentSubmission.aggregate([
      { $match: { assignment: { $in: assignmentIds } } },
      { $group: { _id: { assignment: "$assignment", status: "$status" }, count: { $sum: 1 } } },
    ]),
  ]);

  const submissionMap = new Map(submissions.map((submission) => [String(submission.assignment), submission]));
  const countMap = new Map();
  allCounts.forEach((item) => {
    const key = String(item._id.assignment);
    const current = countMap.get(key) || { submitted: 0, graded: 0, late: 0, total: 0 };
    current[item._id.status] = item.count;
    current.total += item.count;
    countMap.set(key, current);
  });

  return assignments.map((assignment) => {
    const data = assignment.toObject ? assignment.toObject() : assignment;
    return {
      ...data,
      mySubmission: submissionMap.get(String(assignment._id)) || null,
      submissionSummary: countMap.get(String(assignment._id)) || { submitted: 0, graded: 0, late: 0, total: 0 },
    };
  });
};

exports.createAssignment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!isCourseInstructor(course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only course instructors can create assignments" });
    }

    const title = String(req.body.title || "").trim();
    if (!title) return res.status(400).json({ success: false, message: "Assignment title is required" });

    const attachment = await uploadMaybe(req.files?.assignmentFile || req.files?.file, `${process.env.FOLDER_NAME || "universex"}/assignments`);
    let assignment = await Assignment.create({
      course: course._id,
      professor: req.user.id,
      title,
      description: String(req.body.description || "").trim(),
      attachment,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      totalMarks: Number(req.body.totalMarks) || 100,
      status: ["draft", "published", "closed"].includes(req.body.status) ? req.body.status : "published",
      visibility: ["enrolled", "college", "public"].includes(req.body.visibility) ? req.body.visibility : "enrolled",
      allowLateSubmission: req.body.allowLateSubmission !== "false" && req.body.allowLateSubmission !== false,
    });
    assignment = await assignment.populate(ASSIGNMENT_POPULATE);

    const enrolledStudentIds = (course.enrollments || [])
      .filter((enrollment) => enrollment.status === "enrolled")
      .map((enrollment) => enrollment.student);

    if (assignment.status === "published") {
      await Promise.all(
        enrolledStudentIds.map((studentId) =>
          AcademicTask.findOneAndUpdate(
            { user: studentId, source: "assignment", sourceId: assignment._id },
            {
              user: studentId,
              title: assignment.title,
              subject: course.code,
              description: assignment.description,
              dueDate: assignment.dueDate,
              priority: "high",
              source: "assignment",
              sourceId: assignment._id,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
        )
      );

      await Promise.all(
        enrolledStudentIds
          .filter((studentId) => String(studentId) !== String(req.user.id))
          .map((recipient) =>
            createNotification({
              recipient,
              sender: req.user.id,
              course: course._id,
              assignment: assignment._id,
              type: "Academic",
              message: `published a new assignment in ${course.code}`,
            })
          )
      );
    }

    res.status(201).json({ success: true, message: "Assignment created", assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create assignment", error: error.message });
  }
};

exports.getCourseAssignments = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const query = { course: course._id };
    if (!(req.user.role === "Admin" || isCourseInstructor(course, req.user.id))) query.status = { $ne: "draft" };

    const assignments = await Assignment.find(query).populate(ASSIGNMENT_POPULATE).sort({ dueDate: 1, createdAt: -1 });
    const visibleAssignments = assignments.filter((assignment) => canViewAssignment(course, assignment, req.user));
    const enrichedAssignments = await enrichAssignments(visibleAssignments, req.user);
    const enrollment = getEnrollment(course, req.user.id);

    res.status(200).json({
      success: true,
      assignments: enrichedAssignments,
      viewerContext: {
        isInstructor: req.user.role === "Admin" || isCourseInstructor(course, req.user.id),
        isEnrolled: enrollment?.status === "enrolled",
        enrollmentStatus: enrollment?.status || "none",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch assignments", error: error.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId).populate("course");
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
    const course = assignment.course;
    if (!isEnrolled(course, req.user.id)) {
      return res.status(403).json({ success: false, message: "Only enrolled students can submit" });
    }
    if (assignment.status === "closed") return res.status(400).json({ success: false, message: "Assignment is closed" });

    const now = new Date();
    const isLate = assignment.dueDate && now > assignment.dueDate;
    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({ success: false, message: "Late submissions are not allowed" });
    }

    const file = await uploadMaybe(req.files?.submissionFile || req.files?.file, `${process.env.FOLDER_NAME || "universex"}/submissions`);
    let submission = await AssignmentSubmission.findOneAndUpdate(
      { assignment: assignment._id, student: req.user.id },
      {
        assignment: assignment._id,
        course: course._id,
        student: req.user.id,
        textAnswer: String(req.body.textAnswer || "").trim(),
        ...(file ? { file } : {}),
        submittedAt: now,
        status: isLate ? "late" : "submitted",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate(SUBMISSION_POPULATE);

    await createNotification({
      recipient: assignment.professor,
      sender: req.user.id,
      course: course._id,
      assignment: assignment._id,
      submission: submission._id,
      type: "Academic",
      message: `submitted ${assignment.title}`,
    });

    await AcademicTask.findOneAndUpdate(
      { user: req.user.id, source: "assignment", sourceId: assignment._id },
      { status: "done" }
    );

    res.status(200).json({ success: true, message: "Assignment submitted", submission });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to submit assignment", error: error.message });
  }
};

exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId).populate("course");
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
    if (!isCourseInstructor(assignment.course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only course instructors can view submissions" });
    }

    const submissions = await AssignmentSubmission.find({ assignment: assignment._id }).populate(SUBMISSION_POPULATE).sort({ submittedAt: -1 });
    res.status(200).json({ success: true, submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch submissions", error: error.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    let submission = await AssignmentSubmission.findById(req.params.submissionId).populate({ path: "assignment", populate: { path: "course" } });
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
    if (!isCourseInstructor(submission.assignment.course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only course instructors can grade submissions" });
    }

    submission.marksAwarded = req.body.marksAwarded !== undefined ? Number(req.body.marksAwarded) : submission.marksAwarded;
    submission.feedback = String(req.body.feedback || "").trim();
    submission.status = "graded";
    await submission.save();
    submission = await AssignmentSubmission.findById(submission._id).populate(SUBMISSION_POPULATE);

    await createNotification({
      recipient: submission.student,
      sender: req.user.id,
      course: submission.course,
      assignment: submission.assignment,
      submission: submission._id,
      type: "Academic",
      message: `graded your submission for ${submission.assignment.title}`,
    });

    res.status(200).json({ success: true, message: "Submission graded", submission });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to grade submission", error: error.message });
  }
};
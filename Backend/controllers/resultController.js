const Assessment = require("../models/assessmentSchema");
const Course = require("../models/courseSchema");
const GradeRecord = require("../models/gradeRecordSchema");
const { createNotification } = require("../utils/notificationService");

const ASSESSMENT_POPULATE = [
  { path: "professor", select: "firstName lastName image role facultyProfile", populate: { path: "facultyProfile" } },
  { path: "course", select: "title code college department professor enrollments" },
];

const GRADE_POPULATE = [
  { path: "student", select: "firstName lastName email image college additionalDetails", populate: { path: "additionalDetails" } },
  { path: "assessment", select: "title type maxMarks status visibleFrom publishedAt course" },
  { path: "course", select: "title code professor" },
];

const isCourseInstructor = (course, userId) =>
  String(course.professor?._id || course.professor) === String(userId) ||
  (course.coInstructors || []).some((instructor) => String(instructor?._id || instructor) === String(userId));

const getEnrollment = (course, userId) =>
  (course.enrollments || []).find((item) => String(item.student?._id || item.student) === String(userId));

const sanitizeGradeForStudent = (gradeRecord) => {
  const data = gradeRecord.toObject ? gradeRecord.toObject() : { ...gradeRecord };
  delete data.privateNote;
  return data;
};

const canStudentSeeAssessment = (assessment) => {
  if (assessment.status !== "published") return false;
  if (!assessment.visibleFrom) return true;
  return new Date(assessment.visibleFrom) <= new Date();
};

const enrichAssessments = async (assessments, user) => {
  const ids = assessments.map((assessment) => assessment._id);
  const [myGrades, counts] = await Promise.all([
    GradeRecord.find({ assessment: { $in: ids }, student: user.id }).populate(GRADE_POPULATE),
    GradeRecord.aggregate([{ $match: { assessment: { $in: ids } } }, { $group: { _id: "$assessment", count: { $sum: 1 }, avg: { $avg: "$marks" } } }]),
  ]);
  const myGradeMap = new Map(myGrades.map((grade) => [String(grade.assessment?._id || grade.assessment), sanitizeGradeForStudent(grade)]));
  const countMap = new Map(counts.map((item) => [String(item._id), { count: item.count, average: Math.round((item.avg || 0) * 100) / 100 }]));
  return assessments.map((assessment) => {
    const data = assessment.toObject ? assessment.toObject() : assessment;
    return {
      ...data,
      myGrade: myGradeMap.get(String(assessment._id)) || null,
      gradeSummary: countMap.get(String(assessment._id)) || { count: 0, average: 0 },
    };
  });
};

exports.createAssessment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!isCourseInstructor(course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only course instructors can create assessments" });
    }
    const title = String(req.body.title || "").trim();
    if (!title) return res.status(400).json({ success: false, message: "Assessment title is required" });

    let assessment = await Assessment.create({
      course: course._id,
      professor: req.user.id,
      title,
      type: ["Quiz", "MidSem", "EndSem", "Assignment", "Lab", "Internal", "Other"].includes(req.body.type) ? req.body.type : "Quiz",
      maxMarks: Number(req.body.maxMarks) || 100,
      weightage: Number(req.body.weightage) || 0,
      description: String(req.body.description || "").trim(),
      status: ["draft", "published", "archived"].includes(req.body.status) ? req.body.status : "draft",
      visibleFrom: req.body.visibleFrom ? new Date(req.body.visibleFrom) : undefined,
      publishedAt: req.body.status === "published" ? new Date() : undefined,
    });
    assessment = await assessment.populate(ASSESSMENT_POPULATE);
    res.status(201).json({ success: true, message: "Assessment created", assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create assessment", error: error.message });
  }
};

exports.getCourseAssessments = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    const enrollment = getEnrollment(course, req.user.id);
    const isInstructor = req.user.role === "Admin" || isCourseInstructor(course, req.user.id);
    if (!isInstructor && enrollment?.status !== "enrolled") {
      return res.status(403).json({ success: false, message: "Only enrolled students can view results" });
    }
    const query = { course: course._id };
    if (!isInstructor) query.status = "published";
    const assessments = await Assessment.find(query).populate(ASSESSMENT_POPULATE).sort({ createdAt: -1 });
    const visible = isInstructor ? assessments : assessments.filter(canStudentSeeAssessment);
    res.status(200).json({
      success: true,
      assessments: await enrichAssessments(visible, req.user),
      viewerContext: { isInstructor, enrollmentStatus: enrollment?.status || "none" },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch assessments", error: error.message });
  }
};

exports.saveAssessmentGrades = async (req, res) => {
  try {
    let assessment = await Assessment.findById(req.params.assessmentId).populate("course");
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });
    const course = assessment.course;
    if (!isCourseInstructor(course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only course instructors can save grades" });
    }
    const grades = Array.isArray(req.body.grades) ? req.body.grades : [];
    const saved = await Promise.all(grades.map((grade) =>
      GradeRecord.findOneAndUpdate(
        { assessment: assessment._id, student: grade.studentId },
        {
          assessment: assessment._id,
          course: course._id,
          student: grade.studentId,
          marks: Number(grade.marks) || 0,
          grade: String(grade.grade || "").trim(),
          feedback: String(grade.feedback || "").trim(),
          privateNote: String(grade.privateNote || "").trim(),
          publishedAt: assessment.status === "published" ? new Date() : undefined,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).populate(GRADE_POPULATE)
    ));
    res.status(200).json({ success: true, message: "Grades saved", grades: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save grades", error: error.message });
  }
};

exports.getAssessmentGrades = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId).populate("course");
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });
    if (!isCourseInstructor(assessment.course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only course instructors can view gradebook" });
    }
    const grades = await GradeRecord.find({ assessment: assessment._id }).populate(GRADE_POPULATE).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, grades });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch grades", error: error.message });
  }
};

exports.publishAssessment = async (req, res) => {
  try {
    let assessment = await Assessment.findById(req.params.assessmentId).populate("course");
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });
    if (!isCourseInstructor(assessment.course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only course instructors can publish results" });
    }
    assessment.status = req.body.status === "draft" ? "draft" : "published";
    assessment.visibleFrom = req.body.visibleFrom ? new Date(req.body.visibleFrom) : assessment.visibleFrom;
    assessment.publishedAt = assessment.status === "published" ? new Date() : undefined;
    await assessment.save();

    const grades = await GradeRecord.find({ assessment: assessment._id });
    if (assessment.status === "published") {
      await GradeRecord.updateMany({ assessment: assessment._id }, { publishedAt: new Date() });
      await Promise.all(grades.map((grade) => createNotification({
        recipient: grade.student,
        sender: req.user.id,
        course: assessment.course._id,
        assessment: assessment._id,
        type: "Academic",
        message: `published ${assessment.title} result in ${assessment.course.code}`,
      })));
    }
    assessment = await assessment.populate(ASSESSMENT_POPULATE);
    res.status(200).json({ success: true, message: "Assessment updated", assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to publish assessment", error: error.message });
  }
};

exports.getMyResults = async (req, res) => {
  try {
    const grades = await GradeRecord.find({ student: req.user.id, publishedAt: { $ne: null } }).populate(GRADE_POPULATE).sort({ publishedAt: -1 });
    const visible = grades.filter((grade) => grade.assessment && canStudentSeeAssessment(grade.assessment));
    res.status(200).json({ success: true, results: visible.map(sanitizeGradeForStudent) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch results", error: error.message });
  }
};
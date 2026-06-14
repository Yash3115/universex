const crypto = require("crypto");
const AiArtifact = require("../models/aiArtifactSchema");
const AiUsage = require("../models/aiUsageSchema");
const AccessRequest = require("../models/accessRequestSchema");
const AcademicTask = require("../models/academicTaskSchema");
const Assignment = require("../models/assignmentSchema");
const Course = require("../models/courseSchema");
const CourseAnnouncement = require("../models/courseAnnouncementSchema");
const CourseMaterial = require("../models/courseMaterialSchema");
const GradeRecord = require("../models/gradeRecordSchema");
const Job = require("../models/jobSchema");
const OfficeHourBooking = require("../models/officeHourBookingSchema");
const Post = require("../models/postSchema");
const { buildAiMessages } = require("../utils/aiPrompts");
const { generateAiResponse, getAiConfig } = require("../utils/aiProvider");
const { canManageCourse, getEnrollment, isEnrolled, normalizeId } = require("../utils/coursePolicy");

const ALLOWED_KINDS = new Set([
  "summarize",
  "simplify",
  "action-items",
  "study-notes",
  "flashcards",
  "practice-questions",
  "glossary",
  "dashboard-digest",
  "professor-draft",
  "moderation-triage",
  "access-request-summary",
]);

const SOURCE_TYPES = new Set([
  "material",
  "announcement",
  "assignment",
  "job",
  "post",
  "result",
  "dashboard",
  "course",
  "reportedPost",
  "accessRequest",
]);

const text = (value) => String(value || "").trim();

const hashPrompt = (prompt = {}) =>
  crypto.createHash("sha1").update(JSON.stringify(prompt || {})).digest("hex");

const dateKey = () => new Date().toISOString().slice(0, 10);

const sourceVersion = (document, fallback = "") =>
  String(document?.version || document?.updatedAt?.getTime?.() || document?.createdAt?.getTime?.() || fallback || "");

const isMaterialReleasedForStudents = (material, now = new Date()) => {
  if (["archived", "draft"].includes(material.status)) return false;
  if (material.status === "scheduled") return Boolean(material.releaseAt && new Date(material.releaseAt) <= now);
  if (material.releaseAt && new Date(material.releaseAt) > now) return false;
  return true;
};

const canViewMaterial = (course, material, user) => {
  if (canManageCourse(course, user)) return true;
  if (!isMaterialReleasedForStudents(material)) return false;
  return user.role === "Student" ? isEnrolled(course, user.id) : material.visibility === "public" || material.visibility === "college";
};

const canViewAnnouncement = (course, announcement, user) => {
  if (canManageCourse(course, user)) return true;
  if (announcement.visibility === "public") return true;
  if (announcement.visibility === "college") return course.college === user.college;
  return isEnrolled(course, user.id);
};

const canViewAssignment = (course, assignment, user) => {
  if (canManageCourse(course, user)) return true;
  if (assignment.status !== "published") return false;
  if (assignment.visibility === "public") return true;
  if (assignment.visibility === "college") return course.college === user.college;
  return isEnrolled(course, user.id);
};

const canSeeGradeRecord = (record, user) => {
  if (canManageCourse(record.course, user)) return true;
  if (normalizeId(record.student) !== normalizeId(user.id)) return false;
  if (!record.publishedAt || record.assessment?.status !== "published") return false;
  if (!record.assessment?.visibleFrom) return true;
  return new Date(record.assessment.visibleFrom) <= new Date();
};

const requireAdmin = (user) => {
  if (user?.role !== "Admin") {
    const error = new Error("Only admins can use this AI action");
    error.status = 403;
    throw error;
  }
};

const getCourseOrThrow = async (courseId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error("Course not found");
    error.status = 404;
    throw error;
  }
  return course;
};

const ensureAllowed = (condition, message = "You cannot use AI on this source") => {
  if (!condition) {
    const error = new Error(message);
    error.status = 403;
    throw error;
  }
};

const fetchMaterialContext = async ({ sourceId, user }) => {
  const material = await CourseMaterial.findById(sourceId).populate("uploadedBy", "firstName lastName").populate("course");
  if (!material || !material.course) {
    const error = new Error("Material not found");
    error.status = 404;
    throw error;
  }
  ensureAllowed(canViewMaterial(material.course, material, user), "You cannot access this material");

  return {
    course: material.course._id,
    canManage: canManageCourse(material.course, user),
    sourceTitle: material.title,
    sourceVersion: sourceVersion(material),
    sourceText: [
      `Course: ${material.course.code} ${material.course.title}`,
      `Type: ${material.type}`,
      `Topic: ${material.topic}`,
      `Week: ${material.week || ""}`,
      `Module: ${material.module}`,
      `Description: ${material.description}`,
      `Tags: ${(material.tags || []).join(", ")}`,
      `External URL: ${material.externalUrl}`,
      `Uploaded by: ${material.uploadedBy?.firstName || ""} ${material.uploadedBy?.lastName || ""}`,
    ].join("\n"),
  };
};

const fetchAnnouncementContext = async ({ sourceId, user }) => {
  const announcement = await CourseAnnouncement.findById(sourceId).populate("author", "firstName lastName").populate("course");
  if (!announcement || !announcement.course) {
    const error = new Error("Announcement not found");
    error.status = 404;
    throw error;
  }
  ensureAllowed(canViewAnnouncement(announcement.course, announcement, user), "You cannot access this announcement");

  return {
    course: announcement.course._id,
    canManage: canManageCourse(announcement.course, user),
    sourceTitle: announcement.title,
    sourceVersion: sourceVersion(announcement),
    sourceText: [
      `Course: ${announcement.course.code} ${announcement.course.title}`,
      `Priority: ${announcement.priority}`,
      `Visibility: ${announcement.visibility}`,
      `Expires: ${announcement.expiresAt || ""}`,
      `Body: ${announcement.body}`,
    ].join("\n"),
  };
};

const fetchAssignmentContext = async ({ sourceId, user }) => {
  const assignment = await Assignment.findById(sourceId).populate("course");
  if (!assignment || !assignment.course) {
    const error = new Error("Assignment not found");
    error.status = 404;
    throw error;
  }
  ensureAllowed(canViewAssignment(assignment.course, assignment, user), "You cannot access this assignment");

  return {
    course: assignment.course._id,
    canManage: canManageCourse(assignment.course, user),
    sourceTitle: assignment.title,
    sourceVersion: sourceVersion(assignment),
    sourceText: [
      `Course: ${assignment.course.code} ${assignment.course.title}`,
      `Status: ${assignment.status}`,
      `Due date: ${assignment.dueDate || ""}`,
      `Total marks: ${assignment.totalMarks}`,
      `Late submission: ${assignment.allowLateSubmission ? "allowed" : "not allowed"}`,
      `Description: ${assignment.description}`,
    ].join("\n"),
  };
};

const fetchJobContext = async ({ sourceId }) => {
  const job = await Job.findById(sourceId).populate("postedBy", "firstName lastName role");
  if (!job) {
    const error = new Error("Opportunity not found");
    error.status = 404;
    throw error;
  }

  return {
    sourceTitle: job.title,
    sourceVersion: sourceVersion(job),
    sourceText: [
      `Title: ${job.title}`,
      `Company: ${job.companyName}`,
      `Type: ${job.opportunityType} ${job.jobType}`,
      `Location: ${job.location}`,
      `Deadline: ${job.lastDateToApply || ""}`,
      `Stipend: ${job.stipend}`,
      `Skills: ${(job.skills || []).join(", ")}`,
      `Eligibility: ${job.eligibility}`,
      `Description: ${job.description}`,
      `Instructions: ${job.importantInstructions}`,
    ].join("\n"),
  };
};

const fetchPostContext = async ({ sourceId, sourceType, user }) => {
  const post = await Post.findById(sourceId).populate("user", "firstName lastName email college").populate("reports.user", "firstName lastName email");
  if (!post) {
    const error = new Error("Post not found");
    error.status = 404;
    throw error;
  }
  if (sourceType === "reportedPost") requireAdmin(user);
  ensureAllowed(user.role === "Admin" || post.college === user.college, "You cannot access this post");

  return {
    sourceTitle: `${post.category || "Community"} post`,
    sourceVersion: sourceVersion(post),
    sourceText: [
      `Author: ${post.user?.firstName || ""} ${post.user?.lastName || ""}`,
      `College: ${post.college}`,
      `Category: ${post.category}`,
      `Tags: ${(post.tags || []).join(", ")}`,
      `Content: ${post.content}`,
      `Reports: ${(post.reports || []).map((report) => report.reason || "No reason").join(" | ")}`,
    ].join("\n"),
  };
};

const fetchResultContext = async ({ sourceId, user }) => {
  const record = await GradeRecord.findById(sourceId)
    .populate("assessment", "title type maxMarks status visibleFrom description")
    .populate("course", "title code professor coInstructors enrollments")
    .populate("student", "firstName lastName");
  if (!record || !record.assessment || !record.course) {
    const error = new Error("Result not found");
    error.status = 404;
    throw error;
  }
  ensureAllowed(canSeeGradeRecord(record, user), "You cannot access this result");

  return {
    course: record.course._id,
    canManage: canManageCourse(record.course, user),
    sourceTitle: record.assessment.title,
    sourceVersion: sourceVersion(record),
    sourceText: [
      `Course: ${record.course.code} ${record.course.title}`,
      `Assessment: ${record.assessment.title}`,
      `Type: ${record.assessment.type}`,
      `Marks: ${record.marks}/${record.assessment.maxMarks}`,
      `Grade: ${record.grade}`,
      `Feedback: ${record.feedback}`,
    ].join("\n"),
  };
};

const fetchDashboardContext = async ({ user }) => {
  ensureAllowed(user.role === "Student", "Dashboard AI digest is available for students");
  const [tasks, courses, grades, bookings] = await Promise.all([
    AcademicTask.find({ user: user.id, status: { $ne: "done" } }).sort({ dueDate: 1 }).limit(8),
    Course.find({ enrollments: { $elemMatch: { student: user.id, status: "enrolled" } }, status: { $ne: "archived" } }).limit(8),
    GradeRecord.find({ student: user.id, publishedAt: { $ne: null } }).populate("assessment", "title type maxMarks status").populate("course", "title code").sort({ publishedAt: -1 }).limit(5),
    OfficeHourBooking.find({ student: user.id }).populate("slot", "title startAt").populate("course", "title code").sort({ updatedAt: -1 }).limit(5),
  ]);
  const courseIds = courses.map((course) => course._id);
  const materials = courseIds.length
    ? await CourseMaterial.find({ course: { $in: courseIds }, status: { $in: ["published", null] } }).populate("course", "title code").sort({ pinned: -1, publishedAt: -1 }).limit(8)
    : [];
  const visibleMaterials = materials.filter((material) => isMaterialReleasedForStudents(material));

  return {
    sourceTitle: "Student academic digest",
    sourceVersion: dateKey(),
    sourceText: [
      `Student: ${user.firstName} ${user.lastName}`,
      `Tasks: ${tasks.map((task) => `${task.title} (${task.priority}, due ${task.dueDate || "not set"})`).join("; ")}`,
      `Courses: ${courses.map((course) => `${course.code} ${course.title}`).join("; ")}`,
      `Recent materials: ${visibleMaterials.map((material) => `${material.course?.code || ""}: ${material.title}`).join("; ")}`,
      `Recent results: ${grades.map((grade) => `${grade.course?.code || ""} ${grade.assessment?.title}: ${grade.marks}/${grade.assessment?.maxMarks || ""} ${grade.grade}`).join("; ")}`,
      `Office bookings: ${bookings.map((booking) => `${booking.course?.code || ""} ${booking.slot?.title || ""} ${booking.status}`).join("; ")}`,
    ].join("\n"),
  };
};

const fetchCourseDraftContext = async ({ sourceId, user, prompt }) => {
  const course = await getCourseOrThrow(sourceId);
  ensureAllowed(canManageCourse(course, user), "Only course instructors can use professor AI drafts");

  return {
    course: course._id,
    canManage: true,
    sourceTitle: course.title,
    sourceVersion: `${sourceVersion(course)}:${text(prompt?.draftType)}:${text(prompt?.topic)}`,
    sourceText: [
      `Course: ${course.code} ${course.title}`,
      `Department: ${course.department}`,
      `Description: ${course.description}`,
      `Requested draft type: ${prompt?.draftType || "course draft"}`,
      `Topic/context: ${prompt?.topic || ""}`,
      `Tone: ${prompt?.tone || "clear and academic"}`,
    ].join("\n"),
  };
};

const fetchAccessRequestContext = async ({ sourceId, user }) => {
  requireAdmin(user);
  const request = await AccessRequest.findById(sourceId);
  if (!request) {
    const error = new Error("Access request not found");
    error.status = 404;
    throw error;
  }

  return {
    sourceTitle: `${request.name} access request`,
    sourceVersion: sourceVersion(request),
    sourceText: [
      `Name: ${request.name}`,
      `Email: ${request.email}`,
      `Role: ${request.role}`,
      `College: ${request.college}`,
      `Source: ${request.source}`,
      `Status: ${request.status}`,
      `Message: ${request.message}`,
    ].join("\n"),
  };
};

const getSourceContext = async ({ sourceType, sourceId, user, prompt }) => {
  if (sourceType === "material") return fetchMaterialContext({ sourceId, user });
  if (sourceType === "announcement") return fetchAnnouncementContext({ sourceId, user });
  if (sourceType === "assignment") return fetchAssignmentContext({ sourceId, user });
  if (sourceType === "job") return fetchJobContext({ sourceId, user });
  if (sourceType === "post" || sourceType === "reportedPost") return fetchPostContext({ sourceId, sourceType, user });
  if (sourceType === "result") return fetchResultContext({ sourceId, user });
  if (sourceType === "dashboard") return fetchDashboardContext({ user });
  if (sourceType === "course") return fetchCourseDraftContext({ sourceId, user, prompt });
  if (sourceType === "accessRequest") return fetchAccessRequestContext({ sourceId, user });

  const error = new Error("Unsupported AI source");
  error.status = 400;
  throw error;
};

const getDailyQuota = (user) => {
  if (user?.isDemo) return Number(process.env.AI_DEMO_DAILY_QUOTA) || 8;
  return Number(process.env.AI_DAILY_QUOTA) || 20;
};

const consumeQuota = async (user) => {
  const key = dateKey();
  const usage = await AiUsage.findOneAndUpdate(
    { user: user.id, dateKey: key },
    { $setOnInsert: { user: user.id, dateKey: key } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (usage.requests >= getDailyQuota(user)) {
    const error = new Error("Daily AI quota reached. Try again tomorrow.");
    error.status = 429;
    throw error;
  }

  usage.requests += 1;
  await usage.save();
  return usage;
};

const updateUsage = async (usage, providerResult) => {
  if (!usage) return;
  usage.inputTokens += providerResult.usage?.prompt_tokens || 0;
  usage.outputTokens += providerResult.usage?.completion_tokens || 0;
  usage.lastRateLimit = providerResult.rateLimit || {};
  await usage.save();
};

const serializeArtifact = (artifact, cached = false) => ({
  _id: artifact._id,
  sourceType: artifact.sourceType,
  sourceId: artifact.sourceId,
  sourceVersion: artifact.sourceVersion,
  kind: artifact.kind,
  prompt: artifact.prompt,
  provider: artifact.provider,
  model: artifact.model,
  content: artifact.content,
  usage: artifact.usage,
  rateLimit: artifact.rateLimit,
  cached,
  createdAt: artifact.createdAt,
  updatedAt: artifact.updatedAt,
});

exports.generateAiArtifact = async (req, res) => {
  try {
    const config = getAiConfig();
    if (!config.enabled) {
      return res.status(503).json({ success: false, message: "AI features are currently disabled" });
    }
    if (!config.apiKey) {
      return res.status(503).json({ success: false, message: "Groq API key is not configured" });
    }

    const sourceType = text(req.body.sourceType);
    const kind = text(req.body.kind);
    const prompt = req.body.prompt && typeof req.body.prompt === "object" ? req.body.prompt : {};
    const sourceId = sourceType === "dashboard" ? normalizeId(req.user.id) : text(req.body.sourceId);

    if (!SOURCE_TYPES.has(sourceType)) {
      return res.status(400).json({ success: false, message: "Unsupported AI source type" });
    }
    if (!ALLOWED_KINDS.has(kind)) {
      return res.status(400).json({ success: false, message: "Unsupported AI action" });
    }
    if (!sourceId) {
      return res.status(400).json({ success: false, message: "Source id is required" });
    }

    const context = await getSourceContext({ sourceType, sourceId, user: req.user, prompt });
    if (kind === "professor-draft" && !context.canManage) {
      return res.status(403).json({ success: false, message: "Only course instructors can generate professor AI drafts" });
    }
    if (kind === "moderation-triage" && sourceType !== "reportedPost") {
      return res.status(400).json({ success: false, message: "Moderation triage requires a reported post source" });
    }
    if (kind === "access-request-summary" && sourceType !== "accessRequest") {
      return res.status(400).json({ success: false, message: "Access request summaries require an access request source" });
    }
    if (kind === "dashboard-digest" && sourceType !== "dashboard") {
      return res.status(400).json({ success: false, message: "Dashboard digests require a dashboard source" });
    }
    const promptHash = hashPrompt(prompt);
    const cacheQuery = {
      user: req.user.id,
      sourceType,
      sourceId,
      sourceVersion: context.sourceVersion,
      kind,
      promptHash,
    };

    const cached = await AiArtifact.findOne(cacheQuery);
    if (cached) {
      return res.status(200).json({ success: true, artifact: serializeArtifact(cached, true) });
    }

    const usage = await consumeQuota(req.user);
    const providerResult = await generateAiResponse({
      model: config.model,
      messages: buildAiMessages({
        kind,
        sourceTitle: context.sourceTitle,
        sourceType,
        sourceText: context.sourceText,
        prompt,
        userRole: req.user.role,
      }),
    });
    await updateUsage(usage, providerResult);

    const artifact = await AiArtifact.findOneAndUpdate(
      cacheQuery,
      {
        ...cacheQuery,
        prompt,
        course: context.course,
        provider: providerResult.provider,
        model: providerResult.model,
        content: providerResult.content,
        usage: providerResult.usage,
        rateLimit: providerResult.rateLimit,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ success: true, artifact: serializeArtifact(artifact, false) });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.status === 429 ? "AI quota is temporarily unavailable. Please try again later." : error.message || "AI request failed",
      rateLimit: error.rateLimit || undefined,
    });
  }
};

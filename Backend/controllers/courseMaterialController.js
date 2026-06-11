const Course = require("../models/courseSchema");
const CourseMaterial = require("../models/courseMaterialSchema");
const { createNotification } = require("../utils/notificationService");
const { deleteCourseFileFromCloudinary, uploadCourseFileToCloudinary } = require("../utils/fileUploader");

const MATERIAL_TYPES = ["lecture", "notes", "reference", "lab", "syllabus", "assignment-brief", "recording", "link", "other"];
const MATERIAL_STATUSES = ["draft", "published", "scheduled", "archived"];
const RESOURCE_KINDS = ["file", "link", "recording", "mixed"];
const MATERIAL_VISIBILITIES = ["enrolled", "college", "public"];

const MATERIAL_POPULATE = [
  { path: "uploadedBy", select: "firstName lastName image role facultyProfile", populate: { path: "facultyProfile" } },
  { path: "course", select: "title code college department professor enrollments" },
];

const isCourseInstructor = (course, userId) =>
  String(course.professor?._id || course.professor) === String(userId) ||
  (course.coInstructors || []).some((instructor) => String(instructor?._id || instructor) === String(userId));

const canManageMaterials = (course, user) => user.role === "Admin" || isCourseInstructor(course, user.id);

const getEnrollment = (course, userId) =>
  (course.enrollments || []).find((item) => String(item.student?._id || item.student) === String(userId));

const isEnrolled = (course, userId) => getEnrollment(course, userId)?.status === "enrolled";

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 10);
  return String(tags || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 10);
};

const normalizeStatus = (status) => (MATERIAL_STATUSES.includes(status) ? status : "published");

const normalizeResourceKind = (resourceKind, hasFile, hasExternalUrl, type) => {
  if (RESOURCE_KINDS.includes(resourceKind)) return resourceKind;
  if (type === "recording") return "recording";
  if (hasFile && hasExternalUrl) return "mixed";
  if (hasFile) return "file";
  return "link";
};

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  return value === true || value === "true" || value === "1";
};

const parseDate = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const parseWeek = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const week = Number(value);
  return Number.isFinite(week) && week > 0 ? Math.round(week) : null;
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isMaterialReleasedForStudents = (material, now = new Date()) => {
  const status = normalizeStatus(material.status);
  if (status === "archived" || status === "draft") return false;
  if (status === "scheduled") return Boolean(material.releaseAt && new Date(material.releaseAt) <= now);
  if (material.releaseAt && new Date(material.releaseAt) > now) return false;
  return true;
};

const canViewMaterial = (course, material, user) => {
  if (canManageMaterials(course, user)) return true;
  if (!isMaterialReleasedForStudents(material)) return false;

  if (user.role === "Student") {
    return isEnrolled(course, user.id);
  }

  if (material.visibility === "public") return true;
  if (material.visibility === "college") return course.college === user.college;
  return isEnrolled(course, user.id);
};

const hasMaterialResource = (material) => Boolean(material.externalUrl || material.file?.url || material.file?.publicId);

const hasStudentState = (states = [], userId) =>
  states.some((state) => String(state.student?._id || state.student) === String(userId));

const serializeMaterial = (course, material, user) => {
  const canManage = canManageMaterials(course, user);
  const plain = material.toObject ? material.toObject({ virtuals: true }) : { ...material };
  const readBy = plain.readBy || [];
  const bookmarkedBy = plain.bookmarkedBy || [];
  const isRead = hasStudentState(readBy, user.id);
  const isBookmarked = hasStudentState(bookmarkedBy, user.id);

  delete plain.readBy;
  delete plain.bookmarkedBy;

  if (!canManage && plain.file && plain.allowDownload === false) {
    plain.file = { ...plain.file, url: "" };
  }

  return {
    ...plain,
    status: normalizeStatus(plain.status),
    allowDownload: plain.allowDownload !== false,
    isRead,
    isBookmarked,
    canManage,
    canOpenResource: Boolean(plain.externalUrl || plain.file?.url),
    readCount: canManage ? readBy.length : undefined,
    bookmarkCount: canManage ? bookmarkedBy.length : undefined,
  };
};

const buildMaterialPayload = (body = {}, { isCreate = false, existing = null, hasUploadFile = false } = {}) => {
  const payload = {};

  if (isCreate || Object.prototype.hasOwnProperty.call(body, "title")) {
    payload.title = String(body.title || "").trim();
    if (!payload.title) return { error: "Material title is required" };
  }

  if (isCreate || Object.prototype.hasOwnProperty.call(body, "description")) {
    payload.description = String(body.description || "").trim();
  }

  if (isCreate || Object.prototype.hasOwnProperty.call(body, "type")) {
    payload.type = MATERIAL_TYPES.includes(body.type) ? body.type : "lecture";
  }

  if (isCreate || Object.prototype.hasOwnProperty.call(body, "status")) {
    payload.status = normalizeStatus(body.status);
  }

  if (isCreate || Object.prototype.hasOwnProperty.call(body, "visibility")) {
    payload.visibility = MATERIAL_VISIBILITIES.includes(body.visibility) ? body.visibility : "enrolled";
  }

  if (isCreate || Object.prototype.hasOwnProperty.call(body, "externalUrl")) {
    payload.externalUrl = String(body.externalUrl || "").trim();
  }

  if (isCreate || Object.prototype.hasOwnProperty.call(body, "tags")) {
    payload.tags = normalizeTags(body.tags);
  }

  if (isCreate || Object.prototype.hasOwnProperty.call(body, "pinned")) {
    payload.pinned = parseBoolean(body.pinned, false);
  }

  if (isCreate || Object.prototype.hasOwnProperty.call(body, "allowDownload")) {
    payload.allowDownload = parseBoolean(body.allowDownload, true);
  }

  if (isCreate || Object.prototype.hasOwnProperty.call(body, "week")) {
    payload.week = parseWeek(body.week);
  }

  if (isCreate || Object.prototype.hasOwnProperty.call(body, "module")) {
    payload.module = String(body.module || "").trim();
  }

  if (isCreate || Object.prototype.hasOwnProperty.call(body, "topic")) {
    payload.topic = String(body.topic || "").trim();
  }

  const lectureDate = parseDate(body.lectureDate);
  if (isCreate || lectureDate !== undefined) payload.lectureDate = lectureDate ?? null;

  const releaseAt = parseDate(body.releaseAt);
  if (isCreate || releaseAt !== undefined) payload.releaseAt = releaseAt ?? null;

  const nextFile = hasUploadFile || Boolean(existing?.file?.url || existing?.file?.publicId);
  const nextExternalUrl = Object.prototype.hasOwnProperty.call(payload, "externalUrl")
    ? Boolean(payload.externalUrl)
    : Boolean(existing?.externalUrl);
  payload.resourceKind = normalizeResourceKind(body.resourceKind, nextFile, nextExternalUrl, payload.type || existing?.type);

  const nextStatus = payload.status || normalizeStatus(existing?.status);
  const nextReleaseAt = Object.prototype.hasOwnProperty.call(payload, "releaseAt") ? payload.releaseAt : existing?.releaseAt;
  if (nextStatus === "scheduled" && !nextReleaseAt) {
    return { error: "Scheduled materials need a release date and time" };
  }

  return { payload };
};

const applyPublicationTimestamps = (material, previousStatus) => {
  const status = normalizeStatus(material.status);
  if (status === "draft" || status === "archived") return;

  if (status === "scheduled") {
    material.publishedAt = material.releaseAt || material.publishedAt || new Date();
    return;
  }

  if (!material.publishedAt || previousStatus !== "published") {
    material.publishedAt = new Date();
  }
};

const createMaterialNotifications = async (course, material, senderId) => {
  if (!isMaterialReleasedForStudents(material)) return;

  const enrolledRecipients = (course.enrollments || [])
    .filter((enrollment) => enrollment.status === "enrolled")
    .map((enrollment) => enrollment.student)
    .filter((studentId) => String(studentId) !== String(senderId));

  await Promise.all(
    enrolledRecipients.map((recipient) =>
      createNotification({
        recipient,
        sender: senderId,
        course: course._id,
        material: material._id,
        type: "Academic",
        message: `published new material in ${course.code}`,
      })
    )
  );
};

const getCourseOr404 = async (courseId, res) => {
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404).json({ success: false, message: "Course not found" });
    return null;
  }
  return course;
};

exports.createCourseMaterial = async (req, res) => {
  try {
    const course = await getCourseOr404(req.params.courseId, res);
    if (!course) return;
    if (!canManageMaterials(course, req.user)) {
      return res.status(403).json({ success: false, message: "Only course instructors can upload materials" });
    }

    const uploadFile = req.files?.materialFile || req.files?.file;
    const { error, payload } = buildMaterialPayload(req.body, { isCreate: true, hasUploadFile: Boolean(uploadFile) });
    if (error) return res.status(400).json({ success: false, message: error });

    if (!uploadFile && !payload.externalUrl && payload.status !== "draft") {
      return res.status(400).json({ success: false, message: "Upload a file or provide an external URL before publishing" });
    }

    const file = uploadFile
      ? await uploadCourseFileToCloudinary(uploadFile, `${process.env.FOLDER_NAME || "universex"}/course-materials`)
      : null;

    let material = new CourseMaterial({
      ...payload,
      course: course._id,
      uploadedBy: req.user.id,
      file,
      publishedAt: ["draft", "archived"].includes(payload.status) ? null : undefined,
    });
    if (file) {
      material.resourceKind = normalizeResourceKind(req.body.resourceKind, true, Boolean(payload.externalUrl), payload.type);
    }
    applyPublicationTimestamps(material);
    await material.save();
    await createMaterialNotifications(course, material, req.user.id);

    material = await material.populate(MATERIAL_POPULATE);
    res.status(201).json({ success: true, message: "Material saved", material: serializeMaterial(course, material, req.user) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to upload material", error: error.message });
  }
};

exports.getCourseMaterials = async (req, res) => {
  try {
    const course = await getCourseOr404(req.params.courseId, res);
    if (!course) return;

    const { type = "", search = "", status = "", week = "", module = "", bookmarked = "", readStatus = "" } = req.query;
    const isManager = canManageMaterials(course, req.user);
    const query = { course: course._id };

    if (MATERIAL_TYPES.includes(type)) query.type = type;
    if (search.trim()) query.$text = { $search: search.trim() };
    if (isManager && MATERIAL_STATUSES.includes(status)) {
      if (status === "published") {
        query.$or = [{ status: "published" }, { status: { $exists: false } }, { status: null }];
      } else {
        query.status = status;
      }
    }
    const parsedWeek = parseWeek(week);
    if (parsedWeek) query.week = parsedWeek;
    if (module.trim()) query.module = new RegExp(`^${escapeRegExp(module.trim())}$`, "i");

    const materials = await CourseMaterial.find(query)
      .populate(MATERIAL_POPULATE)
      .sort({ pinned: -1, week: 1, module: 1, releaseAt: -1, publishedAt: -1, createdAt: -1 });

    let visibleMaterials = materials.filter((material) => canViewMaterial(course, material, req.user));
    if (!isManager && bookmarked === "true") {
      visibleMaterials = visibleMaterials.filter((material) => hasStudentState(material.bookmarkedBy || [], req.user.id));
    }
    if (!isManager && readStatus === "unread") {
      visibleMaterials = visibleMaterials.filter((material) => !hasStudentState(material.readBy || [], req.user.id));
    }
    if (!isManager && readStatus === "read") {
      visibleMaterials = visibleMaterials.filter((material) => hasStudentState(material.readBy || [], req.user.id));
    }

    const statSource = isManager ? materials : visibleMaterials;
    const stats = {
      total: statSource.length,
      draft: statSource.filter((material) => normalizeStatus(material.status) === "draft").length,
      scheduled: statSource.filter((material) => normalizeStatus(material.status) === "scheduled").length,
      published: statSource.filter((material) => normalizeStatus(material.status) === "published").length,
      archived: statSource.filter((material) => normalizeStatus(material.status) === "archived").length,
      pinned: statSource.filter((material) => material.pinned).length,
      unread: visibleMaterials.filter((material) => !hasStudentState(material.readBy || [], req.user.id)).length,
      bookmarked: visibleMaterials.filter((material) => hasStudentState(material.bookmarkedBy || [], req.user.id)).length,
    };

    const enrollment = getEnrollment(course, req.user.id);
    res.status(200).json({
      success: true,
      materials: visibleMaterials.map((material) => serializeMaterial(course, material, req.user)),
      stats,
      viewerContext: {
        isInstructor: isManager,
        isEnrolled: enrollment?.status === "enrolled",
        enrollmentStatus: enrollment?.status || "none",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch materials", error: error.message });
  }
};

exports.updateCourseMaterial = async (req, res) => {
  try {
    const course = await getCourseOr404(req.params.courseId, res);
    if (!course) return;
    if (!canManageMaterials(course, req.user)) {
      return res.status(403).json({ success: false, message: "Only course instructors can update materials" });
    }

    let material = await CourseMaterial.findOne({ _id: req.params.materialId, course: course._id });
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });

    const wasVisibleToStudents = isMaterialReleasedForStudents(material);
    const previousStatus = normalizeStatus(material.status);
    const uploadFile = req.files?.materialFile || req.files?.file;
    const { error, payload } = buildMaterialPayload(req.body, {
      existing: material,
      hasUploadFile: Boolean(uploadFile),
    });
    if (error) return res.status(400).json({ success: false, message: error });

    const previousFile = material.file;
    let nextFile = null;
    if (uploadFile) {
      nextFile = await uploadCourseFileToCloudinary(uploadFile, `${process.env.FOLDER_NAME || "universex"}/course-materials`);
      payload.file = nextFile;
      payload.resourceKind = normalizeResourceKind(req.body.resourceKind, true, Boolean(payload.externalUrl ?? material.externalUrl), payload.type || material.type);
    }

    material.set(payload);
    if (normalizeStatus(material.status) !== "draft" && !hasMaterialResource(material)) {
      return res.status(400).json({ success: false, message: "Upload a file or provide an external URL before publishing" });
    }

    material.version = (material.version || 1) + 1;
    applyPublicationTimestamps(material, previousStatus);
    await material.save();
    if (nextFile && previousFile?.publicId) {
      await deleteCourseFileFromCloudinary(previousFile);
    }

    const isVisibleToStudents = isMaterialReleasedForStudents(material);
    if (!wasVisibleToStudents && isVisibleToStudents) {
      await createMaterialNotifications(course, material, req.user.id);
    }

    material = await material.populate(MATERIAL_POPULATE);
    res.status(200).json({ success: true, message: "Material updated", material: serializeMaterial(course, material, req.user) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update material", error: error.message });
  }
};

exports.deleteCourseMaterial = async (req, res) => {
  try {
    const course = await getCourseOr404(req.params.courseId, res);
    if (!course) return;
    if (!canManageMaterials(course, req.user)) {
      return res.status(403).json({ success: false, message: "Only course instructors can delete materials" });
    }

    const material = await CourseMaterial.findOne({ _id: req.params.materialId, course: course._id });
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });

    await deleteCourseFileFromCloudinary(material.file || {});
    await material.deleteOne();
    res.status(200).json({ success: true, message: "Material deleted", materialId: material._id });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete material", error: error.message });
  }
};

exports.markCourseMaterialRead = async (req, res) => {
  try {
    const course = await getCourseOr404(req.params.courseId, res);
    if (!course) return;

    let material = await CourseMaterial.findOne({ _id: req.params.materialId, course: course._id });
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });
    if (!canViewMaterial(course, material, req.user)) {
      return res.status(403).json({ success: false, message: "You cannot access this material" });
    }

    if (!hasStudentState(material.readBy || [], req.user.id)) {
      material.readBy.push({ student: req.user.id, at: new Date() });
      await material.save();
    }

    material = await material.populate(MATERIAL_POPULATE);
    res.status(200).json({ success: true, message: "Material marked as read", material: serializeMaterial(course, material, req.user) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark material as read", error: error.message });
  }
};

exports.toggleCourseMaterialBookmark = async (req, res) => {
  try {
    const course = await getCourseOr404(req.params.courseId, res);
    if (!course) return;

    let material = await CourseMaterial.findOne({ _id: req.params.materialId, course: course._id });
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });
    if (!canViewMaterial(course, material, req.user)) {
      return res.status(403).json({ success: false, message: "You cannot access this material" });
    }

    const bookmarkIndex = (material.bookmarkedBy || []).findIndex((state) => String(state.student) === String(req.user.id));
    if (bookmarkIndex >= 0) {
      material.bookmarkedBy.splice(bookmarkIndex, 1);
    } else {
      material.bookmarkedBy.push({ student: req.user.id, at: new Date() });
    }
    await material.save();

    material = await material.populate(MATERIAL_POPULATE);
    res.status(200).json({ success: true, message: "Material bookmark updated", material: serializeMaterial(course, material, req.user) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update bookmark", error: error.message });
  }
};

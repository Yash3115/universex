const Course = require("../models/courseSchema");
const CourseMaterial = require("../models/courseMaterialSchema");
const { createNotification } = require("../utils/notificationService");
const { deleteCourseFileFromCloudinary, uploadCourseFileToCloudinary } = require("../utils/fileUploader");

const MATERIAL_TYPES = ["lecture", "notes", "reference", "lab", "syllabus", "assignment-brief", "recording", "link", "other"];

const MATERIAL_POPULATE = [
  { path: "uploadedBy", select: "firstName lastName image role facultyProfile", populate: { path: "facultyProfile" } },
  { path: "course", select: "title code college department professor enrollments" },
];

const isCourseInstructor = (course, userId) =>
  String(course.professor?._id || course.professor) === String(userId) ||
  (course.coInstructors || []).some((instructor) => String(instructor?._id || instructor) === String(userId));

const getEnrollment = (course, userId) =>
  (course.enrollments || []).find((item) => String(item.student?._id || item.student) === String(userId));

const isEnrolled = (course, userId) => getEnrollment(course, userId)?.status === "enrolled";

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 10);
  return String(tags || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 10);
};

const canViewMaterial = (course, material, user) => {
  if (user.role === "Admin" || isCourseInstructor(course, user.id)) return true;
  if (material.visibility === "public") return true;
  if (material.visibility === "college") return course.college === user.college;
  return isEnrolled(course, user.id);
};

exports.createCourseMaterial = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!isCourseInstructor(course, req.user.id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Only course instructors can upload materials" });
    }

    const title = String(req.body.title || "").trim();
    if (!title) return res.status(400).json({ success: false, message: "Material title is required" });

    const externalUrl = String(req.body.externalUrl || "").trim();
    const uploadFile = req.files?.materialFile || req.files?.file;
    if (!uploadFile && !externalUrl) {
      return res.status(400).json({ success: false, message: "Upload a file or provide an external URL" });
    }

    const file = uploadFile
      ? await uploadCourseFileToCloudinary(uploadFile, `${process.env.FOLDER_NAME || "universex"}/course-materials`)
      : null;

    let material = await CourseMaterial.create({
      course: course._id,
      uploadedBy: req.user.id,
      title,
      description: String(req.body.description || "").trim(),
      type: MATERIAL_TYPES.includes(req.body.type) ? req.body.type : "lecture",
      file,
      externalUrl,
      tags: normalizeTags(req.body.tags),
      visibility: ["enrolled", "college", "public"].includes(req.body.visibility) ? req.body.visibility : "enrolled",
      pinned: req.body.pinned === true || req.body.pinned === "true",
    });

    material = await material.populate(MATERIAL_POPULATE);

    const enrolledRecipients = (course.enrollments || [])
      .filter((enrollment) => enrollment.status === "enrolled")
      .map((enrollment) => enrollment.student)
      .filter((studentId) => String(studentId) !== String(req.user.id));

    await Promise.all(
      enrolledRecipients.map((recipient) =>
        createNotification({
          recipient,
          sender: req.user.id,
          course: course._id,
          material: material._id,
          type: "Academic",
          message: `uploaded new material in ${course.code}`,
        })
      )
    );

    res.status(201).json({ success: true, message: "Material uploaded", material });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to upload material", error: error.message });
  }
};

exports.getCourseMaterials = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const { type = "", search = "" } = req.query;
    const query = { course: course._id };
    if (MATERIAL_TYPES.includes(type)) query.type = type;
    if (search.trim()) query.$text = { $search: search.trim() };

    const materials = await CourseMaterial.find(query)
      .populate(MATERIAL_POPULATE)
      .sort({ pinned: -1, publishedAt: -1, createdAt: -1 });

    const visibleMaterials = materials.filter((material) => canViewMaterial(course, material, req.user));
    const enrollment = getEnrollment(course, req.user.id);
    res.status(200).json({
      success: true,
      materials: visibleMaterials,
      viewerContext: {
        isInstructor: req.user.role === "Admin" || isCourseInstructor(course, req.user.id),
        isEnrolled: enrollment?.status === "enrolled",
        enrollmentStatus: enrollment?.status || "none",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch materials", error: error.message });
  }
};

exports.deleteCourseMaterial = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!isCourseInstructor(course, req.user.id) && req.user.role !== "Admin") {
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
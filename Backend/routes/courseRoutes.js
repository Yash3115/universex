const express = require("express");
const {
  createCourseAnnouncement,
  deleteCourseAnnouncement,
  getCourseAnnouncements,
} = require("../controllers/courseAnnouncementController");
const {
  createCourseMaterial,
  deleteCourseMaterial,
  getCourseMaterials,
} = require("../controllers/courseMaterialController");
const {
  createCourse,
  discoverCourses,
  getCourseById,
  getMyCourses,
  joinCourse,
  updateCourse,
  updateEnrollment,
} = require("../controllers/courseController");
const { authMiddleware, blockDemoFileUploads } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", createCourse);
router.get("/mine", getMyCourses);
router.get("/discover", discoverCourses);
router.get("/:id", getCourseById);
router.put("/:id", updateCourse);
router.post("/:id/join", joinCourse);
router.patch("/:id/enrollments/:studentId", updateEnrollment);
router.post("/:courseId/materials", blockDemoFileUploads, createCourseMaterial);
router.get("/:courseId/materials", getCourseMaterials);
router.delete("/:courseId/materials/:materialId", deleteCourseMaterial);
router.post("/:courseId/announcements", createCourseAnnouncement);
router.get("/:courseId/announcements", getCourseAnnouncements);
router.delete("/:courseId/announcements/:announcementId", deleteCourseAnnouncement);

module.exports = router;

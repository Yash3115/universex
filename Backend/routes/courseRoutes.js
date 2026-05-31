const express = require("express");
const {
  createCourse,
  discoverCourses,
  getCourseById,
  getMyCourses,
  joinCourse,
  updateCourse,
  updateEnrollment,
} = require("../controllers/courseController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", createCourse);
router.get("/mine", getMyCourses);
router.get("/discover", discoverCourses);
router.get("/:id", getCourseById);
router.put("/:id", updateCourse);
router.post("/:id/join", joinCourse);
router.patch("/:id/enrollments/:studentId", updateEnrollment);

module.exports = router;
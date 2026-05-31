const express = require("express");
const {
  createAssignment,
  getAssignmentSubmissions,
  getCourseAssignments,
  gradeSubmission,
  submitAssignment,
} = require("../controllers/assignmentController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/courses/:courseId", createAssignment);
router.get("/courses/:courseId", getCourseAssignments);
router.post("/:assignmentId/submit", submitAssignment);
router.get("/:assignmentId/submissions", getAssignmentSubmissions);
router.patch("/submissions/:submissionId/grade", gradeSubmission);

module.exports = router;
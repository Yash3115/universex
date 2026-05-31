const express = require("express");
const {
  createAssessment,
  getAssessmentGrades,
  getCourseAssessments,
  getMyResults,
  publishAssessment,
  saveAssessmentGrades,
} = require("../controllers/resultController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/courses/:courseId/assessments", createAssessment);
router.get("/courses/:courseId/assessments", getCourseAssessments);
router.get("/mine", getMyResults);
router.post("/assessments/:assessmentId/grades", saveAssessmentGrades);
router.get("/assessments/:assessmentId/grades", getAssessmentGrades);
router.patch("/assessments/:assessmentId/publish", publishAssessment);

module.exports = router;
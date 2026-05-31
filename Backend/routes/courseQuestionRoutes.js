const express = require("express");
const {
  createAnswer,
  createQuestion,
  getCourseQuestions,
  markAnswerOfficial,
  toggleAnswerHelpful,
  toggleQuestionUpvote,
  updateQuestionStatus,
} = require("../controllers/courseQuestionController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/courses/:courseId/questions", createQuestion);
router.get("/courses/:courseId/questions", getCourseQuestions);
router.post("/questions/:questionId/answers", createAnswer);
router.patch("/questions/:questionId/status", updateQuestionStatus);
router.patch("/questions/:questionId/upvote", toggleQuestionUpvote);
router.patch("/answers/:answerId/official", markAnswerOfficial);
router.patch("/answers/:answerId/helpful", toggleAnswerHelpful);

module.exports = router;
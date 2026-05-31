const express = require("express");
const {
  createAttendanceSession,
  getAttendanceRecords,
  getCourseAttendanceSessions,
  getMyAttendance,
  markAttendanceRecords,
  updateAttendanceSession,
} = require("../controllers/courseAttendanceController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/courses/:courseId/sessions", createAttendanceSession);
router.get("/courses/:courseId/sessions", getCourseAttendanceSessions);
router.get("/courses/:courseId/mine", getMyAttendance);
router.get("/mine", getMyAttendance);
router.patch("/sessions/:sessionId", updateAttendanceSession);
router.post("/sessions/:sessionId/records", markAttendanceRecords);
router.get("/sessions/:sessionId/records", getAttendanceRecords);

module.exports = router;
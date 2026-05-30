const express = require("express");
const {
  createTask,
  deleteAttendance,
  deleteTask,
  getAcademicOverview,
  markAttendance,
  saveRoutine,
  updateTask,
} = require("../controllers/academicController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/overview", getAcademicOverview);
router.put("/routine", saveRoutine);
router.post("/attendance", markAttendance);
router.delete("/attendance/:id", deleteAttendance);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

module.exports = router;
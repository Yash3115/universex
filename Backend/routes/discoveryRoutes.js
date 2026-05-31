const express = require("express");
const {
  getConnectionSummary,
  getMyConnections,
  getStudentProfile,
  removeConnection,
  requestConnection,
  respondToConnection,
  searchStudents,
  updateConnectionPreferences,
} = require("../controllers/discoveryController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/students", searchStudents);
router.get("/students/:id", getStudentProfile);
router.get("/connections", getMyConnections);
router.get("/connections/summary", getConnectionSummary);
router.post("/connections", requestConnection);
router.patch("/connections/:id/preferences", updateConnectionPreferences);
router.put("/connections/:id", respondToConnection);
router.delete("/connections/:id", removeConnection);

module.exports = router;
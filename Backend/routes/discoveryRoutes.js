const express = require("express");
const {
  getConnectionSummary,
  getMyConnections,
  removeConnection,
  requestConnection,
  respondToConnection,
  searchStudents,
} = require("../controllers/discoveryController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/students", searchStudents);
router.get("/connections", getMyConnections);
router.get("/connections/summary", getConnectionSummary);
router.post("/connections", requestConnection);
router.put("/connections/:id", respondToConnection);
router.delete("/connections/:id", removeConnection);

module.exports = router;
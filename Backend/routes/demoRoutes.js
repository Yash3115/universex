const express = require("express");
const {
  createAccessRequest,
  exitDemo,
  getDemoStatus,
  startDemo,
} = require("../controllers/demoController");
const { optionalAuthMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/start", startDemo);
router.get("/status", optionalAuthMiddleware, getDemoStatus);
router.post("/exit", exitDemo);
router.post("/access-request", optionalAuthMiddleware, createAccessRequest);

module.exports = router;

const express = require("express");
const {
  createInteraction,
  getInteractions,
  getInteractionSummary,
  updateInteractionStatus,
} = require("../controllers/interactionController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", createInteraction);
router.get("/", getInteractions);
router.get("/summary", getInteractionSummary);
router.patch("/:id/status", updateInteractionStatus);

module.exports = router;
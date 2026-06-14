const express = require("express");
const rateLimit = require("express-rate-limit");
const { generateAiArtifact } = require("../controllers/aiController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.AI_RATE_LIMIT_PER_MINUTE) || 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests. Please slow down." },
});

router.use(authMiddleware);
router.post("/generate", aiRateLimiter, generateAiArtifact);

module.exports = router;

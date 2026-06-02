const express = require("express");
const { getMessages, getThreads, sendMessage, startDirectThread } = require("../controllers/chatController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/threads", getThreads);
router.post("/threads/direct", startDirectThread);
router.get("/threads/:threadId/messages", getMessages);
router.post("/threads/:threadId/messages", sendMessage);

module.exports = router;

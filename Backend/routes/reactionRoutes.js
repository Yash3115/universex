const express = require("express");
const { reactToPost, removeReaction } = require("../controllers/reactionController");
const {authMiddleware} = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/:postId", authMiddleware, reactToPost);
router.delete("/:postId", authMiddleware, removeReaction);

module.exports = router;
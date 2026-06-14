const express = require("express");
const { 
    createComment, 
    replyToComment, 
    getPostComments, 
    deleteComment 
} = require("../controllers/commentController");

const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 Comment Routes

// Create a comment on a post
router.post("/:postId/comments", authMiddleware, createComment); 

// Reply to a comment (Nested under specific comment)
router.post("/comments/:commentId/replies", authMiddleware, replyToComment);

// Get all comments for a post (Includes top-level comments + replies)
router.get("/:postId/comments", authMiddleware, getPostComments);

// Delete a comment (Deletes nested replies too)
router.delete("/comments/:commentId", authMiddleware, deleteComment);

module.exports = router;

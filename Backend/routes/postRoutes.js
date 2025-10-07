const express = require("express");
const { 
    createPost, 
    getPosts, 
    likePost, 
    deletePost 
} = require("../controllers/postController");

const { 
    createComment, 
    replyToComment, 
    getPostComments, 
    deleteComment 
} = require("../controllers/commentController");

const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 Post Routes
router.post("/", authMiddleware, createPost);
router.get("/", getPosts);
router.put("/:id/like", authMiddleware, likePost);
router.delete("/:id", authMiddleware, deletePost);


module.exports = router;

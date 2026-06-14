const express = require("express");
const { 
    createPost, 
    getPosts, 
    getReportedPosts,
    likePost, 
    deletePost,
    reportPost,
    savePost 
} = require("../controllers/postController");

const { 
    createComment, 
    replyToComment, 
    getPostComments, 
    deleteComment 
} = require("../controllers/commentController");

const { authMiddleware, blockDemoFileUploads, isAuthorised, requireNonDemo } = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 Post Routes
router.post("/", authMiddleware, blockDemoFileUploads, createPost);
router.get("/", authMiddleware, getPosts);
router.get("/admin/reports", authMiddleware, requireNonDemo, isAuthorised("Admin"), getReportedPosts);
router.put("/:id/like", authMiddleware, likePost);
router.put("/:id/save", authMiddleware, savePost);
router.post("/:id/report", authMiddleware, reportPost);
router.delete("/:id", authMiddleware, deletePost);


module.exports = router;

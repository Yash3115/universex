const Comment = require("../models/commentSchema");
const Post = require("../models/postSchema");

// 📌 Create a new comment on a post (Direct Comment)
exports.createComment = async (req, res) => {
    try {
        const { content } = req.body;
        const { postId } = req.params;
        const userId = req.user.id;

        if (!content) {
            return res.status(400).json({ success: false, message: "Comment content is required" });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const comment = new Comment({ user: userId, post: postId, content, parentComment: null });
        await comment.save();

        // Add comment reference to the post
        post.comments.push(comment._id);
        await post.save();

        res.status(201).json({ success: true, message: "Comment added successfully", comment });

    } catch (err) {
        console.error("Error in createComment:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 📌 Reply to a comment (Nested Comment)
exports.replyToComment = async (req, res) => {
    try {
        const { content } = req.body;
        const { commentId } = req.params;
        const userId = req.user.id;

        if (!content) {
            return res.status(400).json({ success: false, message: "Reply content is required" });
        }

        const parentComment = await Comment.findById(commentId);
        if (!parentComment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        const reply = new Comment({ 
            user: userId, 
            post: parentComment.post, 
            content, 
            parentComment: commentId 
        });

        await reply.save();

        // Add reply reference to the parent comment
        parentComment.replies.push(reply._id);
        await parentComment.save();

        res.status(201).json({ success: true, message: "Reply added successfully", reply });

    } catch (err) {
        console.error("Error in replyToComment:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 📌 Get all comments for a post (Including Replies)
exports.getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;

        const comments = await Comment.find({ post: postId, parentComment: null }) // Fetch only top-level comments
            .populate("user", "firstName lastName image")
            .populate({
                path: "replies",
                populate: { path: "user", select: "firstName lastName image" }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, message: "Comments fetched successfully", comments });

    } catch (err) {
        console.error("Error in getPostComments:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 📌 Delete a comment (Deletes Nested Replies Too)
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        if (comment.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this comment" });
        }

        // Remove comment from the post's comments array if it's a direct comment
        if (!comment.parentComment) {
            await Post.findByIdAndUpdate(comment.post, { $pull: { comments: commentId } });
        } else {
            // If it's a reply, remove reference from parent comment
            await Comment.findByIdAndUpdate(comment.parentComment, { $pull: { replies: commentId } });
        }

        // Delete the comment and its replies recursively
        const deleteCommentRecursively = async (commentId) => {
            const childComments = await Comment.find({ parentComment: commentId });

            for (let child of childComments) {
                await deleteCommentRecursively(child._id);
            }

            await Comment.findByIdAndDelete(commentId);
        };

        await deleteCommentRecursively(commentId);

        res.status(200).json({ success: true, message: "Comment and its replies deleted successfully" });

    } catch (err) {
        console.error("Error in deleteComment:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

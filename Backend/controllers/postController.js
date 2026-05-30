const Post = require("../models/postSchema");
const User = require("../models/userSchema");
const Comment = require("../models/commentSchema");
const {uploadImageToCloudinary} = require("../utils/imageUploader");
const { createNotification } = require("../utils/notificationService");

const POST_CATEGORIES = ["General", "Academics", "Placements", "Events", "Lost & Found", "Help", "Announcements"];

const normalizeTags = (tags) => {
    if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8);
    if (typeof tags === "string") return tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
    return [];
};

// 📌 Create a new post
exports.createPost = async (req, res) => {
    try {
        const content = req.body.content?.trim();
        const category = POST_CATEGORIES.includes(req.body.category) ? req.body.category : "General";
        const tags = normalizeTags(req.body.tags);
        const userId = req.user.id;

        if (!content) {
            return res.status(400).json({ success: false, message: "Content is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let imageUrl = "";
        if (req.files?.displayPicture) {
            const uploadedImage = await uploadImageToCloudinary(
                req.files.displayPicture,
                process.env.FOLDER_NAME || "posts",
                1000,
                1000
            );
            imageUrl = uploadedImage.secure_url;
        }

        const post = new Post({
            user: userId,
            content,
            image: imageUrl,
            college: user.college,
            category,
            tags,
        });

        await post.save();
        await post.populate("user", "firstName lastName image");

        res.status(201).json({ success: true, message: "Post created successfully", post });

    } catch (err) {
        console.error("Error in createPost:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 📌 Get all posts with comments and user details
exports.getPosts = async (req, res) => {
    try {
        const { category, search, sort = "newest" } = req.query;
        const pageNumber = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const filter = {};
        if (category && category !== "all") filter.category = category;
        if (search?.trim()) filter.$text = { $search: search.trim() };
        const sortBy = sort === "trending" ? { likes: -1, createdAt: -1 } : { createdAt: -1 };

        const posts = await Post.find(filter)
            .populate("user", "firstName lastName image")
            .populate({
                path: "comments",
                populate: { path: "user", select: "firstName lastName image" }
            })
            .sort(sortBy)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize);

        const totalPosts = await Post.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: "Posts fetched successfully",
            posts,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalPosts / pageSize),
                totalPosts,
            },
        });

    } catch (err) {
        console.error("Error in getPosts:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.reportPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = "" } = req.body;
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const alreadyReported = post.reports.some((report) => report.user.toString() === req.user.id);
        if (!alreadyReported) {
            post.reports.push({ user: req.user.id, reason });
            await post.save();
        }

        res.status(200).json({ success: true, message: "Post reported for moderation" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.savePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const isSaved = post.savedBy.some((userId) => userId.toString() === req.user.id);
        post.savedBy = isSaved
            ? post.savedBy.filter((userId) => userId.toString() !== req.user.id)
            : [...post.savedBy, req.user.id];
        await post.save();

        res.status(200).json({ success: true, saved: !isSaved, post });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 📌 Delete a post along with its comments
exports.deletePost = async (req, res) => {
    try {
        const userId = req.user.id;

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        if (post.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this post" });
        }

        await Comment.deleteMany({ post: post._id }); // Delete associated comments
        await post.deleteOne();

        res.status(200).json({ success: true, message: "Post and comments deleted successfully" });

    } catch (err) {
        console.error("Error in deletePost:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 📌 Like or Unlike a Post
exports.likePost = async (req, res) => {
    try {
        const { id } = req.params; // Post ID
        const userId = req.user.id;
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const isLiked = post.likes.some((id) => id.toString() === userId);

        if (isLiked) {
            post.likes = post.likes.filter(id => id.toString() !== userId);
        } else {
            post.likes.push(userId);
            await createNotification({
                recipient: post.user,
                sender: userId,
                post: post._id,
                type: "Like",
                message: "liked your post",
            });
        }

        await post.save();

        res.status(200).json({ 
            success: true, 
            message: isLiked ? "Post unliked successfully" : "Post liked successfully",
            likesCount: post.likes.length,
            post
        });

    } catch (err) {
        console.error("Error in likePost:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};





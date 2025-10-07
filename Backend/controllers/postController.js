const Post = require("../models/postSchema");
const User = require("../models/userSchema");
const Comment = require("../models/commentSchema");
// const cloudinary = require("../config/cloudinary");
const cloudinary = require('cloudinary').v2;
const {uploadImageToCloudinary} = require("../utils/imageUploader");

// 📌 Create a new post
exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;
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
        });

        await post.save();

        res.status(201).json({ success: true, message: "Post created successfully", post });

    } catch (err) {
        console.error("Error in createPost:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 📌 Get all posts with comments and user details
exports.getPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const posts = await Post.find()
            .populate("user", "firstName lastName image")
            .populate({
                path: "comments",
                populate: { path: "user", select: "firstName lastName image" }
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalPosts = await Post.countDocuments();

        res.status(200).json({
            success: true,
            message: "Posts fetched successfully",
            posts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalPosts / limit),
                totalPosts,
            },
        });

    } catch (err) {
        console.error("Error in getPosts:", err);
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

        // if (post.image) {
        //     const publicId = post.image.split("/").pop().split(".")[0];
        //     // await cloudinary.uploader.destroy(`posts/${publicId}`);
        //     // console.log(await cloudinary.uploader.destroy());
            
        //     // cloudinary.api.delete_resources([publicId], function(result) { console.log(result) });
        //     cloudinary.uploader.destroy(`${publicId}`, function(result) { console.log(result) });
        // }

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
        console.log("hi");
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const isLiked = post.likes.includes(userId);

        if (isLiked) {
            post.likes = post.likes.filter(id => id.toString() !== userId);
        } else {
            post.likes.push(userId);
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


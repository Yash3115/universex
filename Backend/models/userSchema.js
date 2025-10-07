const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, unique: true },
        password: { type: String, required: true },
        //for expiration time of otp
        resetPasswordExpires: {
			type: Date,
		},
        college: { type: String, required: true },
        image: { type: String}, // Profile picture
        additionalDetails: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "profile",
		},
        gender: {
            type: String,
        },
        dateOfBirth: {
            type: String,
        },
        balance: { type: Number, default: 0 },
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
        comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
        likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
        savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
        role: { type: String, enum: ["Admin", "Student"], default: "Student" },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
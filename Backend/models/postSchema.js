const mongoose = require("mongoose");
const Comment = require("./commentSchema"); // Import Comment model

const postSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        image: { type: String }, // Optional image for the post
        college: { type: String, required: true }, // To filter posts by college
        category: {
            type: String,
            enum: ["General", "Academics", "Placements", "Events", "Lost & Found", "Help", "Announcements"],
            default: "General",
        },
        tags: [{ type: String, trim: true }],
        reports: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
                reason: { type: String, trim: true, default: "" },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], // References to Comment model
        visibility: { type: String, enum: ["Public", "College Only"], default: "College Only" },
    },
    { timestamps: true }
);

postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ content: "text", tags: "text" });

// 📌 Middleware: Delete comments & replies when a post is deleted
postSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    try {
        // Delete all comments associated with this post
        await Comment.deleteMany({ post: this._id });
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("Post", postSchema);

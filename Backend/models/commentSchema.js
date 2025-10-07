const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
        content: { type: String, required: true },
        parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null }, // Distinguishes comments from replies
        replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }] // Array of reply IDs
    },
    { timestamps: true }
);

// 📌 Middleware to delete all nested replies when a comment is deleted
commentSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    try {
        console.log(`Deleting comment and its replies: ${this._id}`);

        // Recursively delete all replies associated with this comment
        await mongoose.model("Comment").deleteMany({ parentComment: this._id });

        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("Comment", commentSchema);

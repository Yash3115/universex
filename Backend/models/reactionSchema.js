const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
        type: {
            type: String,
            enum: ["Like", "Love", "Laugh", "Sad", "Angry"],
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Reaction", reactionSchema);
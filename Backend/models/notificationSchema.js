const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        connection: { type: mongoose.Schema.Types.ObjectId, ref: "Connection" },
        interaction: { type: mongoose.Schema.Types.ObjectId, ref: "ConnectionInteraction" },
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        material: { type: mongoose.Schema.Types.ObjectId, ref: "CourseMaterial" },
        announcement: { type: mongoose.Schema.Types.ObjectId, ref: "CourseAnnouncement" },
        assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
        submission: { type: mongoose.Schema.Types.ObjectId, ref: "AssignmentSubmission" },
        post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
        comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
        job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
        type: {
            type: String,
            enum: ["Like", "Comment", "Reply", "Reaction", "Job", "Academic", "Connection", "Interaction", "System"],
            required: true,
        },
        message: { type: String, trim: true, default: "" },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
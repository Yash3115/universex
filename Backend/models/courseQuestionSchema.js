const mongoose = require("mongoose");

const courseQuestionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    askedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, required: true, maxlength: 160 },
    body: { type: String, trim: true, required: true, maxlength: 3000 },
    tags: [{ type: String, trim: true }],
    visibility: { type: String, enum: ["course", "anonymous", "private"], default: "course" },
    status: { type: String, enum: ["open", "answered", "closed"], default: "open" },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    acceptedAnswer: { type: mongoose.Schema.Types.ObjectId, ref: "CourseAnswer" },
  },
  { timestamps: true }
);

courseQuestionSchema.index({ course: 1, status: 1, createdAt: -1 });
courseQuestionSchema.index({ course: 1, tags: 1 });
courseQuestionSchema.index({ title: "text", body: "text", tags: "text" });

module.exports = mongoose.model("CourseQuestion", courseQuestionSchema);
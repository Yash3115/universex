const mongoose = require("mongoose");

const courseAnswerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "CourseQuestion", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, trim: true, required: true, maxlength: 3000 },
    official: { type: Boolean, default: false },
    helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

courseAnswerSchema.index({ question: 1, official: -1, createdAt: 1 });
courseAnswerSchema.index({ course: 1, createdAt: -1 });

module.exports = mongoose.model("CourseAnswer", courseAnswerSchema);
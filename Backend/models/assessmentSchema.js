const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    professor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, required: true },
    type: { type: String, enum: ["Quiz", "MidSem", "EndSem", "Assignment", "Lab", "Internal", "Other"], default: "Quiz" },
    maxMarks: { type: Number, default: 100 },
    weightage: { type: Number, default: 0 },
    description: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    visibleFrom: { type: Date },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

assessmentSchema.index({ course: 1, status: 1, createdAt: -1 });
assessmentSchema.index({ professor: 1, createdAt: -1 });

module.exports = mongoose.model("Assessment", assessmentSchema);
const mongoose = require("mongoose");

const assignmentFileSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: "" },
    publicId: { type: String, trim: true, default: "" },
    resourceType: { type: String, trim: true, default: "raw" },
    format: { type: String, trim: true, default: "" },
    bytes: { type: Number, default: 0 },
    originalName: { type: String, trim: true, default: "" },
    mimeType: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    professor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    attachment: { type: assignmentFileSchema, default: null },
    dueDate: { type: Date },
    totalMarks: { type: Number, default: 100 },
    status: { type: String, enum: ["draft", "published", "closed"], default: "published" },
    visibility: { type: String, enum: ["enrolled", "college", "public"], default: "enrolled" },
    allowLateSubmission: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

assignmentSchema.index({ course: 1, status: 1, dueDate: 1 });
assignmentSchema.index({ professor: 1, createdAt: -1 });
assignmentSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Assignment", assignmentSchema);
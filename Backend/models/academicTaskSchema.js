const mongoose = require("mongoose");

const academicTaskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    dueDate: { type: Date },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
  },
  { timestamps: true }
);

academicTaskSchema.index({ user: 1, dueDate: 1, status: 1 });

module.exports = mongoose.model("AcademicTask", academicTaskSchema);
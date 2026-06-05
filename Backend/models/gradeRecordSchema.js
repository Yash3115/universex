const mongoose = require("mongoose");

const gradeRecordSchema = new mongoose.Schema(
  {
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    marks: { type: Number, default: 0 },
    grade: { type: String, trim: true, default: "" },
    feedback: { type: String, trim: true, default: "" },
    privateNote: { type: String, trim: true, default: "" },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

gradeRecordSchema.index({ dataScope: 1, assessment: 1, student: 1 }, { unique: true });
gradeRecordSchema.index({ course: 1, student: 1 });
gradeRecordSchema.index({ student: 1, publishedAt: -1 });

module.exports = mongoose.model("GradeRecord", gradeRecordSchema);

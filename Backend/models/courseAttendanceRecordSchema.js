const mongoose = require("mongoose");

const courseAttendanceRecordSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: "CourseAttendanceSession", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["present", "absent", "late", "excused"], default: "present" },
    note: { type: String, trim: true, default: "" },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    markedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

courseAttendanceRecordSchema.index({ dataScope: 1, session: 1, student: 1 }, { unique: true });
courseAttendanceRecordSchema.index({ course: 1, student: 1 });
courseAttendanceRecordSchema.index({ student: 1, markedAt: -1 });

module.exports = mongoose.model("CourseAttendanceRecord", courseAttendanceRecordSchema);

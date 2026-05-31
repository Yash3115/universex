const mongoose = require("mongoose");

const courseAttendanceSessionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    professor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, required: true },
    topic: { type: String, trim: true, default: "" },
    date: { type: Date, required: true },
    startTime: { type: String, trim: true, default: "" },
    endTime: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

courseAttendanceSessionSchema.index({ course: 1, date: -1 });
courseAttendanceSessionSchema.index({ professor: 1, date: -1 });

module.exports = mongoose.model("CourseAttendanceSession", courseAttendanceSessionSchema);
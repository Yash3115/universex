const mongoose = require("mongoose");

const courseEnrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["requested", "enrolled", "rejected"], default: "enrolled" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    code: { type: String, trim: true, required: true, uppercase: true },
    description: { type: String, trim: true, default: "" },
    college: { type: String, trim: true, required: true },
    department: { type: String, trim: true, default: "" },
    semester: { type: String, trim: true, default: "" },
    academicYear: { type: String, trim: true, default: "" },
    section: { type: String, trim: true, default: "" },
    professor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coInstructors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    enrollments: [courseEnrollmentSchema],
    enrollmentPolicy: { type: String, enum: ["open", "approval", "inviteOnly"], default: "open" },
    joinCode: { type: String, trim: true, uppercase: true, default: "" },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

courseSchema.index({ professor: 1, status: 1 });
courseSchema.index({ college: 1, department: 1, status: 1 });
courseSchema.index({ dataScope: 1, code: 1, college: 1, section: 1, academicYear: 1 }, { unique: true });
courseSchema.index({ joinCode: 1 }, { sparse: true });

module.exports = mongoose.model("Course", courseSchema);

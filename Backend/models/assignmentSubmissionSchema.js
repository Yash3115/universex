const mongoose = require("mongoose");

const submissionFileSchema = new mongoose.Schema(
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

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    textAnswer: { type: String, trim: true, default: "" },
    file: { type: submissionFileSchema, default: null },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["submitted", "late", "graded", "returned"], default: "submitted" },
    marksAwarded: { type: Number },
    feedback: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index({ dataScope: 1, assignment: 1, student: 1 }, { unique: true });
assignmentSubmissionSchema.index({ course: 1, status: 1 });
assignmentSubmissionSchema.index({ student: 1, submittedAt: -1 });

module.exports = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);

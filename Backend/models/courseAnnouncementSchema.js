const mongoose = require("mongoose");

const courseAnnouncementSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, required: true, maxlength: 140 },
    body: { type: String, trim: true, required: true, maxlength: 3000 },
    priority: { type: String, enum: ["normal", "important", "urgent"], default: "normal" },
    pinned: { type: Boolean, default: false },
    expiresAt: { type: Date },
    visibility: { type: String, enum: ["enrolled", "college", "public"], default: "enrolled" },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

courseAnnouncementSchema.index({ course: 1, pinned: -1, publishedAt: -1 });
courseAnnouncementSchema.index({ course: 1, priority: 1 });
courseAnnouncementSchema.index({ title: "text", body: "text" });

module.exports = mongoose.model("CourseAnnouncement", courseAnnouncementSchema);
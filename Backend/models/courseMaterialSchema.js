const mongoose = require("mongoose");

const materialFileSchema = new mongoose.Schema(
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

const studentMaterialStateSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const courseMaterialSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["lecture", "notes", "reference", "lab", "syllabus", "assignment-brief", "recording", "link", "other"],
      default: "lecture",
    },
    status: { type: String, enum: ["draft", "published", "scheduled", "archived"], default: "published" },
    resourceKind: { type: String, enum: ["file", "link", "recording", "mixed"], default: "link" },
    file: { type: materialFileSchema, default: null },
    externalUrl: { type: String, trim: true, default: "" },
    tags: [{ type: String, trim: true }],
    visibility: { type: String, enum: ["enrolled", "college", "public"], default: "enrolled" },
    week: { type: Number, min: 1, default: null },
    module: { type: String, trim: true, default: "" },
    topic: { type: String, trim: true, default: "" },
    lectureDate: { type: Date, default: null },
    releaseAt: { type: Date, default: null },
    allowDownload: { type: Boolean, default: true },
    version: { type: Number, min: 1, default: 1 },
    readBy: [studentMaterialStateSchema],
    bookmarkedBy: [studentMaterialStateSchema],
    pinned: { type: Boolean, default: false },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

courseMaterialSchema.index({ course: 1, status: 1, pinned: -1, releaseAt: -1, publishedAt: -1 });
courseMaterialSchema.index({ course: 1, type: 1 });
courseMaterialSchema.index({ course: 1, week: 1, module: 1 });
courseMaterialSchema.index({ "readBy.student": 1 });
courseMaterialSchema.index({ "bookmarkedBy.student": 1 });
courseMaterialSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("CourseMaterial", courseMaterialSchema);

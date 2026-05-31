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
    file: { type: materialFileSchema, default: null },
    externalUrl: { type: String, trim: true, default: "" },
    tags: [{ type: String, trim: true }],
    visibility: { type: String, enum: ["enrolled", "college", "public"], default: "enrolled" },
    pinned: { type: Boolean, default: false },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

courseMaterialSchema.index({ course: 1, pinned: -1, publishedAt: -1 });
courseMaterialSchema.index({ course: 1, type: 1 });
courseMaterialSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("CourseMaterial", courseMaterialSchema);
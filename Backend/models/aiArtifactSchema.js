const mongoose = require("mongoose");

const aiArtifactSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    sourceType: {
      type: String,
      enum: [
        "material",
        "announcement",
        "assignment",
        "job",
        "post",
        "result",
        "dashboard",
        "course",
        "reportedPost",
        "accessRequest",
      ],
      required: true,
    },
    sourceId: { type: String, trim: true, required: true },
    sourceVersion: { type: String, trim: true, default: "" },
    kind: {
      type: String,
      enum: [
        "summarize",
        "simplify",
        "action-items",
        "study-notes",
        "flashcards",
        "practice-questions",
        "glossary",
        "dashboard-digest",
        "professor-draft",
        "moderation-triage",
        "access-request-summary",
      ],
      required: true,
    },
    promptHash: { type: String, trim: true, default: "" },
    prompt: { type: mongoose.Schema.Types.Mixed, default: {} },
    provider: { type: String, trim: true, default: "groq" },
    model: { type: String, trim: true, default: "" },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    usage: { type: mongoose.Schema.Types.Mixed, default: {} },
    rateLimit: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

aiArtifactSchema.index(
  { dataScope: 1, user: 1, sourceType: 1, sourceId: 1, sourceVersion: 1, kind: 1, promptHash: 1 },
  { unique: true }
);
aiArtifactSchema.index({ user: 1, createdAt: -1 });
aiArtifactSchema.index({ course: 1, sourceType: 1, createdAt: -1 });

module.exports = mongoose.model("AiArtifact", aiArtifactSchema);

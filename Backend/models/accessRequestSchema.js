const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true },
    college: { type: String, trim: true, required: true },
    role: { type: String, enum: ["Student", "Professor"], default: "Student" },
    message: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "demo" },
    status: { type: String, enum: ["new", "reviewed", "closed"], default: "new" },
  },
  { timestamps: true }
);

accessRequestSchema.index({ email: 1, createdAt: -1 });
accessRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("AccessRequest", accessRequestSchema);

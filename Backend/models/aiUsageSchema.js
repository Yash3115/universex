const mongoose = require("mongoose");

const aiUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dateKey: { type: String, trim: true, required: true },
    requests: { type: Number, default: 0 },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    lastRateLimit: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

aiUsageSchema.index({ dataScope: 1, user: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("AiUsage", aiUsageSchema);

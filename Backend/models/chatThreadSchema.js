const mongoose = require("mongoose");

const chatThreadSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["direct", "department"], required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pairKey: { type: String, trim: true },
    department: { type: String, trim: true, default: "" },
    lastMessage: { type: String, trim: true, default: "" },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

chatThreadSchema.index(
  { dataScope: 1, type: 1, pairKey: 1 },
  { unique: true, partialFilterExpression: { type: "direct", pairKey: { $type: "string" } } }
);
chatThreadSchema.index(
  { dataScope: 1, type: 1, department: 1 },
  { unique: true, partialFilterExpression: { type: "department", department: { $type: "string" } } }
);
chatThreadSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model("ChatThread", chatThreadSchema);

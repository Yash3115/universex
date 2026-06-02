const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    thread: { type: mongoose.Schema.Types.ObjectId, ref: "ChatThread", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

chatMessageSchema.index({ thread: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);

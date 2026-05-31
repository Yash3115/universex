const mongoose = require("mongoose");

const INTERACTION_TYPES = ["StudyInvite", "ProjectInvite", "HelpRequest"];
const INTERACTION_STATUSES = ["pending", "accepted", "declined", "completed", "cancelled"];

const connectionInteractionSchema = new mongoose.Schema(
  {
    connection: { type: mongoose.Schema.Types.ObjectId, ref: "Connection", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: INTERACTION_TYPES, required: true },
    title: { type: String, trim: true, required: true, maxlength: 120 },
    message: { type: String, trim: true, default: "", maxlength: 1000 },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: INTERACTION_STATUSES, default: "pending" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

connectionInteractionSchema.index({ recipient: 1, status: 1, createdAt: -1 });
connectionInteractionSchema.index({ sender: 1, status: 1, createdAt: -1 });
connectionInteractionSchema.index({ connection: 1, createdAt: -1 });
connectionInteractionSchema.index({ type: 1, status: 1 });

module.exports = {
  ConnectionInteraction: mongoose.model("ConnectionInteraction", connectionInteractionSchema),
  INTERACTION_STATUSES,
  INTERACTION_TYPES,
};
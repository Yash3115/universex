const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: [
        "account_created",
        "account_deactivated",
        "account_reactivated",
        "temporary_password_reset",
        "access_request_updated",
      ],
      required: true,
    },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    accessRequest: { type: mongoose.Schema.Types.ObjectId, ref: "AccessRequest" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

adminAuditLogSchema.index({ actor: 1, createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);

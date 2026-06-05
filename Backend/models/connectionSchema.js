const mongoose = require("mongoose");

const userPreferenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    value: { type: String, trim: true, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const buildPairKey = (requester, recipient) => {
  if (!requester || !recipient) return undefined;
  return [String(requester), String(recipient)].sort().join(":");
};

const connectionSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pairKey: { type: String, trim: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    acceptedAt: { type: Date, default: null },
    favoriteBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    labels: [userPreferenceSchema],
    notes: [userPreferenceSchema],
  },
  { timestamps: true }
);

connectionSchema.pre("validate", function setPairKey(next) {
  this.pairKey = buildPairKey(this.requester, this.recipient);
  next();
});

connectionSchema.index({ dataScope: 1, requester: 1, recipient: 1 }, { unique: true });
connectionSchema.index({ dataScope: 1, pairKey: 1 }, { unique: true, sparse: true });
connectionSchema.index({ recipient: 1, status: 1 });
connectionSchema.index({ requester: 1, status: 1 });
connectionSchema.index({ status: 1, updatedAt: -1 });

module.exports = mongoose.model("Connection", connectionSchema);

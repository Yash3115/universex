const mongoose = require("mongoose");

const routineEntrySchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    day: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    startTime: { type: String, trim: true, default: "" },
    endTime: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    instructor: { type: String, trim: true, default: "" },
    color: { type: String, trim: true, default: "#2563eb" },
  },
  { _id: true }
);

const routineSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    entries: [routineEntrySchema],
  },
  { timestamps: true }
);

routineSchema.index({ dataScope: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Routine", routineSchema);

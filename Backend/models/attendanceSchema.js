const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Attended", "Missed", "Cancelled"],
      required: true,
    },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, subject: 1, date: 1 }, { unique: true });
attendanceSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
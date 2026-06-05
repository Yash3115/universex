const mongoose = require("mongoose");

const officeHourBookingSchema = new mongoose.Schema(
  {
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "OfficeHourSlot", required: true },
    professor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    reason: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["requested", "confirmed", "rejected", "cancelled", "completed"], default: "requested" },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

officeHourBookingSchema.index({ dataScope: 1, slot: 1, student: 1 }, { unique: true });
officeHourBookingSchema.index({ professor: 1, status: 1, createdAt: -1 });
officeHourBookingSchema.index({ student: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("OfficeHourBooking", officeHourBookingSchema);

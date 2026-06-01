const mongoose = require("mongoose");

const officeHourSlotSchema = new mongoose.Schema(
  {
    professor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    title: { type: String, trim: true, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    mode: { type: String, enum: ["online", "offline", "hybrid"], default: "offline" },
    location: { type: String, trim: true, default: "" },
    meetingLink: { type: String, trim: true, default: "" },
    capacity: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ["open", "closed", "cancelled"], default: "open" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

officeHourSlotSchema.index({ professor: 1, startAt: 1 });
officeHourSlotSchema.index({ course: 1, startAt: 1 });
officeHourSlotSchema.index({ status: 1, startAt: 1 });

module.exports = mongoose.model("OfficeHourSlot", officeHourSlotSchema);
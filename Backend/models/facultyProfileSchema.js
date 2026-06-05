const mongoose = require("mongoose");

const facultyProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    employeeId: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    officeLocation: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    researchAreas: [{ type: String, trim: true }],
    website: { type: String, trim: true, default: "" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

facultyProfileSchema.index({ dataScope: 1, user: 1 }, { unique: true, sparse: true });
facultyProfileSchema.index({ department: 1 });

module.exports = mongoose.model("FacultyProfile", facultyProfileSchema);

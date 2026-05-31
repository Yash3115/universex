const mongoose = require("mongoose");

const pendingSignupSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  hashedPassword: { type: String, required: true },
  contactNumber: { type: String, trim: true, default: "" },
  gender: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  college: { type: String, required: true },
  role: { type: String, enum: ["Student", "Professor"], default: "Student" },
  employeeId: { type: String, trim: true, default: "" },
  designation: { type: String, trim: true, default: "" },
  department: { type: String, trim: true, default: "" },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900,
  },
});

module.exports = mongoose.model("PendingSignup", pendingSignupSchema);
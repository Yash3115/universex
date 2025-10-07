const mongoose = require("mongoose");

// Define the Profile schema
const profileSchema = new mongoose.Schema({
	about: {
		type: String,
		trim: true,
	},
	contactNumber: {
		type: Number,
		trim: true,
	},
	insta: { type: String, default: "" },
	linkedin: { type: String, default: "" },
	department: { type: String, trim: true, default: "" }, // New field
	graduationYear: { type: Number}, // New field
});
  
// Export the Profile model
module.exports = mongoose.model("profile", profileSchema);
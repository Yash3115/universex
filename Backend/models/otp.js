const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
	},
	otp: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 300, // Document expires after 5 minutes (300 seconds)
	},
});

// Function to send verification email
async function sendVerificationEmail(email, otp) {
	try {
		const mailResponse = await mailSender(
			email,
			"Verification Email",
			emailTemplate(otp)
		);
		return mailResponse;
	} catch (error) {
		console.error("❌ Error sending email:", error.message);
		throw error;
	}
}

// Pre-save hook to send email after a new document is created
OTPSchema.pre("save", async function (next) {
	if (!this.isNew) return next(); // Only send email for new documents

	try {
		await sendVerificationEmail(this.email, this.otp);
		next();
	} catch (error) {
		console.error("❌ Error in pre-save hook:", error.message);
		next(error);
	}
});

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;
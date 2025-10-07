const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const User = require("../models/userSchema");
const OTP = require("../models/otp");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/profileSchema");
require("dotenv").config();

// **Signup Controller for Registering Users**
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      contactNumber,
      otp,
      gender,
      dateOfBirth,
      college,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !otp ||
      !gender ||
      !dateOfBirth ||
      !college
    ) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }
    console.log(otp);
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please sign in",
      });
    }

    // Validate OTP
    const response = (await OTP.find({ email }).sort({ createdAt: -1 }).limit(1)) || [];
    
    // Ensure response exists before checking OTP
    if (response.length === 0 || String(otp) !== String(response[0].otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Additional Profile for User
    const profileDetails = await Profile.create({
      gender,
      dateOfBirth,
      about: null,
      contactNumber: contactNumber || null,
    });

    // Create User
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      college,
      additionalDetails: profileDetails._id,
      role: "Student",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpmteUFDtMLPVMxqUwYc5I7vMhEi8RKQznPSeSMKZ_FG5DBWGDs25O8cK7N10GhNudeRY&usqp=CAU",
    });

    return res.status(200).json({
      success: true,
      user,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Error in Signup:", error);
    return res.status(500).json({
      success: false,
      message: "User registration failed. Please try again.",
      error: error.message, // Include error message for debugging
    });
  }
};

// **Login Controller**
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    // Find user
    const user = await User.findOne({ email }).populate("additionalDetails");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please sign up first.",
      });
    }

    // Validate password
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { email: user.email, id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      user.token = token;
      user.password = undefined;

      res.cookie("token", token, {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      });

      return res.status(200).json({
        success: true,
        token,
        user,
        message: "Login successful",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

// **Send OTP for Email Verification**
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const checkUserPresent = await User.findOne({ email });
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User is already registered",
      });
    }

    let otp;
    let isUnique = false;

    while (!isUnique) {
      otp = otpGenerator.generate(4, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });

      const existingOtp = await OTP.findOne({ otp });
      if (!existingOtp) isUnique = true;
    }

    await OTP.create({ email, otp });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
    });
  } catch (error) {
    console.log("Error in sendotp:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// **Change Password Controller**
exports.changePassword = async (req, res) => {
  try {
    const userDetails = await User.findById(req.user.id);
    const { oldPassword, newPassword } = req.body;

    if (!(await bcrypt.compare(oldPassword, userDetails.password))) {
      return res.status(401).json({
        success: false,
        message: "Incorrect old password",
      });
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    );

    try {
      await mailSender(
        updatedUser.email,
        "Password Updated",
        passwordUpdated(
          updatedUser.email,
          `Password successfully updated for ${updatedUser.firstName} ${updatedUser.lastName}`
        )
      );
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error sending email notification",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    return res.status(500).json({
      success: false,
      message: "Password update failed",
      error: error.message,
    });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: "Error fetching balance" });
  }
};

// get User Detail for Session persistance

exports.getUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password").populate("additionalDetails");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Session Error:", error);
    return res.status(500).json({ success: false, message: "Session expired or invalid" });
  }
};
    

// logout
exports.logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "None" });
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};
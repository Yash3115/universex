const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const User = require("../models/userSchema");
const OTP = require("../models/otp");
const PendingSignup = require("../models/pendingSignupSchema");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/profileSchema");
const FacultyProfile = require("../models/facultyProfileSchema");
const AccessRequest = require("../models/accessRequestSchema");
const {
  getAuthCookieOptions,
  getClearAuthCookieOptions,
} = require("../utils/cookieOptions");
require("dotenv").config();

const ADMIN_USER_SELECT = "-password";

const isPublicSignupEnabled = () => process.env.ALLOW_PUBLIC_SIGNUP === "true";

const normalizeManagedRole = (role = "Student") => {
  if (role === "Student" || role === "Professor") return role;
  return null;
};

const generateTemporaryPassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const raw = Array.from(crypto.randomBytes(12))
    .map((value) => alphabet[value % alphabet.length])
    .join("");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
};

const populateUserForSession = (query) => query.select("-password").populate("additionalDetails").populate("facultyProfile");

const applyProfileUpdates = (profile, payload = {}) => {
  const fields = ["about", "contactNumber", "insta", "linkedin", "department", "graduationYear", "skills", "interests", "visibility"];
  fields.forEach((field) => {
    if (payload[field] !== undefined) profile[field] = payload[field];
  });
};

// **Signup Controller for Registering Users**
exports.signup = async (req, res) => {
  try {
    if (!isPublicSignupEnabled()) {
      return res.status(403).json({
        success: false,
        message: "Self signup is disabled. Please use the account provided by your admin.",
      });
    }

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
      role = "Student",
      employeeId = "",
      designation = "",
      department = "",
    } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !otp) {
      return res.status(403).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const pendingSignup = await PendingSignup.findOne({ email: normalizedEmail });
    const usingPendingSignup = Boolean(pendingSignup);

    const normalizedRole = role === "Professor" ? "Professor" : "Student";

    if (!usingPendingSignup && (!firstName || !lastName || !password || !gender || !dateOfBirth || !college)) {
      return res.status(400).json({
        success: false,
        message: "Signup session expired. Please request a new OTP.",
      });
    }

    if (!usingPendingSignup && normalizedRole === "Professor" && (!employeeId || !designation || !department)) {
      return res.status(400).json({
        success: false,
        message: "Faculty ID, designation, and department are required for professor signup",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please sign in",
      });
    }

    // Validate OTP
    const response = (await OTP.find({ email: normalizedEmail }).sort({ createdAt: -1 }).limit(1)) || [];
    
    // Ensure response exists before checking OTP
    if (response.length === 0 || String(otp) !== String(response[0].otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const signupData = usingPendingSignup
      ? {
          firstName: pendingSignup.firstName,
          lastName: pendingSignup.lastName,
          email: pendingSignup.email,
          contactNumber: pendingSignup.contactNumber,
          gender: pendingSignup.gender,
          dateOfBirth: pendingSignup.dateOfBirth,
          college: pendingSignup.college,
          role: pendingSignup.role || "Student",
          employeeId: pendingSignup.employeeId || "",
          designation: pendingSignup.designation || "",
          department: pendingSignup.department || "",
          hashedPassword: pendingSignup.hashedPassword,
        }
      : {
          firstName,
          lastName,
          email: normalizedEmail,
          contactNumber,
          gender,
          dateOfBirth,
          college,
          role: normalizedRole,
          employeeId,
          designation,
          department,
          hashedPassword: await bcrypt.hash(password, 10),
        };

    // Create Additional Profile for User
    const profileDetails = await Profile.create({
      gender: signupData.gender,
      dateOfBirth: signupData.dateOfBirth,
      about: null,
      contactNumber: signupData.contactNumber || null,
    });

    let facultyProfile = null;
    if (signupData.role === "Professor") {
      facultyProfile = await FacultyProfile.create({
        employeeId: signupData.employeeId,
        designation: signupData.designation,
        department: signupData.department,
      });
    }

    // Create User
    const user = await User.create({
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      email: signupData.email,
      contactNumber: signupData.contactNumber,
      password: signupData.hashedPassword,
      college: signupData.college,
      gender: signupData.gender,
      dateOfBirth: signupData.dateOfBirth,
      additionalDetails: profileDetails._id,
      role: signupData.role,
      facultyProfile: facultyProfile?._id,
      verificationStatus: signupData.role === "Professor" ? "pending" : "verified",
      image: {
        url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpmteUFDtMLPVMxqUwYc5I7vMhEi8RKQznPSeSMKZ_FG5DBWGDs25O8cK7N10GhNudeRY&usqp=CAU",
      },
    });

    if (facultyProfile) {
      facultyProfile.user = user._id;
      await facultyProfile.save();
    }

    await OTP.deleteMany({ email: normalizedEmail });
    await PendingSignup.deleteOne({ email: normalizedEmail });
    user.password = undefined;

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
    });
  }
};

// **Login Controller**
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    // Validate input
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    // Find user
    const user = await User.findOne({ email: normalizedEmail }).populate("additionalDetails").populate("facultyProfile");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found. Please contact your admin.",
      });
    }
    if (user.active === false) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive. Please contact your admin.",
      });
    }

    // Validate password
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { email: user.email, id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      user.password = undefined;

      res.cookie("token", token, getAuthCookieOptions());

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
    if (!isPublicSignupEnabled()) {
      return res.status(403).json({
        success: false,
        message: "Self signup is disabled. Please use the account provided by your admin.",
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      contactNumber,
      gender,
      dateOfBirth,
      college,
      role = "Student",
      employeeId = "",
      designation = "",
      department = "",
    } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists
    const checkUserPresent = await User.findOne({ email: normalizedEmail });
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User is already registered",
      });
    }

    const hasSignupPayload = Boolean(firstName || lastName || password || contactNumber || gender || dateOfBirth || college);

    const normalizedRole = role === "Professor" ? "Professor" : "Student";

    if (hasSignupPayload) {
      if (!firstName || !lastName || !password || !gender || !dateOfBirth || !college) {
        return res.status(400).json({
          success: false,
          message: "All required signup fields are required before sending OTP",
        });
      }

      if (normalizedRole === "Professor" && (!employeeId || !designation || !department)) {
        return res.status(400).json({
          success: false,
          message: "Faculty ID, designation, and department are required for professor signup",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await PendingSignup.findOneAndUpdate(
        { email: normalizedEmail },
        {
          firstName,
          lastName,
          email: normalizedEmail,
          hashedPassword,
          contactNumber: contactNumber || "",
          gender,
          dateOfBirth,
          college,
          role: normalizedRole,
          employeeId,
          designation,
          department,
          createdAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      const pendingSignup = await PendingSignup.findOne({ email: normalizedEmail });
      if (!pendingSignup) {
        return res.status(400).json({
          success: false,
          message: "Signup session expired. Please fill the signup form again.",
        });
      }
    }

    const latestOtp = await OTP.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
    if (latestOtp && Date.now() - latestOtp.createdAt.getTime() < 60 * 1000) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP",
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

    await OTP.deleteMany({ email: normalizedEmail });
    await OTP.create({ email: normalizedEmail, otp });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error in sendotp:", error.message);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// **Change Password Controller**
exports.changePassword = async (req, res) => {
  try {
    const userDetails = await User.findById(req.user.id);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    if (!(await bcrypt.compare(oldPassword, userDetails.password))) {
      return res.status(401).json({
        success: false,
        message: "Incorrect old password",
      });
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword, mustChangePassword: false, temporaryPasswordLastSetAt: null },
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
    const user = await User.findById(req.user.id).select("-password").populate("additionalDetails").populate("facultyProfile");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userData = user.toObject();
    userData.isDemo = Boolean(req.user?.isDemo);
    userData.demoExpiresAt = req.user?.demoExpiresAt || null;

    return res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.error("Session Error:", error);
    return res.status(500).json({ success: false, message: "Session expired or invalid" });
  }
};
    

// logout
exports.logout = (req, res) => {
  res.clearCookie("token", getClearAuthCookieOptions());
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

exports.createManagedAccount = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role = "Student",
      college,
      gender = "",
      dateOfBirth = "",
      contactNumber = "",
      department = "",
      graduationYear,
      employeeId = "",
      designation = "",
      password,
    } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    const managedRole = normalizeManagedRole(role);

    if (!managedRole) {
      return res.status(400).json({
        success: false,
        message: "Admins can only create Student or Professor accounts",
      });
    }

    if (!firstName?.trim() || !lastName?.trim() || !normalizedEmail || !college?.trim()) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and college are required",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const temporaryPassword = password?.trim() || generateTemporaryPassword();
    if (temporaryPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Temporary password must be at least 8 characters" });
    }

    const profile = await Profile.create({
      contactNumber: contactNumber || null,
      department,
      graduationYear: graduationYear || undefined,
      visibility: "public",
    });

    let facultyProfile = null;
    if (managedRole === "Professor") {
      facultyProfile = await FacultyProfile.create({
        employeeId,
        designation,
        department,
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
      });
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(temporaryPassword, 10),
      college: college.trim(),
      gender,
      dateOfBirth,
      additionalDetails: profile._id,
      role: managedRole,
      facultyProfile: facultyProfile?._id,
      verificationStatus: "verified",
      active: true,
      mustChangePassword: true,
      profileCompletionRequired: true,
      provisionedBy: req.user.id,
      provisionedAt: new Date(),
      temporaryPasswordLastSetAt: new Date(),
      image: {
        url: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(`${firstName} ${lastName}`)}`,
        publicId: "managed-account-avatar",
        format: "svg",
      },
    });

    if (facultyProfile) {
      facultyProfile.user = user._id;
      await facultyProfile.save();
    }

    const createdUser = await populateUserForSession(User.findById(user._id));

    return res.status(201).json({
      success: true,
      message: `${managedRole} account created`,
      user: createdUser,
      temporaryPassword,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create account", error: error.message });
  }
};

exports.listManagedAccounts = async (req, res) => {
  try {
    const { role, search = "", onboarding = "" } = req.query;
    const filter = { role: { $in: ["Student", "Professor"] } };

    if (["Student", "Professor"].includes(role)) filter.role = role;
    if (onboarding === "required") {
      filter.$or = [{ mustChangePassword: true }, { profileCompletionRequired: true }];
    }
    if (search.trim()) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { firstName: new RegExp(search.trim(), "i") },
            { lastName: new RegExp(search.trim(), "i") },
            { email: new RegExp(search.trim(), "i") },
            { college: new RegExp(search.trim(), "i") },
          ],
        },
      ];
    }

    const users = await User.find(filter)
      .select(ADMIN_USER_SELECT)
      .populate("additionalDetails")
      .populate("facultyProfile")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load accounts", error: error.message });
  }
};

exports.listAccessRequests = async (req, res) => {
  try {
    const { status = "", role = "", search = "" } = req.query;
    const filter = {};

    if (["new", "reviewed", "closed"].includes(status)) filter.status = status;
    if (["Student", "Professor"].includes(role)) filter.role = role;
    if (search.trim()) {
      filter.$or = [
        { name: new RegExp(search.trim(), "i") },
        { email: new RegExp(search.trim(), "i") },
        { college: new RegExp(search.trim(), "i") },
      ];
    }

    const requests = await AccessRequest.find(filter)
      .sort({ status: 1, createdAt: -1 })
      .limit(100);

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load access requests", error: error.message });
  }
};

exports.updateAccessRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["new", "reviewed", "closed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid access request status" });
    }

    const request = await AccessRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: "Access request not found" });
    }

    return res.status(200).json({ success: true, request });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update access request", error: error.message });
  }
};

exports.completeOnboarding = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      firstName,
      lastName,
      about,
      contactNumber,
      insta,
      linkedin,
      department,
      graduationYear,
      skills,
      interests,
      visibility,
      employeeId,
      designation,
      officeLocation,
      bio,
      researchAreas,
      website,
    } = req.body;

    const user = await User.findById(req.user.id).populate("additionalDetails").populate("facultyProfile");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    if (firstName !== undefined) user.firstName = String(firstName).trim() || user.firstName;
    if (lastName !== undefined) user.lastName = String(lastName).trim() || user.lastName;
    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    user.profileCompletionRequired = false;
    user.temporaryPasswordLastSetAt = null;

    const profile = await Profile.findById(user.additionalDetails?._id || user.additionalDetails);
    if (profile) {
      applyProfileUpdates(profile, { about, contactNumber, insta, linkedin, department, graduationYear, skills, interests, visibility });
      await profile.save();
    }

    if (user.role === "Professor") {
      let facultyProfile = user.facultyProfile?._id || user.facultyProfile;
      if (!facultyProfile) {
        const createdFacultyProfile = await FacultyProfile.create({ user: user._id });
        facultyProfile = createdFacultyProfile._id;
        user.facultyProfile = facultyProfile;
      }
      await FacultyProfile.findByIdAndUpdate(
        facultyProfile,
        {
          ...(employeeId !== undefined ? { employeeId } : {}),
          ...(designation !== undefined ? { designation } : {}),
          ...(department !== undefined ? { department } : {}),
          ...(officeLocation !== undefined ? { officeLocation } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(researchAreas !== undefined ? { researchAreas } : {}),
          ...(website !== undefined ? { website } : {}),
        },
        { new: true, runValidators: true }
      );
    }

    await user.save();

    const updatedUser = await populateUserForSession(User.findById(user._id));
    return res.status(200).json({
      success: true,
      message: "Welcome setup completed",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to complete setup", error: error.message });
  }
};

const Profile = require("../models/profileSchema");
const User = require("../models/userSchema");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const mongoose = require("mongoose");

// Method for updating a profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      about = "",
      contactNumber = "",
      insta = "",
      linkedin = "",
      department = "",  // New field
      graduationYear = ""  // New field
    } = req.body;

    // Extract user ID from token
    const userId = req.user.id;
    
    // Find the user by ID
    const userDetails = await User.findById(userId);
    if (!userDetails) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Find the associated profile
    const profile = await Profile.findById(userDetails.additionalDetails);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Update only profile-related fields
    profile.about = about || profile.about;
    profile.contactNumber = contactNumber || profile.contactNumber;
    profile.insta = insta || profile.insta;
    profile.linkedin = linkedin || profile.linkedin;
    profile.department = department || profile.department;
    profile.graduationYear = graduationYear || profile.graduationYear;

    await profile.save();

    // Fetch the updated user with populated profile details
    const updatedUserDetails = await User.findById(userId)
      .populate("additionalDetails")
      .exec();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ success: false, message: "Profile update failed", error: error.message });
  }
};

// Method for updating the display picture
exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;

    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );

    console.log(image);

    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );

    res.send({
      success: true,
      message: "Image Updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
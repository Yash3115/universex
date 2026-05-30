const Profile = require("../models/profileSchema");
const User = require("../models/userSchema");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// Method for updating a profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      about,
      contactNumber,
      insta,
      linkedin,
      department,
      graduationYear
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

    // Update only fields explicitly provided by the client.
    if (about !== undefined) profile.about = about;
    if (contactNumber !== undefined) profile.contactNumber = contactNumber;
    if (insta !== undefined) profile.insta = insta;
    if (linkedin !== undefined) profile.linkedin = linkedin;
    if (department !== undefined) profile.department = department;
    if (graduationYear !== undefined) profile.graduationYear = graduationYear;

    await profile.save();

    // Fetch the updated user with populated profile details
    const updatedUserDetails = await User.findById(userId)
      .populate("additionalDetails")
      .exec();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUserDetails.additionalDetails,
      user: updatedUserDetails,
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
    const displayPicture = req.files?.displayPicture;
    const userId = req.user.id;

    if (!displayPicture) {
      return res.status(400).json({
        success: false,
        message: "Display picture is required",
      });
    }

    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME || "profiles",
      1000,
      1000
    );

    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    ).select("-password").populate("additionalDetails");

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
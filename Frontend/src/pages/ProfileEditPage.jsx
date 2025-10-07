import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import ProfileImageUploader from "../components/ProfileImageUploader";
import { updateProfile } from "../features/auth/authSlice";

function ProfileEdit() {
  const profileData = useSelector((state) => state.auth.user?.additionalDetails);
  const dispatch = useDispatch();

  // ✅ Initialize state as empty values to avoid "undefined" issues
  const [formData, setFormData] = useState({
    about: "",
    insta: "",
    linkedin: "",
    department: "",
    graduationYear: "",
  });

  // ✅ Update `formData` when `profileData` becomes available
  useEffect(() => {
    if (profileData) {
      setFormData({
        about: profileData.about || "",
        insta: profileData.insta || "",
        linkedin: profileData.linkedin || "",
        department: profileData.department || "",
        graduationYear: profileData.graduationYear || "",
      });
    }
  }, [profileData]); // Runs when `profileData` changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateProfile(formData));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white text-black rounded-lg overflow-hidden shadow-lg">
        {/* Image Section */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center bg-gray-200">
          <img src="/ProfileEdit.jpg" alt="Profile Edit" className="w-full h-full object-cover" />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-4">
            Edit Profile
          </h2>

          <ProfileImageUploader />

          <form onSubmit={handleSubmit}>
            {/* Bio Input */}
            <div className="mb-2">
              <label className="block text-gray-700">Your Bio</label>
              <textarea
                name="about"
                className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                rows="4"
                placeholder="Write something about yourself..."
                value={formData.about}
                onChange={handleChange}
              ></textarea>
            </div>

            {/* Social Links */}
            <div className="mb-2 flex">
              <div className="w-1/2 mr-2">
                <label className="block text-gray-700">Instagram Profile</label>
                <input
                  type="text"
                  name="insta"
                  className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  value={formData.insta}
                  onChange={handleChange}
                />
              </div>
              <div className="w-1/2 ml-2">
                <label className="block text-gray-700">LinkedIn Profile</label>
                <input
                  type="text"
                  name="linkedin"
                  className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  value={formData.linkedin}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Department Selection */}
            <div className="mb-2">
              <label className="block text-gray-700">Department</label>
              <select
                name="department"
                className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                value={formData.department}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                <option value="Computer Science Engineering">Computer Science Engineering</option>
                <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>

            {/* Graduation Year Input */}
            <div className="mb-2">
              <label className="block text-gray-700">Graduation Year</label>
              <input
                type="number"
                name="graduationYear"
                className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                value={formData.graduationYear}
                onChange={handleChange}
                min="2000"
                max="2100"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg mt-4"
            >
              {profileData ? "Save Changes" : "Create Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileEdit;

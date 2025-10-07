import React, { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    contactNumber: "",
    college: "",
    gender: "",
    dateOfBirth: "",
    department: "",
    role: "",
    year: "",
    otp: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let validationErrors = {};

    if (!formData.firstName)
      validationErrors.firstName = "First Name is required";
    if (!formData.email) {
      validationErrors.email = "Email is required";
    } else {
      const collegeDomains = [
        "nitkkr.ac.in",
        "dtu.ac.in",
        "nsit.ac.in",
        "iiitd.ac.in",
        "iiit.ac.in",
        "gmail.com"
      ];
      const emailDomain = formData.email.split("@")[1];
      if (!collegeDomains.includes(emailDomain)) {
        validationErrors.email = "Email must be from a valid college domain";
      }
    }
    if (!formData.password) validationErrors.password = "Password is required";
    if (formData.password.length < 6)
      validationErrors.password = "Password must be at least 6 characters";
    if (!formData.contactNumber)
      validationErrors.contactNumber = "Contact Number is required";
    if (!formData.college)
      validationErrors.college = "Please select your college";
    if (!formData.gender) validationErrors.gender = "Please select your gender";
    if (!formData.dateOfBirth)
      validationErrors.dateOfBirth = "Date of Birth is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    console.log("Sign Up Form Data Submitted:", formData);
    localStorage.setItem("user-data",JSON.stringify(formData));

    try {
      const response = await axios.post(
        "https://universex-m5nn.vercel.app/api/users/sendotp",
        {email:formData.email},
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      )
      
      console.log(response)
      console.log(response.data)
      const res = response.data;
      
      if(res.success){
        console.log('working')
        navigate("/otp")
      }
      else{
        toast.error("Something went wrong! Try again")
      }
    } catch (error) {
      // if(error.response.data.message==="User is already registered"){
      //   toast.error(error.response.data.message);
      // }
      // else{
      //   console.error("signup error",error);
      // }
      console.error("signup error",error);
    }
    // Call API to submit form data
    //  if successful,alert successful redirect to profileEdit page
    // if unsuccessful, alert error message reset form data
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 ">
      <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white text-black rounded-lg overflow-hidden drop-shadow-lgz">
        {/* Image Section - Visible only on Desktop */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center bg-gray-200">
          <img
            src="/Signup.jpg"
            alt="Signup Illustration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-4">
            Sign Up Here
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-2 flex">
              <div className="w-1/2 mr-2">
                <label className="block text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div className="w-1/2 ml-2">
                <label className="block text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="mb-2">
              <label className="block text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <button
                  type="button"
                  className="absolute right-3 top-4 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            <div className="mb-2">
              <label className="block text-gray-700">Contact Number</label>
              <input
                type="text"
                name="contactNumber"
                className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                value={formData.contactNumber}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label className="block text-gray-700">College Name</label>
              <select
                name="college"
                value={formData.college}
                onChange={handleChange}
                className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="">Select College</option>
                <option>NIT Kurukshetra</option>
                <option>DTU</option>
                <option>NSIT</option>
                <option>IIIT Delhi</option>
                <option>IIIT Hyderabad</option>
              </select>
              {errors.college && (
                <p className="text-red-500 text-sm mt-1">{errors.college}</p>
              )}
            </div>

            <div className="mb-2 flex">
              <div className="w-1/2 mr-2">
                <label className="block text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Others</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                )}
              </div>
              <div className="w-1/2 ml-2">
                <label className="block text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full p-2 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg mt-4"
            >
              Sign Up
            </button>
          </form>
          <p className="text-center mt-4 text-gray-700">
            Already Registered?{" "}
            <span
              className="text-blue-600 cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Login Here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

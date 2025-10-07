// Login Page is ready.
import React, { useState, useEffect } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../features/auth/authSlice";
import { useSelector } from "react-redux";


const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/"); // Redirect only after login success
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let validationErrors = {};

    if (!formData.email) {
      validationErrors.email = "Email is required";
    }
    if (!formData.password) {
      validationErrors.password = "Password is required";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // console.log("Login Data Submitted:", formData);
    // Call API to submit the form and verify the user
    dispatch(login(formData));

  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white text-black rounded-lg overflow-hidden shadow-lg">
        <div className="hidden md:flex md:w-1/2 items-center justify-center bg-gray-200">
          <img src="/Login.jpg" alt="Login Illustration" className="w-full h-full object-cover" />
        </div>
        
        <div className="w-full md:w-1/2 p-8">
          {/* <button className="text-xl mb-4 flex items-center text-black">
            <FaArrowLeft className="mr-2" />
          </button> */}
          <h2 className="text-3xl font-bold text-center text-blue-900">Welcome Back</h2>
          <h3 className="text-lg font-semibold text-center mt-2 mb-6">Login to Your Account</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-3 mt-1 rounded-lg bg-white text-black border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <button
                  type="button"
                  className="absolute right-3 top-4 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg mt-4">
              Login
            </button>
          </form>
          <p className="text-center mt-4 text-gray-700">
            Don’t have an account? <span className="text-blue-600 cursor-pointer" onClick={()=>navigate("/signup")}>Sign Up</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
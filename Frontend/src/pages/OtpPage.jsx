import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

const OTPVerification = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    if (value.length > 1) return;
    let newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  useEffect(()=>{
    if(!localStorage.getItem("user-data")){
      navigate("/signup", { replace: true });
    }
  },[navigate])
  const verifyOtp = async() => {
    try {
      const storedUserData = localStorage.getItem("user-data");
      if (!storedUserData) {
        toast.error("Signup session expired. Please sign up again.");
        navigate("/signup", { replace: true });
        return;
      }

      const formData = JSON.parse(storedUserData);
      const otp2 = otp.join("");
      if (otp2.length !== 4) {
        toast.error("Please enter the complete OTP");
        return;
      }
      formData.otp=otp2;
      const res = await api.post(
        "/api/users/signup",
          formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      )
      const response = res.data;
      if(!response.success){
        toast.error(response.message);
      }
      else{
        toast.success("OTP Verification completed")
        localStorage.removeItem("user-data");
        navigate("/login");
      }
      
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    }
  };
  const handleResendOTP= async()=>{
    try {
      const storedUserData = localStorage.getItem("user-data");
      if (!storedUserData) {
        toast.error("Signup session expired. Please sign up again.");
        navigate("/signup", { replace: true });
        return;
      }

      const formData = JSON.parse(storedUserData);
      const response = await api.post(
        "/api/users/sendotp",
        { email: formData.email },
        {
          headers: { "Content-Type": "application/json" },
        }
      )
      toast.success(response.data.message || "OTP resent successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to resend OTP");
    }
  }
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-lg font-semibold text-center">Verification Code</h2>
        <p className="text-sm text-gray-500 text-center">
          We have sent the verification code to your email
        </p>
        <div className="flex justify-center gap-2 mt-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              className="input input-bordered w-12 h-12 text-center text-xl"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
            />
          ))}
        </div>
        <div className="text-center cursor-pointer mt-2 underline text-blue-500">
          <p onClick={handleResendOTP}>Resend Otp</p>
        </div>
        <button className="btn btn-primary w-full mt-4" onClick={verifyOtp}>
          Confirm
        </button>
      </div>
    </div>
  );
};

export default OTPVerification;

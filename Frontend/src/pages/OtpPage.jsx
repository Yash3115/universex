import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const OTPVerification = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    let newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  useEffect(()=>{
    if(!localStorage.getItem("user-data")){
      navigate("/signup");
    }

    return()=>{
      if(localStorage.getItem("user-data")){
        localStorage.removeItem("user-data");
      }
    }
  },[])
  const verifyOtp = async() => {
    try {
      const formData = JSON.parse(localStorage.getItem("user-data"));
      const otp2 = otp.join("");
      formData.otp=otp2;
      const res = await axios.post(
        "http://localhost:8000/api/users/signup",
          formData,
        {
          withCredentials: true,
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
      toast.error(error.response.data.message);
    }
  };
  const handleResendOTP= async()=>{
    const formData = localStorage.getItem("user-data");
    const response = await axios.post(
      "http://localhost:8000/api/users/sendotp",
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    )
    const res = response.data;
    console.log(res);
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

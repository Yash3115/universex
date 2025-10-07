import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getUser } from "./features/auth/authSlice";
import {
  BudgetTracker,
  Community,
  Landing,
  Login,
  ProfileEdit,
  SignUp,
  OTPVerification,
  ProfilePage,
  Dashboard,
  ContactDirectory
} from "./pages";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import ClassRoutine from "./dummy/DummyClassRoutine";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ClassRoutineInput from "./dummy/DummyAddRoutine";
import UnAuthenticatedRoutes from "./utils/protectedRoutes/UnAuthenticatedRoutes";
import AuthenticatedRoutes from "./utils/protectedRoutes/AuthenticatedRoutes";  
const App = () => {
  const dispatch = useDispatch();

    // add a functionality here sush that the use effect should only run when the cookie is present in the browser

  useEffect(() => {
    // if (document.cookie.includes("yourCookieName=")) {
    //   console.log("Cookie is present, running effect...");
    //   dispatch(getUser());
    // }
    dispatch(getUser());
     // Fetch user session on page load
  }, [dispatch]);


  return (
    <BrowserRouter>
      <ToastContainer />
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/signup"
          element={
            <UnAuthenticatedRoutes>
              <SignUp />
            </UnAuthenticatedRoutes>
          }
        />
        <Route
          path="/login"
          element={
            <UnAuthenticatedRoutes>
              <Login />
            </UnAuthenticatedRoutes>
          }
        />
        <Route
          path="/community"
          element={
            <AuthenticatedRoutes>
              <Community />
            </AuthenticatedRoutes>
          }
        />
        <Route
          path="/profileEdit"
          element={
            <AuthenticatedRoutes>
              <ProfileEdit />
            </AuthenticatedRoutes>
          }
        />
        <Route
          path="/budget"
          element={
            <AuthenticatedRoutes>
              <BudgetTracker />
            </AuthenticatedRoutes>
          }
        />
        <Route
          path="/otp"
          element={
            <UnAuthenticatedRoutes>
              <OTPVerification />
            </UnAuthenticatedRoutes>
          }
        />
        <Route
          path="/class"
          element={
            <AuthenticatedRoutes>
              <ClassRoutine />
            </AuthenticatedRoutes>
          }
        />
        <Route
          path="/routineinput"
          element={
            <AuthenticatedRoutes>
              <ClassRoutineInput />
            </AuthenticatedRoutes>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthenticatedRoutes>
              <ProfilePage />
            </AuthenticatedRoutes>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AuthenticatedRoutes>
              <Dashboard />
            </AuthenticatedRoutes>
          }
        />
        <Route
          path="/contactDirectory"
          element={
            <AuthenticatedRoutes>
              <ContactDirectory />
            </AuthenticatedRoutes>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

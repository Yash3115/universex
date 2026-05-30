import { useEffect } from "react";
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
  ContactDirectory,
  JobsPage
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

  useEffect(() => {
    dispatch(getUser());
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
          path="/jobs"
          element={
            <AuthenticatedRoutes>
              <JobsPage />
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

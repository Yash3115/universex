import { lazy, Suspense, useEffect } from "react";
import { useDispatch } from "react-redux";
import { getUser } from "./features/auth/authSlice";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import UnAuthenticatedRoutes from "./utils/protectedRoutes/UnAuthenticatedRoutes";
import AuthenticatedRoutes from "./utils/protectedRoutes/AuthenticatedRoutes";  

const BudgetTracker = lazy(() => import("./pages/BudgetPage"));
const Community = lazy(() => import("./pages/CommunityPage"));
const Landing = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/LoginPage"));
const ProfileEdit = lazy(() => import("./pages/ProfileEditPage"));
const SignUp = lazy(() => import("./pages/SignUpPage"));
const OTPVerification = lazy(() => import("./pages/OtpPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ContactDirectory = lazy(() => import("./pages/ContactDirectory"));
const JobsPage = lazy(() => import("./pages/JobsPage"));
const ClassRoutineInput = lazy(() => import("./dummy/DummyAddRoutine"));
const AcademicPlannerPage = lazy(() => import("./pages/AcademicPlannerPage"));
const StudentDirectory = lazy(() => import("./pages/StudentDirectory"));
const ConnectionsPage = lazy(() => import("./pages/ConnectionsPage"));
const StudentProfilePage = lazy(() => import("./pages/StudentProfilePage"));
const InteractionsPage = lazy(() => import("./pages/InteractionsPage"));

const PageLoader = () => (
  <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
    <div className="rounded-3xl bg-white px-6 py-5 text-center shadow-xl shadow-slate-200/70">
      <span className="loading loading-spinner loading-lg text-blue-600" />
      <p className="mt-3 text-sm font-semibold text-gray-500">Loading UniverseX...</p>
    </div>
  </div>
);

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);


  return (
    <BrowserRouter>
      <ToastContainer />
      <Navbar />
      <Suspense fallback={<PageLoader />}>
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
                <AcademicPlannerPage />
              </AuthenticatedRoutes>
            }
          />
          <Route
            path="/academic"
            element={
              <AuthenticatedRoutes>
                <AcademicPlannerPage />
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
          <Route
            path="/students"
            element={
              <AuthenticatedRoutes>
                <StudentDirectory />
              </AuthenticatedRoutes>
            }
          />
          <Route
            path="/students/:id"
            element={
              <AuthenticatedRoutes>
                <StudentProfilePage />
              </AuthenticatedRoutes>
            }
          />
          <Route
            path="/connections"
            element={
              <AuthenticatedRoutes>
                <ConnectionsPage />
              </AuthenticatedRoutes>
            }
          />
          <Route
            path="/interactions"
            element={
              <AuthenticatedRoutes>
                <InteractionsPage />
              </AuthenticatedRoutes>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;

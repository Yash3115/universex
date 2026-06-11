// Import the required modules
const express = require("express")
const router = express.Router()

// Import the required controllers and middleware functions
const {
  login,
  signup,
  sendotp,
  changePassword,
  getBalance,
  getUser,
  logout,
  createManagedAccount,
  listManagedAccounts,
  listAccessRequests,
  updateAccessRequestStatus,
  completeOnboarding,
} = require("../controllers/Auth")
const {
  resetPasswordToken,
  resetPassword,
} = require("../controllers/ResetPassword")

const { authMiddleware, isAuthorised, requireNonDemo } = require("../middlewares/authMiddleware")

// Routes for Login, Signup, and Authentication

// ********************************************************************************************************
//                                      Authentication routes
// ********************************************************************************************************

// Route for user login
router.post("/login", login)

// Route for user signup
router.post("/signup", signup)

// Route for sending OTP to the user's email
router.post("/sendotp", sendotp)

// Route for Changing the password
router.post("/changepassword", authMiddleware, requireNonDemo, changePassword)

// Route for completing admin-provisioned first-login setup
router.post("/complete-onboarding", authMiddleware, requireNonDemo, completeOnboarding)

// Admin-managed account provisioning
router.get("/admin/accounts", authMiddleware, isAuthorised("Admin"), listManagedAccounts)
router.post("/admin/accounts", authMiddleware, requireNonDemo, isAuthorised("Admin"), createManagedAccount)
router.get("/admin/access-requests", authMiddleware, requireNonDemo, isAuthorised("Admin"), listAccessRequests)
router.patch("/admin/access-requests/:id", authMiddleware, requireNonDemo, isAuthorised("Admin"), updateAccessRequestStatus)

// Route for session persistance
router.get("/getUser", authMiddleware, getUser);

// Route for Logout
router.get("/logout", logout);


// ********************************************************************************************************
//                                      Reset Password
// ********************************************************************************************************
// Get user balance
router.get("/balance", authMiddleware, getBalance);
// Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken)

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword)

// Export the router for use in the main application
module.exports = router

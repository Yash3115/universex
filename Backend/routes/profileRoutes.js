const express = require("express")
const router = express.Router()
const {authMiddleware} = require("../middlewares/authMiddleware")
const {
  deleteAccount,
  updateProfile,
  updateDisplayPicture,
} = require("../controllers/profileController")

// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************
// Delete User Account
// router.delete("/deleteProfile", authMiddleware, deleteAccount)
router.put("/updateProfile", authMiddleware, updateProfile)
router.put("/updateDisplayPicture", authMiddleware, updateDisplayPicture)

module.exports = router
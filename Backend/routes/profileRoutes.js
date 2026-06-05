const express = require("express")
const router = express.Router()
const {authMiddleware, requireNonDemo} = require("../middlewares/authMiddleware")
const {
  updateProfile,
  updateDisplayPicture,
} = require("../controllers/profileController")

// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************
router.put("/updateProfile", authMiddleware, updateProfile)
router.put("/updateDisplayPicture", authMiddleware, requireNonDemo, updateDisplayPicture)

module.exports = router

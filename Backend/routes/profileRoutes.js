const express = require("express")
const router = express.Router()
const {authMiddleware} = require("../middlewares/authMiddleware")
const {
  updateProfile,
  updateDisplayPicture,
} = require("../controllers/profileController")

// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************
router.put("/updateProfile", authMiddleware, updateProfile)
router.put("/updateDisplayPicture", authMiddleware, updateDisplayPicture)

module.exports = router
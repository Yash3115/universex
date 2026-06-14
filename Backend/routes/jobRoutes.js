const express = require("express");
const {
  createJob,
  deleteJob,
  getAllJobs,
  getJobById,
  toggleInterestedJob,
  toggleSavedJob,
  updateJob,
} = require("../controllers/jobController");
const { authMiddleware, optionalAuthMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createJob);
router.get("/", optionalAuthMiddleware, getAllJobs);
router.post("/createjobpost", authMiddleware, createJob); // Create a job posting
router.get("/alljobs", optionalAuthMiddleware, getAllJobs); // Get all job postings
router.get("/getjob/:id", optionalAuthMiddleware, getJobById); // Get a single job posting
router.put("/updatejob/:id", authMiddleware, updateJob); // Update a job posting
router.delete("/deletejob/:id", authMiddleware, deleteJob); // Delete a job posting
router.put("/:id/save", authMiddleware, toggleSavedJob);
router.put("/:id/interest", authMiddleware, toggleInterestedJob);
router.get("/:id", optionalAuthMiddleware, getJobById);
router.put("/:id", authMiddleware, updateJob);
router.delete("/:id", authMiddleware, deleteJob);

module.exports = router;

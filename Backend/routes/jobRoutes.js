const express = require("express");
const { createJob, getAllJobs, getJobById, updateJob, deleteJob } = require("../controllers/jobController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createJob);
router.get("/", getAllJobs);
router.post("/createjobpost", authMiddleware, createJob); // Create a job posting
router.get("/alljobs", getAllJobs); // Get all job postings
router.get("/getjob/:id", getJobById); // Get a single job posting
router.put("/updatejob/:id", authMiddleware, updateJob); // Update a job posting
router.delete("/deletejob/:id", authMiddleware, deleteJob); // Delete a job posting
router.get("/:id", getJobById);
router.put("/:id", authMiddleware, updateJob);
router.delete("/:id", authMiddleware, deleteJob);

module.exports = router;

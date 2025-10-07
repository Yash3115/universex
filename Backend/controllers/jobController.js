const Job = require("../models/jobSchema");

// Create a new job posting
exports.createJob = async (req, res) => {
    try {
        const { title, companyName, description, lastDateToApply, registrationLink, importantInstructions } = req.body;

        if (!title || !companyName || !description || !lastDateToApply || !registrationLink) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        const job = new Job({
            title,
            companyName,
            description,
            lastDateToApply,
            registrationLink,
            importantInstructions,
            postedBy: req.user._id,
        });

        await job.save();
        res.status(201).json({ message: "Job posted successfully", job });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all job postings
exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find().populate("postedBy", "firstName lastName email");
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get a single job posting by ID
exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate("postedBy", "firstName lastName email");

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.status(200).json(job);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Update a job posting
exports.updateJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Ensure only the job poster can update the job
        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to update this job posting" });
        }

        // Update only the fields provided in req.body
        Object.keys(req.body).forEach((key) => {
            job[key] = req.body[key];
        });

        await job.save();
        res.status(200).json({ message: "Job updated successfully", job });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// Delete a job posting
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this job posting" });
        }

        await Job.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Job deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

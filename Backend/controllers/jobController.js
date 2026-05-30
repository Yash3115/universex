const Job = require("../models/jobSchema");
const User = require("../models/userSchema");
const { createNotification } = require("../utils/notificationService");

const ALLOWED_UPDATE_FIELDS = [
  "title",
  "companyName",
  "description",
  "opportunityType",
  "jobType",
  "location",
  "stipend",
  "eligibility",
  "skills",
  "status",
  "lastDateToApply",
  "registrationLink",
  "importantInstructions",
];

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => String(skill).trim()).filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
};

const sanitizeJobPayload = (payload, { partial = false } = {}) => {
  const sanitized = {};
  const requiredFields = ["title", "companyName", "description", "lastDateToApply", "registrationLink"];

  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (payload[field] !== undefined) {
      sanitized[field] = typeof payload[field] === "string" ? payload[field].trim() : payload[field];
    }
  }

  if (!partial) {
    for (const field of requiredFields) {
      if (!sanitized[field]) {
        return { error: "Title, company, description, deadline, and registration link are required" };
      }
    }
  }

  if (sanitized.registrationLink && !isValidUrl(sanitized.registrationLink)) {
    return { error: "Registration link must be a valid http(s) URL" };
  }

  if (sanitized.lastDateToApply) {
    const deadline = new Date(sanitized.lastDateToApply);
    if (Number.isNaN(deadline.getTime())) {
      return { error: "Last date to apply must be a valid date" };
    }
    sanitized.lastDateToApply = deadline;
  }

  if (payload.skills !== undefined) {
    sanitized.skills = normalizeSkills(payload.skills);
  }

  return { data: sanitized };
};

const canManageJob = (job, user) =>
  user?.role === "Admin" || job.postedBy.toString() === user?._id?.toString();

const populateJob = (query) => query.populate("postedBy", "firstName lastName email image role");

exports.createJob = async (req, res) => {
  try {
    const { data, error } = sanitizeJobPayload(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const job = await Job.create({
      ...data,
      postedBy: req.user._id,
    });

    await job.populate("postedBy", "firstName lastName email image role");

    const usersToNotify = await User.find({ _id: { $ne: req.user._id } }).select("_id").limit(100);
    await Promise.all(
      usersToNotify.map((user) =>
        createNotification({
          recipient: user._id,
          sender: req.user._id,
          job: job._id,
          type: "Job",
          message: `posted a new opportunity: ${job.title}`,
        })
      )
    );

    return res.status(201).json({
      success: true,
      message: "Opportunity posted successfully",
      job,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    const {
      search = "",
      status,
      opportunityType,
      jobType,
      sort = "deadline",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status && status !== "all") filter.status = status;
    if (opportunityType && opportunityType !== "all") filter.opportunityType = opportunityType;
    if (jobType && jobType !== "all") filter.jobType = jobType;
    if (search.trim()) filter.$text = { $search: search.trim() };

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const sortBy = sort === "newest" ? { createdAt: -1 } : { lastDateToApply: 1, createdAt: -1 };

    const jobs = await populateJob(
      Job.find(filter)
        .sort(sortBy)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
    );
    const totalJobs = await Job.countDocuments(filter);

    return res.status(200).json({
      success: true,
      jobs,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalJobs / pageSize),
        totalJobs,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await populateJob(Job.findById(req.params.id));

    if (!job) {
      return res.status(404).json({ success: false, message: "Opportunity not found" });
    }

    return res.status(200).json({ success: true, job });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Opportunity not found" });
    }

    if (!canManageJob(job, req.user)) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this opportunity" });
    }

    const { data, error } = sanitizeJobPayload(req.body, { partial: true });
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    Object.assign(job, data);
    await job.save();
    await job.populate("postedBy", "firstName lastName email image role");

    return res.status(200).json({
      success: true,
      message: "Opportunity updated successfully",
      job,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Opportunity not found" });
    }

    if (!canManageJob(job, req.user)) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this opportunity" });
    }

    await job.deleteOne();
    return res.status(200).json({ success: true, message: "Opportunity deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

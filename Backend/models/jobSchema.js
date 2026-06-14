const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        companyName: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        opportunityType: {
            type: String,
            enum: ["Internship", "Full-time", "Part-time", "Freelance", "Hackathon", "Scholarship", "Other"],
            default: "Internship",
        },
        jobType: {
            type: String,
            enum: ["On-site", "Remote", "Hybrid"],
            default: "On-site",
        },
        location: {
            type: String,
            trim: true,
            default: "",
        },
        stipend: {
            type: String,
            trim: true,
            default: "",
        },
        eligibility: {
            type: String,
            trim: true,
            default: "",
        },
        skills: [{ type: String, trim: true }],
        status: {
            type: String,
            enum: ["open", "closed"],
            default: "open",
        },
        lastDateToApply: {
            type: Date,
            required: true,
        },
        registrationLink: {
            type: String,
            required: true,
            trim: true,
        },
        importantInstructions: {
            type: String,
            trim: true,
            default: "",
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        interestedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

jobSchema.index({ title: "text", companyName: "text", description: "text", skills: "text" });
jobSchema.index({ status: 1, lastDateToApply: 1, opportunityType: 1 });

module.exports = mongoose.model("Job", jobSchema);

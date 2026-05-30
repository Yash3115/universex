import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";

const INITIAL_FORM = {
  title: "",
  companyName: "",
  opportunityType: "Internship",
  jobType: "On-site",
  location: "",
  stipend: "",
  eligibility: "",
  skills: "",
  status: "open",
  lastDateToApply: "",
  registrationLink: "",
  description: "",
  importantInstructions: "",
};

const toInputDate = (date) => {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
};

const JobFormModal = ({ initialJob, onClose, onSubmit, submitting }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialJob) {
      setFormData({
        title: initialJob.title || "",
        companyName: initialJob.companyName || "",
        opportunityType: initialJob.opportunityType || "Internship",
        jobType: initialJob.jobType || "On-site",
        location: initialJob.location || "",
        stipend: initialJob.stipend || "",
        eligibility: initialJob.eligibility || "",
        skills: initialJob.skills?.join(", ") || "",
        status: initialJob.status || "open",
        lastDateToApply: toInputDate(initialJob.lastDateToApply),
        registrationLink: initialJob.registrationLink || "",
        description: initialJob.description || "",
        importantInstructions: initialJob.importantInstructions || "",
      });
    }
  }, [initialJob]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title || !formData.companyName || !formData.description || !formData.lastDateToApply || !formData.registrationLink) {
      setError("Title, company, description, deadline, and application link are required.");
      return;
    }

    await onSubmit({
      ...formData,
      skills: formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <form onSubmit={handleSubmit} className="max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-white/95 p-4 backdrop-blur sm:p-5">
          <div>
            <h2 className="text-xl font-black text-gray-900 sm:text-2xl">
              {initialJob ? "Edit opportunity" : "Post a new opportunity"}
            </h2>
            <p className="text-sm text-gray-500">Share internships, jobs, hackathons, scholarships, or campus opportunities.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-circle" onClick={onClose} disabled={submitting}>
            <IoClose size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2">
          {error && <p className="md:col-span-2 text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <label className="form-control">
            <span className="label-text">Title *</span>
            <input name="title" value={formData.title} onChange={handleChange} className="input input-bordered rounded-2xl" placeholder="Frontend Intern" />
          </label>

          <label className="form-control">
            <span className="label-text">Company / Organizer *</span>
            <input name="companyName" value={formData.companyName} onChange={handleChange} className="input input-bordered rounded-2xl" placeholder="Acme Corp" />
          </label>

          <label className="form-control">
            <span className="label-text">Opportunity type</span>
            <select name="opportunityType" value={formData.opportunityType} onChange={handleChange} className="select select-bordered rounded-2xl">
              <option>Internship</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Freelance</option>
              <option>Hackathon</option>
              <option>Scholarship</option>
              <option>Other</option>
            </select>
          </label>

          <label className="form-control">
            <span className="label-text">Work mode</span>
            <select name="jobType" value={formData.jobType} onChange={handleChange} className="select select-bordered rounded-2xl">
              <option>On-site</option>
              <option>Remote</option>
              <option>Hybrid</option>
            </select>
          </label>

          <label className="form-control">
            <span className="label-text">Location</span>
            <input name="location" value={formData.location} onChange={handleChange} className="input input-bordered rounded-2xl" placeholder="Delhi / Remote" />
          </label>

          <label className="form-control">
            <span className="label-text">Stipend / CTC</span>
            <input name="stipend" value={formData.stipend} onChange={handleChange} className="input input-bordered rounded-2xl" placeholder="₹25,000/month" />
          </label>

          <label className="form-control">
            <span className="label-text">Deadline *</span>
            <input type="date" name="lastDateToApply" value={formData.lastDateToApply} onChange={handleChange} className="input input-bordered rounded-2xl" />
          </label>

          <label className="form-control">
            <span className="label-text">Application link *</span>
            <input type="url" name="registrationLink" value={formData.registrationLink} onChange={handleChange} className="input input-bordered rounded-2xl" placeholder="https://..." />
          </label>

          <label className="form-control md:col-span-2">
            <span className="label-text">Skills (comma separated)</span>
            <input name="skills" value={formData.skills} onChange={handleChange} className="input input-bordered rounded-2xl" placeholder="React, Node.js, MongoDB" />
          </label>

          <label className="form-control md:col-span-2">
            <span className="label-text">Description *</span>
            <textarea name="description" value={formData.description} onChange={handleChange} className="textarea textarea-bordered min-h-28 rounded-2xl" placeholder="Describe role, responsibilities, selection process..." />
          </label>

          <label className="form-control md:col-span-2">
            <span className="label-text">Eligibility</span>
            <textarea name="eligibility" value={formData.eligibility} onChange={handleChange} className="textarea textarea-bordered rounded-2xl" placeholder="Branches, year, CGPA, prerequisites..." />
          </label>

          <label className="form-control md:col-span-2">
            <span className="label-text">Important instructions</span>
            <textarea name="importantInstructions" value={formData.importantInstructions} onChange={handleChange} className="textarea textarea-bordered rounded-2xl" placeholder="Documents needed, test date, referral notes..." />
          </label>

          {initialJob && (
            <label className="form-control">
              <span className="label-text">Status</span>
              <select name="status" value={formData.status} onChange={handleChange} className="select select-bordered rounded-2xl">
                <option value="open">open</option>
                <option value="closed">closed</option>
              </select>
            </label>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white/95 p-4 backdrop-blur">
          <button type="button" className="btn btn-ghost rounded-2xl" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="btn btn-primary rounded-2xl" disabled={submitting}>
            {submitting ? "Saving..." : initialJob ? "Save changes" : "Post opportunity"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobFormModal;
import { FaBriefcase, FaCalendarAlt, FaCheckCircle, FaExternalLinkAlt, FaMapMarkerAlt, FaRegBookmark, FaTrash } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";

const formatDate = (date) => {
  if (!date) return "No deadline";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const isExpired = (date) => date && new Date(date).getTime() < Date.now();

const JobCard = ({ job, canManage, canTrack, onEdit, onDelete, onToggleInterest, onToggleSave }) => {
  const deadlineExpired = isExpired(job.lastDateToApply);
  const statusLabel = deadlineExpired || job.status === "closed" ? "Closed" : "Open";

  return (
    <article className="overflow-hidden rounded-3xl border border-white bg-white shadow-xl shadow-slate-200/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusLabel === "Open" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
              {statusLabel}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {job.opportunityType || "Opportunity"}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              {job.jobType || "On-site"}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black text-gray-900 sm:text-2xl">{job.title}</h2>
            <p className="text-gray-600 font-medium">{job.companyName}</p>
          </div>

          <p className="line-clamp-4 whitespace-pre-line text-sm leading-6 text-gray-700 sm:text-base">{job.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-blue-500" />
              <span>Apply by {formatDate(job.lastDateToApply)}</span>
            </div>
            {job.location && (
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-500" />
                <span>{job.location}</span>
              </div>
            )}
            {job.stipend && (
              <div className="flex items-center gap-2">
                <FaBriefcase className="text-green-600" />
                <span>{job.stipend}</span>
              </div>
            )}
          </div>

          {job.eligibility && (
            <div className="rounded-2xl bg-gray-50 p-3">
              <h3 className="text-sm font-semibold text-gray-800">Eligibility</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{job.eligibility}</p>
            </div>
          )}

          {job.importantInstructions && (
            <div className="rounded-2xl bg-yellow-50 p-3">
              <h3 className="text-sm font-semibold text-yellow-800">Important instructions</h3>
              <p className="text-sm text-yellow-800 whitespace-pre-line">{job.importantInstructions}</p>
            </div>
          )}

          {job.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span key={skill} className="px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                  #{skill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:min-w-44 lg:flex-col">
          {canTrack && (
            <>
              <button className={`btn rounded-2xl ${job.isSaved ? "btn-success" : "btn-outline"}`} type="button" onClick={() => onToggleSave(job._id)}>
                <FaRegBookmark /> {job.isSaved ? "Saved" : "Save"}
              </button>
              <button className={`btn rounded-2xl ${job.isInterested ? "btn-info" : "btn-outline"}`} type="button" onClick={() => onToggleInterest(job._id)}>
                <FaCheckCircle /> {job.isInterested ? "Interested" : "Interest"}
              </button>
            </>
          )}
          <a
            href={job.registrationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary rounded-2xl"
          >
            Apply <FaExternalLinkAlt />
          </a>
          {canManage && (
            <>
              <button className="btn btn-outline rounded-2xl" onClick={() => onEdit(job)}>
                <FiEdit /> Edit
              </button>
              <button className="btn btn-error rounded-2xl" onClick={() => onDelete(job._id)}>
                <FaTrash /> Delete
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default JobCard;

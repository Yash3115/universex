import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import JobCard from "../components/JobCard";
import JobFormModal from "../components/JobFormModal";
import {
  createJob,
  deleteJob,
  fetchJobs,
  resetJobFilters,
  setJobFilters,
  updateJob,
} from "../features/jobs/jobsSlice";

const JobsPage = () => {
  const dispatch = useDispatch();
  const { jobs, status, error, filters, pagination } = useSelector((state) => state.jobs);
  const user = useSelector((state) => state.auth.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchJobs(filters));
  }, [dispatch, filters]);

  const openJobsCount = useMemo(
    () => jobs.filter((job) => job.status === "open" && new Date(job.lastDateToApply).getTime() >= Date.now()).length,
    [jobs]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    dispatch(setJobFilters({ [name]: value }));
  };

  const handleOpenCreate = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      if (editingJob) {
        await dispatch(updateJob({ jobId: editingJob._id, jobData: payload })).unwrap();
        toast.success("Opportunity updated successfully");
      } else {
        await dispatch(createJob(payload)).unwrap();
        toast.success("Opportunity posted successfully");
      }
      setIsModalOpen(false);
      setEditingJob(null);
    } catch (submitError) {
      toast.error(submitError || "Unable to save opportunity");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Delete this opportunity? This cannot be undone.")) return;

    try {
      await dispatch(deleteJob(jobId)).unwrap();
      toast.success("Opportunity deleted successfully");
    } catch (deleteError) {
      toast.error(deleteError || "Unable to delete opportunity");
    }
  };

  const canManage = (job) =>
    user?.role === "Admin" || String(job.postedBy?._id) === String(user?._id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-6 text-white shadow-2xl shadow-blue-200 md:p-8">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-100 backdrop-blur">Campus career hub</p>
              <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">Jobs & Opportunities</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                Discover internships, placements, hackathons, scholarships, and freelance opportunities shared by your campus network.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-64">
              <div className="rounded-3xl border border-white/10 bg-white/15 px-4 py-4 text-center backdrop-blur">
                <p className="text-2xl font-bold">{pagination.totalJobs}</p>
                <p className="text-xs text-blue-100">Total listed</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/15 px-4 py-4 text-center backdrop-blur">
                <p className="text-2xl font-bold">{openJobsCount}</p>
                <p className="text-xs text-blue-100">Open now</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white bg-white/90 p-4 shadow-xl shadow-slate-200/70 backdrop-blur md:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="input input-bordered rounded-2xl bg-gray-50 md:col-span-2"
              placeholder="Search title, company, skills..."
            />
            <select name="opportunityType" value={filters.opportunityType} onChange={handleFilterChange} className="select select-bordered rounded-2xl bg-gray-50">
              <option value="all">All types</option>
              <option>Internship</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Freelance</option>
              <option>Hackathon</option>
              <option>Scholarship</option>
              <option>Other</option>
            </select>
            <select name="jobType" value={filters.jobType} onChange={handleFilterChange} className="select select-bordered rounded-2xl bg-gray-50">
              <option value="all">All modes</option>
              <option>On-site</option>
              <option>Remote</option>
              <option>Hybrid</option>
            </select>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="select select-bordered rounded-2xl bg-gray-50">
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">All status</option>
            </select>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row">
            <select name="sort" value={filters.sort} onChange={handleFilterChange} className="select select-bordered w-full rounded-2xl bg-gray-50 sm:w-48">
              <option value="deadline">Deadline first</option>
              <option value="newest">Newest first</option>
            </select>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button className="btn btn-ghost rounded-2xl" onClick={() => dispatch(resetJobFilters())}>Reset</button>
              <button className="btn btn-primary rounded-2xl" onClick={handleOpenCreate}>+ Post opportunity</button>
            </div>
          </div>
        </div>

        {status === "loading" && <p className="rounded-3xl bg-white p-8 text-center font-semibold text-gray-500 shadow">Loading opportunities...</p>}
        {status === "failed" && <p className="rounded-3xl bg-red-50 p-8 text-center font-semibold text-red-600 shadow">{error}</p>}

        {status !== "loading" && jobs.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-xl shadow-slate-200/70">
            <h2 className="text-2xl font-black text-gray-800">No opportunities found</h2>
            <p className="text-gray-500 mt-2">Try changing filters or post the first opportunity for your campus.</p>
          </div>
        )}

        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              canManage={canManage(job)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </section>

      {isModalOpen && (
        <JobFormModal
          initialJob={editingJob}
          onClose={() => {
            setIsModalOpen(false);
            setEditingJob(null);
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default JobsPage;
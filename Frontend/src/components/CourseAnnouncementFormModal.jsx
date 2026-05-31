import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createCourseAnnouncement } from "../features/courseAnnouncements/courseAnnouncementsSlice";

const CourseAnnouncementFormModal = ({ courseId, onClose }) => {
  const dispatch = useDispatch();
  const createStatus = useSelector((state) => state.courseAnnouncements.createStatus);
  const [form, setForm] = useState({ title: "", body: "", priority: "normal", visibility: "enrolled", pinned: false, expiresAt: "" });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      await dispatch(createCourseAnnouncement({ courseId, payload: form })).unwrap();
      toast.success("Announcement posted");
      onClose();
    } catch (error) {
      toast.error(error || "Unable to post announcement");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-purple-600">Course announcement</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Post announcement</h2>
          </div>
          <button type="button" className="btn btn-sm rounded-xl" onClick={onClose}>✕</button>
        </div>
        <input className="input input-bordered mt-6 w-full rounded-2xl" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Announcement title" required maxLength={140} />
        <textarea className="textarea textarea-bordered mt-4 min-h-36 w-full rounded-2xl" value={form.body} onChange={(e) => update("body", e.target.value)} placeholder="Announcement details" required maxLength={3000} />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <select className="select select-bordered rounded-2xl" value={form.priority} onChange={(e) => update("priority", e.target.value)}>
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
          <select className="select select-bordered rounded-2xl" value={form.visibility} onChange={(e) => update("visibility", e.target.value)}>
            <option value="enrolled">Enrolled only</option>
            <option value="college">College visible</option>
            <option value="public">Public</option>
          </select>
          <input className="input input-bordered rounded-2xl" type="datetime-local" value={form.expiresAt} onChange={(e) => update("expiresAt", e.target.value)} />
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-600">
          <input className="checkbox" type="checkbox" checked={form.pinned} onChange={(e) => update("pinned", e.target.checked)} /> Pin this announcement
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn rounded-2xl" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary rounded-2xl" disabled={createStatus === "loading"}>{createStatus === "loading" ? "Posting..." : "Post"}</button>
        </div>
      </form>
    </div>
  );
};

export default CourseAnnouncementFormModal;
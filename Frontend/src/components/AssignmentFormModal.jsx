import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createAssignment } from "../features/assignments/assignmentsSlice";

const AssignmentFormModal = ({ courseId, onClose }) => {
  const dispatch = useDispatch();
  const createStatus = useSelector((state) => state.assignments.createStatus);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", totalMarks: 100, status: "published", visibility: "enrolled", allowLateSubmission: true });
  const [file, setFile] = useState(null);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (file) formData.append("assignmentFile", file);
    try {
      await dispatch(createAssignment({ courseId, formData })).unwrap();
      toast.success("Assignment created");
      onClose();
    } catch (error) {
      toast.error(error || "Unable to create assignment");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-wide text-emerald-600">Assignment</p><h2 className="text-2xl font-black text-gray-900">Create assignment</h2></div><button type="button" className="btn btn-sm" onClick={onClose}>✕</button></div>
        <input className="input input-bordered mt-6 w-full rounded-2xl" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Assignment title" required />
        <textarea className="textarea textarea-bordered mt-4 min-h-32 w-full rounded-2xl" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Instructions" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <input className="input input-bordered rounded-2xl" type="datetime-local" value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
          <input className="input input-bordered rounded-2xl" type="number" value={form.totalMarks} onChange={(e) => update("totalMarks", e.target.value)} placeholder="Total marks" />
          <select className="select select-bordered rounded-2xl" value={form.status} onChange={(e) => update("status", e.target.value)}><option value="published">Published</option><option value="draft">Draft</option><option value="closed">Closed</option></select>
          <select className="select select-bordered rounded-2xl" value={form.visibility} onChange={(e) => update("visibility", e.target.value)}><option value="enrolled">Enrolled only</option><option value="college">College</option><option value="public">Public</option></select>
          <input className="file-input file-input-bordered rounded-2xl md:col-span-2" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <label className="mt-4 flex gap-2 text-sm font-semibold"><input className="checkbox" type="checkbox" checked={form.allowLateSubmission} onChange={(e) => update("allowLateSubmission", e.target.checked)} /> Allow late submissions</label>
        <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={createStatus === "loading"}>{createStatus === "loading" ? "Creating..." : "Create"}</button></div>
      </form>
    </div>
  );
};

export default AssignmentFormModal;
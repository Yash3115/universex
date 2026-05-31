import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createAssessment } from "../features/results/resultsSlice";

const AssessmentFormModal = ({ courseId, onClose }) => {
  const dispatch = useDispatch();
  const actionStatus = useSelector((state) => state.results.actionStatus);
  const [form, setForm] = useState({ title: "", type: "Quiz", maxMarks: 100, weightage: 0, description: "", status: "draft", visibleFrom: "" });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      await dispatch(createAssessment({ courseId, payload: form })).unwrap();
      toast.success("Assessment created");
      onClose();
    } catch (error) {
      toast.error(error || "Unable to create assessment");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onSubmit={submit}>
        <div className="flex justify-between"><div><p className="text-sm font-black uppercase tracking-wide text-purple-600">Results</p><h2 className="text-2xl font-black">Create assessment</h2></div><button type="button" className="btn btn-sm" onClick={onClose}>✕</button></div>
        <input className="input input-bordered mt-6 w-full rounded-2xl" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Assessment title" required />
        <textarea className="textarea textarea-bordered mt-4 w-full rounded-2xl" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Description" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <select className="select select-bordered rounded-2xl" value={form.type} onChange={(e) => update("type", e.target.value)}>{["Quiz", "MidSem", "EndSem", "Assignment", "Lab", "Internal", "Other"].map((type) => <option key={type}>{type}</option>)}</select>
          <input className="input input-bordered rounded-2xl" type="number" value={form.maxMarks} onChange={(e) => update("maxMarks", e.target.value)} placeholder="Max marks" />
          <input className="input input-bordered rounded-2xl" type="number" value={form.weightage} onChange={(e) => update("weightage", e.target.value)} placeholder="Weightage" />
          <select className="select select-bordered rounded-2xl" value={form.status} onChange={(e) => update("status", e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
          <input className="input input-bordered rounded-2xl md:col-span-2" type="datetime-local" value={form.visibleFrom} onChange={(e) => update("visibleFrom", e.target.value)} />
        </div>
        <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={actionStatus === "loading"}>{actionStatus === "loading" ? "Creating..." : "Create"}</button></div>
      </form>
    </div>
  );
};

export default AssessmentFormModal;
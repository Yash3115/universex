import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createCourseQuestion } from "../features/courseQA/courseQASlice";

const CourseQuestionFormModal = ({ courseId, onClose }) => {
  const dispatch = useDispatch();
  const createStatus = useSelector((state) => state.courseQA.createStatus);
  const [form, setForm] = useState({ title: "", body: "", tags: "", visibility: "course" });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      await dispatch(createCourseQuestion({ courseId, payload: form })).unwrap();
      toast.success("Question posted");
      onClose();
    } catch (error) {
      toast.error(error || "Unable to post question");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onSubmit={submit}>
        <div className="flex justify-between"><div><p className="text-sm font-black uppercase tracking-wide text-cyan-600">Course Q&A</p><h2 className="text-2xl font-black">Ask a doubt</h2></div><button type="button" className="btn btn-sm" onClick={onClose}>✕</button></div>
        <input className="input input-bordered mt-6 w-full rounded-2xl" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Question title" required />
        <textarea className="textarea textarea-bordered mt-4 min-h-36 w-full rounded-2xl" value={form.body} onChange={(e) => update("body", e.target.value)} placeholder="Explain your doubt" required />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input className="input input-bordered rounded-2xl" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="Tags, comma separated" />
          <select className="select select-bordered rounded-2xl" value={form.visibility} onChange={(e) => update("visibility", e.target.value)}>
            <option value="course">Visible to course</option>
            <option value="anonymous">Anonymous to classmates</option>
            <option value="private">Private to professor</option>
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={createStatus === "loading"}>{createStatus === "loading" ? "Posting..." : "Post question"}</button></div>
      </form>
    </div>
  );
};

export default CourseQuestionFormModal;
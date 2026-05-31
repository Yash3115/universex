import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createCourse } from "../features/courses/coursesSlice";

const CourseFormModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const actionStatus = useSelector((state) => state.courses.actionStatus);
  const [form, setForm] = useState({
    title: "",
    code: "",
    description: "",
    department: "",
    semester: "",
    academicYear: "",
    section: "",
    enrollmentPolicy: "open",
  });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      await dispatch(createCourse(form)).unwrap();
      toast.success("Course created");
      onClose();
    } catch (error) {
      toast.error(error || "Unable to create course");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-indigo-600">Professor tools</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Create course</h2>
          </div>
          <button type="button" className="btn btn-sm rounded-xl" onClick={onClose}>✕</button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="input input-bordered rounded-2xl" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Course title" required />
          <input className="input input-bordered rounded-2xl" value={form.code} onChange={(e) => update("code", e.target.value)} placeholder="Course code" required />
          <input className="input input-bordered rounded-2xl" value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="Department" />
          <input className="input input-bordered rounded-2xl" value={form.semester} onChange={(e) => update("semester", e.target.value)} placeholder="Semester" />
          <input className="input input-bordered rounded-2xl" value={form.academicYear} onChange={(e) => update("academicYear", e.target.value)} placeholder="Academic year" />
          <input className="input input-bordered rounded-2xl" value={form.section} onChange={(e) => update("section", e.target.value)} placeholder="Section" />
          <select className="select select-bordered rounded-2xl md:col-span-2" value={form.enrollmentPolicy} onChange={(e) => update("enrollmentPolicy", e.target.value)}>
            <option value="open">Open enrollment</option>
            <option value="approval">Professor approval required</option>
            <option value="inviteOnly">Invite code required</option>
          </select>
        </div>
        <textarea className="textarea textarea-bordered mt-4 min-h-28 w-full rounded-2xl" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Course description" />
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn rounded-2xl" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary rounded-2xl" disabled={actionStatus === "loading"}>{actionStatus === "loading" ? "Creating..." : "Create course"}</button>
        </div>
      </form>
    </div>
  );
};

export default CourseFormModal;
import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { createAttendanceSession } from "../features/courseAttendance/courseAttendanceSlice";

const AttendanceSessionFormModal = ({ courseId, onClose }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ title: "", topic: "", date: new Date().toISOString().slice(0, 10), startTime: "", endTime: "", location: "", notes: "" });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    try {
      await dispatch(createAttendanceSession({ courseId, payload: form })).unwrap();
      toast.success("Attendance session created");
      onClose();
    } catch (error) {
      toast.error(error || "Unable to create session");
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"><form className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onSubmit={submit}><div className="flex justify-between"><h2 className="text-2xl font-black">Create attendance session</h2><button type="button" className="btn btn-sm" onClick={onClose}>✕</button></div><div className="mt-6 grid gap-4 md:grid-cols-2"><input className="input input-bordered rounded-2xl" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Session title" required /><input className="input input-bordered rounded-2xl" value={form.topic} onChange={(e) => update("topic", e.target.value)} placeholder="Topic" /><input className="input input-bordered rounded-2xl" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} /><input className="input input-bordered rounded-2xl" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Location" /><input className="input input-bordered rounded-2xl" type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} /><input className="input input-bordered rounded-2xl" type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} /></div><textarea className="textarea textarea-bordered mt-4 w-full rounded-2xl" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Notes" /><div className="mt-6 flex justify-end gap-3"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary">Create</button></div></form></div>;
};

export default AttendanceSessionFormModal;
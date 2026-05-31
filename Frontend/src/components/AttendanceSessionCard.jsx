import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchAttendanceRecords, markAttendanceRecords, updateAttendanceSession } from "../features/courseAttendance/courseAttendanceSlice";

const AttendanceSessionCard = ({ course, isInstructor, session }) => {
  const dispatch = useDispatch();
  const records = useSelector((state) => state.courseAttendance.recordsBySessionId[session._id] || []);
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState({});
  const roster = course?.enrollments?.filter((item) => item.status === "enrolled") || [];
  const recordMap = new Map(records.map((record) => [String(record.student?._id || record.student), record]));
  const load = () => { setOpen((current) => !current); dispatch(fetchAttendanceRecords(session._id)); };
  const save = async () => {
    const payload = roster.map((item) => {
      const studentId = item.student?._id || item.student;
      const existing = recordMap.get(String(studentId));
      const draft = drafts[studentId] || {};
      return { studentId, status: draft.status || existing?.status || "present", note: draft.note || existing?.note || "" };
    });
    try { await dispatch(markAttendanceRecords({ sessionId: session._id, records: payload })).unwrap(); toast.success("Attendance saved"); } catch (e) { toast.error(e || "Unable to save attendance"); }
  };
  const cancel = () => dispatch(updateAttendanceSession({ courseId: course._id, sessionId: session._id, payload: { status: "cancelled" } }));
  return <article className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70"><div className="flex justify-between gap-3"><div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{session.status}</span><h3 className="mt-3 text-xl font-black">{session.title}</h3><p className="text-sm text-gray-500">{new Date(session.date).toLocaleDateString()} {session.startTime && `· ${session.startTime}`}</p><p className="text-sm text-gray-600">{session.topic}</p></div></div>{isInstructor ? <div className="mt-4 flex gap-2"><button className="btn btn-primary btn-sm" onClick={load}>Roster</button>{session.status !== "cancelled" && <button className="btn btn-sm" onClick={cancel}>Cancel</button>}</div> : null}{open && <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-3">{roster.map((item) => { const student = item.student; const studentId = student?._id || student; const existing = recordMap.get(String(studentId)); return <div key={studentId} className="grid gap-2 rounded-2xl bg-white p-3 md:grid-cols-[1fr_140px_1fr]"><p className="font-bold text-gray-900">{student?.firstName} {student?.lastName}</p><select className="select select-bordered select-sm" defaultValue={existing?.status || "present"} onChange={(e) => setDrafts((c) => ({ ...c, [studentId]: { ...(c[studentId] || {}), status: e.target.value } }))}><option value="present">present</option><option value="absent">absent</option><option value="late">late</option><option value="excused">excused</option></select><input className="input input-bordered input-sm" placeholder="Note" defaultValue={existing?.note || ""} onChange={(e) => setDrafts((c) => ({ ...c, [studentId]: { ...(c[studentId] || {}), note: e.target.value } }))} /></div>; })}<button className="btn btn-primary btn-sm" onClick={save}>Save attendance</button></div>}</article>;
};

export default AttendanceSessionCard;
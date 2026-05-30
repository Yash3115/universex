import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  createAcademicTask,
  deleteAcademicTask,
  fetchAcademicOverview,
  markAttendance,
  saveRoutine,
  updateAcademicTask,
} from "../features/academic/academicSlice";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2"];

const emptyRoutineEntry = {
  subject: "",
  day: "Monday",
  startTime: "",
  endTime: "",
  location: "",
  instructor: "",
  color: "#2563eb",
};

const AcademicPlannerPage = () => {
  const dispatch = useDispatch();
  const { routine, attendanceStats, tasks, status, error } = useSelector((state) => state.academic);
  const [routineDraft, setRoutineDraft] = useState([]);
  const [attendanceForm, setAttendanceForm] = useState({ subject: "", date: new Date().toISOString().slice(0, 10), status: "Attended", note: "" });
  const [taskForm, setTaskForm] = useState({ title: "", subject: "", dueDate: "", priority: "medium", description: "" });

  useEffect(() => {
    dispatch(fetchAcademicOverview());
  }, [dispatch]);

  useEffect(() => {
    setRoutineDraft(routine.length ? routine : [{ ...emptyRoutineEntry }]);
  }, [routine]);

  const subjects = useMemo(() => {
    const values = new Set(routineDraft.map((entry) => entry.subject).filter(Boolean));
    attendanceStats.forEach((stat) => values.add(stat.subject));
    return Array.from(values);
  }, [routineDraft, attendanceStats]);

  const todayClasses = useMemo(() => {
    const today = DAYS[(new Date().getDay() + 6) % 7];
    return routine.filter((entry) => entry.day === today);
  }, [routine]);

  const updateRoutineEntry = (index, field, value) => {
    setRoutineDraft((prev) => prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  };

  const addRoutineEntry = () => {
    setRoutineDraft((prev) => [...prev, { ...emptyRoutineEntry, color: COLORS[prev.length % COLORS.length] }]);
  };

  const removeRoutineEntry = (index) => {
    setRoutineDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRoutine = async () => {
    try {
      await dispatch(saveRoutine(routineDraft)).unwrap();
      toast.success("Routine saved successfully");
    } catch (saveError) {
      toast.error(saveError || "Unable to save routine");
    }
  };

  const handleAttendanceSubmit = async (event) => {
    event.preventDefault();
    try {
      await dispatch(markAttendance(attendanceForm)).unwrap();
      toast.success("Attendance saved");
      setAttendanceForm((prev) => ({ ...prev, note: "" }));
    } catch (attendanceError) {
      toast.error(attendanceError || "Unable to save attendance");
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    try {
      await dispatch(createAcademicTask(taskForm)).unwrap();
      toast.success("Task created");
      setTaskForm({ title: "", subject: "", dueDate: "", priority: "medium", description: "" });
    } catch (taskError) {
      toast.error(taskError || "Unable to create task");
    }
  };

  const markTaskDone = (task) => {
    dispatch(updateAcademicTask({ taskId: task._id, payload: { status: task.status === "done" ? "todo" : "done" } }));
  };

  const removeTask = (taskId) => {
    dispatch(deleteAcademicTask(taskId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-indigo-700 to-blue-700 p-6 text-white shadow-2xl shadow-blue-200">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-100">Academic planner</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Routine, attendance, and deadlines</h1>
          <p className="mt-3 max-w-2xl text-blue-100">Turn your class schedule into actionable attendance insights and task planning.</p>
        </section>

        {status === "failed" && <p className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</p>}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Weekly routine</h2>
                <p className="text-sm text-gray-500">Add classes, labs, and study blocks.</p>
              </div>
              <button className="btn btn-primary rounded-2xl" onClick={addRoutineEntry}>+ Add class</button>
            </div>

            <div className="mt-5 space-y-3">
              {routineDraft.map((entry, index) => (
                <div key={entry._id || index} className="grid grid-cols-1 gap-3 rounded-2xl bg-gray-50 p-3 md:grid-cols-6">
                  <input className="input input-bordered rounded-xl md:col-span-2" placeholder="Subject" value={entry.subject} onChange={(e) => updateRoutineEntry(index, "subject", e.target.value)} />
                  <select className="select select-bordered rounded-xl" value={entry.day} onChange={(e) => updateRoutineEntry(index, "day", e.target.value)}>
                    {DAYS.map((day) => <option key={day}>{day}</option>)}
                  </select>
                  <input className="input input-bordered rounded-xl" type="time" value={entry.startTime} onChange={(e) => updateRoutineEntry(index, "startTime", e.target.value)} />
                  <input className="input input-bordered rounded-xl" type="time" value={entry.endTime} onChange={(e) => updateRoutineEntry(index, "endTime", e.target.value)} />
                  <button className="btn btn-error rounded-xl" onClick={() => removeRoutineEntry(index)}>Remove</button>
                  <input className="input input-bordered rounded-xl md:col-span-2" placeholder="Location" value={entry.location} onChange={(e) => updateRoutineEntry(index, "location", e.target.value)} />
                  <input className="input input-bordered rounded-xl md:col-span-2" placeholder="Instructor" value={entry.instructor} onChange={(e) => updateRoutineEntry(index, "instructor", e.target.value)} />
                  <input className="input input-bordered rounded-xl" type="color" value={entry.color} onChange={(e) => updateRoutineEntry(index, "color", e.target.value)} />
                </div>
              ))}
            </div>
            <button className="btn btn-success mt-5 rounded-2xl" onClick={handleSaveRoutine}>Save routine</button>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
            <h2 className="text-2xl font-black text-gray-900">Today</h2>
            <div className="mt-4 space-y-3">
              {todayClasses.length ? todayClasses.map((entry) => (
                <div key={entry._id} className="rounded-2xl border-l-4 bg-gray-50 p-3" style={{ borderColor: entry.color }}>
                  <p className="font-bold text-gray-900">{entry.subject}</p>
                  <p className="text-sm text-gray-500">{entry.startTime || "--"} - {entry.endTime || "--"}</p>
                  {entry.location && <p className="text-sm text-gray-500">{entry.location}</p>}
                </div>
              )) : <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">No classes scheduled today.</p>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <form onSubmit={handleAttendanceSubmit} className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
            <h2 className="text-2xl font-black text-gray-900">Mark attendance</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select className="select select-bordered rounded-2xl" value={attendanceForm.subject} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, subject: e.target.value }))}>
                <option value="">Select subject</option>
                {subjects.map((subject) => <option key={subject}>{subject}</option>)}
              </select>
              <input className="input input-bordered rounded-2xl" type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, date: e.target.value }))} />
              <select className="select select-bordered rounded-2xl" value={attendanceForm.status} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, status: e.target.value }))}>
                <option>Attended</option>
                <option>Missed</option>
                <option>Cancelled</option>
              </select>
              <input className="input input-bordered rounded-2xl" placeholder="Note" value={attendanceForm.note} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, note: e.target.value }))} />
            </div>
            <button className="btn btn-primary mt-4 rounded-2xl" type="submit">Save attendance</button>
          </form>

          <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
            <h2 className="text-2xl font-black text-gray-900">Attendance insights</h2>
            <div className="mt-4 space-y-3">
              {attendanceStats.length ? attendanceStats.map((stat) => (
                <div key={stat.subject}>
                  <div className="flex justify-between text-sm font-semibold text-gray-700"><span>{stat.subject}</span><span>{stat.percentage}%</span></div>
                  <progress className={`progress w-full ${stat.percentage >= 75 ? "progress-success" : "progress-warning"}`} value={stat.percentage} max="100" />
                  <p className="text-xs text-gray-500">{stat.attended}/{stat.total} attended · {stat.missed} missed</p>
                </div>
              )) : <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">No attendance records yet.</p>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[420px_1fr]">
          <form onSubmit={handleCreateTask} className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
            <h2 className="text-2xl font-black text-gray-900">New task</h2>
            <input className="input input-bordered mt-4 w-full rounded-2xl" placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} />
            <input className="input input-bordered mt-3 w-full rounded-2xl" placeholder="Subject" value={taskForm.subject} onChange={(e) => setTaskForm((prev) => ({ ...prev, subject: e.target.value }))} />
            <input className="input input-bordered mt-3 w-full rounded-2xl" type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
            <select className="select select-bordered mt-3 w-full rounded-2xl" value={taskForm.priority} onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <textarea className="textarea textarea-bordered mt-3 w-full rounded-2xl" placeholder="Description" value={taskForm.description} onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))} />
            <button className="btn btn-primary mt-4 rounded-2xl" type="submit">Create task</button>
          </form>

          <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
            <h2 className="text-2xl font-black text-gray-900">Task board</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {["todo", "in-progress", "done"].map((statusName) => (
                <div key={statusName} className="rounded-2xl bg-gray-50 p-3">
                  <h3 className="mb-3 font-bold capitalize text-gray-700">{statusName.replace("-", " ")}</h3>
                  <div className="space-y-2">
                    {tasks.filter((task) => task.status === statusName).map((task) => (
                      <div key={task._id} className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="font-bold text-gray-900">{task.title}</p>
                        {task.subject && <p className="text-xs text-gray-500">{task.subject}</p>}
                        {task.dueDate && <p className="text-xs text-gray-500">Due {new Date(task.dueDate).toLocaleDateString()}</p>}
                        <div className="mt-3 flex gap-2">
                          <button type="button" className="btn btn-xs btn-outline" onClick={() => markTaskDone(task)}>{task.status === "done" ? "Reopen" : "Done"}</button>
                          <button type="button" className="btn btn-xs btn-error" onClick={() => removeTask(task._id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AcademicPlannerPage;
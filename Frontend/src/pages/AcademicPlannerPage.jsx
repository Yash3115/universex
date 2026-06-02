import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createAcademicTask,
  deleteAcademicTask,
  fetchAcademicOverview,
  markAttendance,
  saveRoutine,
  updateAcademicTask,
} from "../features/academic/academicSlice";
import { fetchCourseAssignments } from "../features/assignments/assignmentsSlice";
import { fetchCourseMaterials } from "../features/courseMaterials/courseMaterialsSlice";
import { fetchMyCourses } from "../features/courses/coursesSlice";
import { fetchMyResults } from "../features/results/resultsSlice";

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

const priorityTone = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-emerald-50 text-emerald-700",
};

const statusLabels = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};

const formatDate = (date) => {
  if (!date) return "No due date";
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};

const AcademicPlannerPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { attendanceStats, error, routine, status, tasks } = useSelector((state) => state.academic);
  const { myCourses } = useSelector((state) => state.courses);
  const materialsByCourseId = useSelector((state) => state.courseMaterials.itemsByCourseId);
  const assignmentsByCourseId = useSelector((state) => state.assignments.assignmentsByCourseId);
  const { myResults } = useSelector((state) => state.results);
  const [routineDraft, setRoutineDraft] = useState([]);
  const [attendanceForm, setAttendanceForm] = useState({ subject: "", date: new Date().toISOString().slice(0, 10), status: "Attended", note: "" });
  const [taskForm, setTaskForm] = useState({ title: "", subject: "", dueDate: "", priority: "medium", description: "" });
  const [activePanel, setActivePanel] = useState("tasks");

  useEffect(() => {
    dispatch(fetchAcademicOverview());
    dispatch(fetchMyCourses());
    dispatch(fetchMyResults());
  }, [dispatch]);

  useEffect(() => {
    myCourses.forEach((course) => {
      dispatch(fetchCourseMaterials({ courseId: course._id, filters: {} }));
      dispatch(fetchCourseAssignments(course._id));
    });
  }, [dispatch, myCourses]);

  useEffect(() => {
    setRoutineDraft(routine.length ? routine : [{ ...emptyRoutineEntry }]);
  }, [routine]);

  const subjects = useMemo(() => {
    const values = new Set(routineDraft.map((entry) => entry.subject).filter(Boolean));
    attendanceStats.forEach((stat) => values.add(stat.subject));
    tasks.forEach((task) => task.subject && values.add(task.subject));
    return Array.from(values);
  }, [attendanceStats, routineDraft, tasks]);

  const todayClasses = useMemo(() => {
    const today = DAYS[(new Date().getDay() + 6) % 7];
    return routine.filter((entry) => entry.day === today).sort((first, second) => String(first.startTime).localeCompare(String(second.startTime)));
  }, [routine]);

  const upcomingTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => task.status !== "done")
        .sort((first, second) => new Date(first.dueDate || "2999-12-31") - new Date(second.dueDate || "2999-12-31"))
        .slice(0, 5),
    [tasks]
  );

  const materialList = useMemo(
    () =>
      Object.entries(materialsByCourseId).flatMap(([courseId, materials]) => {
        const course = myCourses.find((item) => item._id === courseId);
        return (materials || []).map((material) => ({ ...material, course }));
      }),
    [materialsByCourseId, myCourses]
  );

  const assignmentList = useMemo(
    () =>
      Object.entries(assignmentsByCourseId).flatMap(([courseId, assignments]) => {
        const course = myCourses.find((item) => item._id === courseId);
        return (assignments || []).map((assignment) => ({ ...assignment, course }));
      }),
    [assignmentsByCourseId, myCourses]
  );

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
      toast.success("Schedule saved");
    } catch (saveError) {
      toast.error(saveError || "Unable to save schedule");
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
      setActivePanel("tasks");
    } catch (taskError) {
      toast.error(taskError || "Unable to create task");
    }
  };

  const changeTaskStatus = (task, nextStatus) => {
    dispatch(updateAcademicTask({ taskId: task._id, payload: { status: nextStatus } }));
  };

  const removeTask = (taskId) => {
    dispatch(deleteAcademicTask(taskId));
  };

  const taskCounts = {
    todo: tasks.filter((task) => task.status === "todo").length,
    "in-progress": tasks.filter((task) => task.status === "in-progress").length,
    done: tasks.filter((task) => task.status === "done").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-blue-600">Student workspace</p>
              <h1 className="mt-1 text-3xl font-black text-gray-900">Tasks, schedule, and resources</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">Keep your routine, deadlines, attendance, course materials, and published results in one place.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center sm:min-w-80">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-2xl font-black text-gray-900">{taskCounts.todo}</p>
                <p className="text-xs font-bold text-gray-500">To do</p>
              </div>
              <div className="rounded-xl bg-blue-50 px-4 py-3">
                <p className="text-2xl font-black text-blue-700">{taskCounts["in-progress"]}</p>
                <p className="text-xs font-bold text-blue-700">Active</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-3">
                <p className="text-2xl font-black text-emerald-700">{taskCounts.done}</p>
                <p className="text-xs font-bold text-emerald-700">Done</p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { key: "tasks", label: "Task management" },
              { key: "schedule", label: "Schedule" },
              { key: "resources", label: "Course resources" },
              { key: "attendance", label: "Attendance" },
            ].map((item) => (
              <button
                key={item.key}
                className={`btn btn-sm rounded-2xl ${activePanel === item.key ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setActivePanel(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {status === "failed" && <p className="rounded-2xl bg-red-50 p-4 text-red-600">{error}</p>}

        {activePanel === "tasks" && (
          <section className="grid gap-5 lg:grid-cols-[22rem_1fr]">
            <form onSubmit={handleCreateTask} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-black text-gray-900">New task</h2>
              <input className="input input-bordered mt-4 w-full rounded-xl" placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} />
              <select className="select select-bordered mt-3 w-full rounded-xl" value={taskForm.subject} onChange={(e) => setTaskForm((prev) => ({ ...prev, subject: e.target.value }))}>
                <option value="">No subject</option>
                {subjects.map((subject) => <option key={subject}>{subject}</option>)}
              </select>
              <input className="input input-bordered mt-3 w-full rounded-xl" type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
              <select className="select select-bordered mt-3 w-full rounded-xl" value={taskForm.priority} onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))}>
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
              <textarea className="textarea textarea-bordered mt-3 w-full rounded-xl" placeholder="Description" value={taskForm.description} onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))} />
              <button className="btn btn-primary mt-4 w-full rounded-xl" type="submit">Create task</button>
            </form>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
                <h2 className="text-xl font-black text-gray-900">Upcoming</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {upcomingTasks.map((task) => (
                    <article key={task._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="font-black text-gray-900">{task.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{task.subject || "General"} - {formatDate(task.dueDate)}</p>
                      <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${priorityTone[task.priority] || priorityTone.medium}`}>{task.priority}</span>
                    </article>
                  ))}
                  {upcomingTasks.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-gray-500 md:col-span-2">No active deadlines.</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {["todo", "in-progress", "done"].map((statusName) => (
                  <section key={statusName} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
                    <h3 className="font-black text-gray-900">{statusLabels[statusName]}</h3>
                    <div className="mt-4 space-y-3">
                      {tasks.filter((task) => task.status === statusName).map((task) => (
                        <article key={task._id} className="rounded-xl bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black text-gray-900">{task.title}</p>
                              <p className="mt-1 text-xs text-gray-500">{task.subject || "General"} - {formatDate(task.dueDate)}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${priorityTone[task.priority] || priorityTone.medium}`}>{task.priority}</span>
                          </div>
                          {task.description && <p className="mt-3 text-sm text-gray-600">{task.description}</p>}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {task.status === "todo" && <button type="button" className="btn btn-xs btn-primary" onClick={() => changeTaskStatus(task, "in-progress")}>Start</button>}
                            {task.status !== "done" && <button type="button" className="btn btn-xs" onClick={() => changeTaskStatus(task, "done")}>Done</button>}
                            {task.status === "done" && <button type="button" className="btn btn-xs" onClick={() => changeTaskStatus(task, "todo")}>Reopen</button>}
                            <button type="button" className="btn btn-xs btn-error" onClick={() => removeTask(task._id)}>Delete</button>
                          </div>
                        </article>
                      ))}
                      {tasks.filter((task) => task.status === statusName).length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-gray-500">Empty.</p>}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </section>
        )}

        {activePanel === "schedule" && (
          <section className="grid gap-5 lg:grid-cols-[1fr_22rem]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Weekly schedule</h2>
                  <p className="text-sm text-gray-500">Save classes, labs, study blocks, and professor sessions.</p>
                </div>
                <button className="btn btn-primary rounded-xl" onClick={addRoutineEntry}>Add class</button>
              </div>
              <div className="mt-5 space-y-3">
                {routineDraft.map((entry, index) => (
                  <div key={entry._id || index} className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 md:grid-cols-6">
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
              <button className="btn btn-success mt-5 rounded-xl" onClick={handleSaveRoutine}>Save schedule</button>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-black text-gray-900">Today</h2>
              <div className="mt-4 space-y-3">
                {todayClasses.length ? todayClasses.map((entry) => (
                  <article key={entry._id} className="rounded-xl border-l-4 bg-slate-50 p-4" style={{ borderColor: entry.color }}>
                    <p className="font-black text-gray-900">{entry.subject}</p>
                    <p className="text-sm text-gray-500">{entry.startTime || "--"} - {entry.endTime || "--"}</p>
                    {entry.location && <p className="text-sm text-gray-500">{entry.location}</p>}
                    {entry.instructor && <p className="text-sm text-gray-500">{entry.instructor}</p>}
                  </article>
                )) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-gray-500">No classes scheduled today.</p>}
              </div>
            </aside>
          </section>
        )}

        {activePanel === "resources" && (
          <section className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-gray-900">Courses</h2>
                <button className="btn btn-sm rounded-xl" onClick={() => navigate("/courses")}>Open</button>
              </div>
              <div className="mt-4 space-y-3">
                {myCourses.map((course) => (
                  <button key={course._id} className="w-full rounded-xl bg-slate-50 p-4 text-left hover:bg-blue-50" onClick={() => navigate(`/courses/${course._id}`)}>
                    <p className="font-black text-gray-900">{course.code}</p>
                    <p className="text-sm text-gray-500">{course.title}</p>
                  </button>
                ))}
                {myCourses.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-gray-500">No enrolled courses yet.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-black text-gray-900">Professor materials</h2>
              <div className="mt-4 space-y-3">
                {materialList.slice(0, 8).map((material) => (
                  <a key={material._id} className="block rounded-xl bg-slate-50 p-4 hover:bg-blue-50" href={material.file?.url || material.externalUrl || "#"} target="_blank" rel="noreferrer">
                    <p className="font-black text-gray-900">{material.title}</p>
                    <p className="text-sm text-gray-500">{material.course?.code || "Course"} - {material.type}</p>
                  </a>
                ))}
                {materialList.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-gray-500">No materials available yet.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-gray-900">Results</h2>
                <button className="btn btn-sm rounded-xl" onClick={() => navigate("/results")}>Open</button>
              </div>
              <div className="mt-4 space-y-3">
                {myResults.slice(0, 6).map((result) => (
                  <article key={result._id} className="rounded-xl bg-slate-50 p-4">
                    <p className="font-black text-gray-900">{result.assessment?.title}</p>
                    <p className="text-sm text-gray-500">{result.course?.code} - {result.marks}/{result.assessment?.maxMarks || "--"} {result.grade || ""}</p>
                  </article>
                ))}
                {myResults.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-gray-500">No published results yet.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 lg:col-span-3">
              <h2 className="text-xl font-black text-gray-900">Assignments</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {assignmentList.slice(0, 8).map((assignment) => (
                  <button key={assignment._id} className="rounded-xl bg-slate-50 p-4 text-left hover:bg-blue-50" onClick={() => navigate(`/courses/${assignment.course?._id}`)}>
                    <p className="font-black text-gray-900">{assignment.title}</p>
                    <p className="text-sm text-gray-500">{assignment.course?.code || "Course"} - Due {formatDate(assignment.dueDate)}</p>
                  </button>
                ))}
                {assignmentList.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-gray-500">No assignments published yet.</p>}
              </div>
            </div>
          </section>
        )}

        {activePanel === "attendance" && (
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <form onSubmit={handleAttendanceSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-black text-gray-900">Personal attendance</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select className="select select-bordered rounded-xl" value={attendanceForm.subject} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, subject: e.target.value }))}>
                  <option value="">Select subject</option>
                  {subjects.map((subject) => <option key={subject}>{subject}</option>)}
                </select>
                <input className="input input-bordered rounded-xl" type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, date: e.target.value }))} />
                <select className="select select-bordered rounded-xl" value={attendanceForm.status} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, status: e.target.value }))}>
                  <option>Attended</option>
                  <option>Missed</option>
                  <option>Cancelled</option>
                </select>
                <input className="input input-bordered rounded-xl" placeholder="Note" value={attendanceForm.note} onChange={(e) => setAttendanceForm((prev) => ({ ...prev, note: e.target.value }))} />
              </div>
              <button className="btn btn-primary mt-4 rounded-xl" type="submit">Save attendance</button>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-black text-gray-900">Attendance insights</h2>
              <div className="mt-4 space-y-3">
                {attendanceStats.length ? attendanceStats.map((stat) => (
                  <div key={stat.subject}>
                    <div className="flex justify-between text-sm font-semibold text-gray-700"><span>{stat.subject}</span><span>{stat.percentage}%</span></div>
                    <progress className={`progress w-full ${stat.percentage >= 75 ? "progress-success" : "progress-warning"}`} value={stat.percentage} max="100" />
                    <p className="text-xs text-gray-500">{stat.attended}/{stat.total} attended - {stat.missed} missed</p>
                  </div>
                )) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-gray-500">No attendance records yet.</p>}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AcademicPlannerPage;

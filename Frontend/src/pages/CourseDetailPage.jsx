import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AssignmentCard from "../components/AssignmentCard";
import AssignmentFormModal from "../components/AssignmentFormModal";
import AssessmentCard from "../components/AssessmentCard";
import AssessmentFormModal from "../components/AssessmentFormModal";
import AttendanceSessionCard from "../components/AttendanceSessionCard";
import AttendanceSessionFormModal from "../components/AttendanceSessionFormModal";
import OfficeHourBookingPanel from "../components/OfficeHourBookingPanel";
import OfficeHourSlotCard from "../components/OfficeHourSlotCard";
import OfficeHourSlotFormModal from "../components/OfficeHourSlotFormModal";
import CourseQuestionCard from "../components/CourseQuestionCard";
import CourseQuestionFormModal from "../components/CourseQuestionFormModal";
import CourseAnnouncementCard from "../components/CourseAnnouncementCard";
import CourseAnnouncementFormModal from "../components/CourseAnnouncementFormModal";
import CourseMaterialCard from "../components/CourseMaterialCard";
import CourseMaterialUploadModal from "../components/CourseMaterialUploadModal";
import { fetchCourseAnnouncements, setAnnouncementFilters } from "../features/courseAnnouncements/courseAnnouncementsSlice";
import { fetchCourseMaterials, setMaterialFilters } from "../features/courseMaterials/courseMaterialsSlice";
import { clearSelectedCourse, fetchCourseById, updateEnrollment } from "../features/courses/coursesSlice";
import { fetchCourseAssignments } from "../features/assignments/assignmentsSlice";
import { fetchCourseAssessments } from "../features/results/resultsSlice";
import { fetchCourseQuestions, setQuestionFilters } from "../features/courseQA/courseQASlice";
import { fetchCourseAttendance } from "../features/courseAttendance/courseAttendanceSlice";
import { fetchCourseOfficeHourSlots, fetchProfessorOfficeHourBookings } from "../features/officeHours/officeHoursSlice";
import { getImageUrl } from "../utils/imageUtils";

const CourseDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showOfficeHourForm, setShowOfficeHourForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showMaterialUpload, setShowMaterialUpload] = useState(false);
  const { error, selectedCourse, selectedStatus, viewerContext } = useSelector((state) => state.courses);
  const officeHoursState = useSelector((state) => state.officeHours);
  const attendanceState = useSelector((state) => state.courseAttendance);
  const qaState = useSelector((state) => state.courseQA);
  const resultsState = useSelector((state) => state.results);
  const assignmentState = useSelector((state) => state.assignments);
  const announcementState = useSelector((state) => state.courseAnnouncements);
  const materialState = useSelector((state) => state.courseMaterials);
  const officeHourSlots = officeHoursState.slotsByCourseId[id] || [];
  const officeHourBookings = officeHoursState.professorBookings || [];
  const officeHourCourseBookings = officeHourBookings.filter((booking) => String(booking.course?._id || booking.course) === String(id));
  const attendanceSessions = attendanceState.sessionsByCourseId[id] || [];
  const attendanceStatus = attendanceState.statusByCourseId[id] || "idle";
  const attendanceViewerContext = attendanceState.viewerContextByCourseId[id] || {};
  const myAttendanceStats = attendanceState.myStatsByCourseId[id] || {};
  const myAttendanceRecords = attendanceState.myRecordsByCourseId[id] || [];
  const questions = qaState.questionsByCourseId[id] || [];
  const questionStatus = qaState.statusByCourseId[id] || "idle";
  const questionFilters = qaState.filtersByCourseId[id] || { search: "", status: "" };
  const questionViewerContext = qaState.viewerContextByCourseId[id] || {};
  const assessments = resultsState.assessmentsByCourseId[id] || [];
  const assessmentStatus = resultsState.statusByCourseId[id] || "idle";
  const assessmentViewerContext = resultsState.viewerContextByCourseId[id] || {};
  const assignments = assignmentState.assignmentsByCourseId[id] || [];
  const assignmentStatus = assignmentState.statusByCourseId[id] || "idle";
  const assignmentViewerContext = assignmentState.viewerContextByCourseId[id] || {};
  const announcements = announcementState.itemsByCourseId[id] || [];
  const announcementStatus = announcementState.statusByCourseId[id] || "idle";
  const announcementFilters = announcementState.filtersByCourseId[id] || { search: "", priority: "" };
  const announcementViewerContext = announcementState.viewerContextByCourseId[id] || {};
  const materials = materialState.itemsByCourseId[id] || [];
  const materialStatus = materialState.statusByCourseId[id] || "idle";
  const materialFilters = materialState.filtersByCourseId[id] || { search: "", type: "" };
  const materialViewerContext = materialState.viewerContextByCourseId[id] || {};

  useEffect(() => {
    if (id) dispatch(fetchCourseById(id));
    return () => dispatch(clearSelectedCourse());
  }, [dispatch, id]);

  useEffect(() => {
    if (id) dispatch(fetchCourseMaterials({ courseId: id, filters: materialFilters }));
  }, [dispatch, id, materialFilters.search, materialFilters.type]);

  useEffect(() => {
    if (id) dispatch(fetchCourseAnnouncements({ courseId: id, filters: announcementFilters }));
  }, [dispatch, id, announcementFilters.search, announcementFilters.priority]);

  useEffect(() => {
    if (id) dispatch(fetchCourseAssignments(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (id) dispatch(fetchCourseAssessments(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (id) dispatch(fetchCourseQuestions({ courseId: id, filters: questionFilters }));
  }, [dispatch, id, questionFilters.search, questionFilters.status]);

  useEffect(() => {
    if (id) dispatch(fetchCourseAttendance(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (id) dispatch(fetchCourseOfficeHourSlots(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (viewerContext?.isInstructor) dispatch(fetchProfessorOfficeHourBookings());
  }, [dispatch, viewerContext?.isInstructor]);

  const updateStudent = async (studentId, status) => {
    try {
      await dispatch(updateEnrollment({ courseId: id, studentId, status })).unwrap();
      toast.success("Enrollment updated");
    } catch (updateError) {
      toast.error(updateError || "Unable to update enrollment");
    }
  };

  if (selectedStatus === "loading") return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8"><p className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow">Loading course...</p></div>;
  if (selectedStatus === "failed") return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8"><p className="rounded-3xl bg-red-50 p-8 text-center text-red-600 shadow">{error}</p></div>;
  if (!selectedCourse) return null;

  const enrolled = selectedCourse.enrollments?.filter((item) => item.status === "enrolled") || [];
  const requested = selectedCourse.enrollments?.filter((item) => item.status === "requested") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-200/70">
          <button className="mb-5 text-sm font-bold text-blue-600 hover:underline" onClick={() => navigate(-1)}>← Back</button>
          <p className="text-sm font-black uppercase tracking-wide text-blue-600">{selectedCourse.code}</p>
          <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-5xl">{selectedCourse.title}</h1>
          <p className="mt-3 max-w-3xl text-gray-600">{selectedCourse.description || "No description added yet."}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-700">{selectedCourse.department || "Department not set"}</span>
            <span className="rounded-full bg-purple-50 px-3 py-1 font-bold text-purple-700">{selectedCourse.academicYear}</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">{viewerContext?.isInstructor ? "Instructor" : viewerContext?.enrollmentStatus}</span>
            {viewerContext?.isInstructor && <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">Join code: {selectedCourse.joinCode}</span>}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <main className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Announcements</h2>
                  <p className="text-sm text-gray-500">Official course updates, schedule changes, and urgent notices.</p>
                </div>
                {announcementViewerContext.isInstructor && <button className="btn btn-primary rounded-2xl" onClick={() => setShowAnnouncementForm(true)}>+ New announcement</button>}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input className="input input-bordered rounded-2xl" value={announcementFilters.search || ""} onChange={(e) => dispatch(setAnnouncementFilters({ courseId: id, filters: { search: e.target.value } }))} placeholder="Search announcements" />
                <select className="select select-bordered rounded-2xl" value={announcementFilters.priority || ""} onChange={(e) => dispatch(setAnnouncementFilters({ courseId: id, filters: { priority: e.target.value } }))}>
                  <option value="">All priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="important">Important</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
              {announcementStatus === "loading" && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">Loading announcements...</p>}
              <div className="mt-5 space-y-4">
                {announcements.map((announcement) => (
                  <CourseAnnouncementCard key={announcement._id} courseId={id} isInstructor={announcementViewerContext.isInstructor} announcement={announcement} />
                ))}
              </div>
              {announcementStatus === "succeeded" && announcements.length === 0 && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">No announcements yet.</p>}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Q&A / Doubts</h2>
                  <p className="text-sm text-gray-500">Ask course doubts, answer peers, and find official professor responses.</p>
                </div>
                <button className="btn btn-primary rounded-2xl" onClick={() => setShowQuestionForm(true)}>+ Ask question</button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input className="input input-bordered rounded-2xl" value={questionFilters.search || ""} onChange={(e) => dispatch(setQuestionFilters({ courseId: id, filters: { search: e.target.value } }))} placeholder="Search questions" />
                <select className="select select-bordered rounded-2xl" value={questionFilters.status || ""} onChange={(e) => dispatch(setQuestionFilters({ courseId: id, filters: { status: e.target.value } }))}>
                  <option value="">All statuses</option>
                  <option value="open">Open</option>
                  <option value="answered">Answered</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              {questionStatus === "loading" && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">Loading questions...</p>}
              <div className="mt-5 space-y-4">
                {questions.map((question) => <CourseQuestionCard key={question._id} courseId={id} isInstructor={questionViewerContext.isInstructor} question={question} />)}
              </div>
              {questionStatus === "succeeded" && questions.length === 0 && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">No questions yet. Ask the first doubt for this course.</p>}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Materials</h2>
                  <p className="text-sm text-gray-500">Lecture notes, slides, references, and course links.</p>
                </div>
                {materialViewerContext.isInstructor && <button className="btn btn-primary rounded-2xl" onClick={() => setShowMaterialUpload(true)}>+ Upload material</button>}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input className="input input-bordered rounded-2xl" value={materialFilters.search || ""} onChange={(e) => dispatch(setMaterialFilters({ courseId: id, filters: { search: e.target.value } }))} placeholder="Search materials" />
                <select className="select select-bordered rounded-2xl" value={materialFilters.type || ""} onChange={(e) => dispatch(setMaterialFilters({ courseId: id, filters: { type: e.target.value } }))}>
                  <option value="">All types</option>
                  <option value="lecture">lecture</option>
                  <option value="notes">notes</option>
                  <option value="reference">reference</option>
                  <option value="lab">lab</option>
                  <option value="syllabus">syllabus</option>
                  <option value="assignment-brief">assignment brief</option>
                  <option value="recording">recording</option>
                  <option value="link">link</option>
                  <option value="other">other</option>
                </select>
              </div>
              {materialStatus === "loading" && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">Loading materials...</p>}
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {materials.map((material) => (
                  <CourseMaterialCard key={material._id} courseId={id} isInstructor={materialViewerContext.isInstructor} material={material} />
                ))}
              </div>
              {materialStatus === "succeeded" && materials.length === 0 && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">No materials uploaded yet.</p>}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Assignments</h2>
                  <p className="text-sm text-gray-500">Coursework, submissions, grading, and professor feedback.</p>
                </div>
                {assignmentViewerContext.isInstructor && <button className="btn btn-primary rounded-2xl" onClick={() => setShowAssignmentForm(true)}>+ Create assignment</button>}
              </div>
              {assignmentStatus === "loading" && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">Loading assignments...</p>}
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {assignments.map((assignment) => (
                  <AssignmentCard key={assignment._id} assignment={assignment} courseId={id} isInstructor={assignmentViewerContext.isInstructor} />
                ))}
              </div>
              {assignmentStatus === "succeeded" && assignments.length === 0 && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">No assignments published yet.</p>}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Results / Gradebook</h2>
                  <p className="text-sm text-gray-500">Assessments, marks, private feedback, and published results.</p>
                </div>
                {assessmentViewerContext.isInstructor ? (
                  <button className="btn btn-primary rounded-2xl" onClick={() => setShowAssessmentForm(true)}>+ Create assessment</button>
                ) : (
                  <button className="btn rounded-2xl" onClick={() => navigate("/results")}>My Results</button>
                )}
              </div>
              {assessmentStatus === "loading" && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">Loading assessments...</p>}
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {assessments.map((assessment) => (
                  <AssessmentCard key={assessment._id} assessment={assessment} course={selectedCourse} isInstructor={assessmentViewerContext.isInstructor} />
                ))}
              </div>
              {assessmentStatus === "succeeded" && assessments.length === 0 && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">No assessments created yet.</p>}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Official Attendance</h2>
                  <p className="text-sm text-gray-500">Professor-marked attendance sessions and student records.</p>
                </div>
                {attendanceViewerContext.isInstructor && <button className="btn btn-primary rounded-2xl" onClick={() => setShowAttendanceForm(true)}>+ Create session</button>}
              </div>
              {!attendanceViewerContext.isInstructor && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700"><p className="text-2xl font-black">{myAttendanceStats.percentage || 0}%</p><p className="text-sm font-bold">Attendance</p></div>
                  <div className="rounded-2xl bg-blue-50 p-4 text-blue-700"><p className="text-2xl font-black">{myAttendanceStats.present || 0}</p><p className="text-sm font-bold">Present/Late</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-slate-700"><p className="text-2xl font-black">{myAttendanceStats.total || 0}</p><p className="text-sm font-bold">Counted sessions</p></div>
                </div>
              )}
              {attendanceStatus === "loading" && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">Loading attendance...</p>}
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {attendanceSessions.map((session) => <AttendanceSessionCard key={session._id} course={selectedCourse} isInstructor={attendanceViewerContext.isInstructor} session={session} />)}
              </div>
              {!attendanceViewerContext.isInstructor && myAttendanceRecords.length > 0 && (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <h3 className="font-black text-gray-900">My records</h3>
                  <div className="mt-3 space-y-2">
                    {myAttendanceRecords.slice(0, 5).map((record) => <p key={record._id} className="text-sm text-gray-600">{record.session?.title || "Session"}: <span className="font-bold capitalize">{record.status}</span></p>)}
                  </div>
                </div>
              )}
              {attendanceStatus === "succeeded" && attendanceSessions.length === 0 && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">No official attendance sessions yet.</p>}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Office Hours</h2>
                  <p className="text-sm text-gray-500">Book professor guidance slots for doubts, results, projects, and mentoring.</p>
                </div>
                {viewerContext?.isInstructor ? <button className="btn btn-primary rounded-2xl" onClick={() => setShowOfficeHourForm(true)}>+ Create slot</button> : <button className="btn rounded-2xl" onClick={() => navigate("/office-hours")}>My bookings</button>}
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {officeHourSlots.map((slot) => <OfficeHourSlotCard key={slot._id} courseId={id} isProfessor={viewerContext?.isInstructor} slot={slot} />)}
              </div>
              {officeHourSlots.length === 0 && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">No office-hour slots available yet.</p>}
              {viewerContext?.isInstructor && <div className="mt-5 rounded-2xl bg-slate-50 p-4"><h3 className="font-black text-gray-900">Booking requests</h3><div className="mt-3"><OfficeHourBookingPanel bookings={officeHourCourseBookings} professorView /></div></div>}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <h2 className="text-2xl font-black text-gray-900">Roster</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {enrolled.map((item) => (
                  <div key={item.student?._id || item.student} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <img src={getImageUrl(item.student?.image, "https://cdn-icons-png.flaticon.com/512/6596/6596121.png")} alt="Student" className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-gray-900">{item.student?.firstName} {item.student?.lastName}</p>
                      <p className="text-xs text-gray-500">{item.student?.email}</p>
                    </div>
                  </div>
                ))}
              </div>
              {enrolled.length === 0 && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">No enrolled students yet.</p>}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <h2 className="text-2xl font-black text-gray-900">Coming next</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-blue-50 p-4 text-blue-700"><p className="font-black">Office hour reminders</p><p className="text-sm">Automatic alerts before meetings.</p></div>
                <div className="rounded-2xl bg-purple-50 p-4 text-purple-700"><p className="font-black">Announcement read receipts</p><p className="text-sm">Track who has seen updates.</p></div>
                <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700"><p className="font-black">Result analytics</p><p className="text-sm">Charts, averages, and exports.</p></div>
              </div>
            </div>
          </main>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-black text-gray-900">Professor</h2>
              <p className="mt-3 font-bold text-gray-800">{selectedCourse.professor?.firstName} {selectedCourse.professor?.lastName}</p>
              <p className="text-sm text-gray-500">{selectedCourse.professor?.facultyProfile?.designation}</p>
              <p className="text-sm text-gray-500">{selectedCourse.professor?.facultyProfile?.department}</p>
            </div>
            {viewerContext?.isInstructor && requested.length > 0 && (
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
                <h2 className="text-xl font-black text-gray-900">Enrollment requests</h2>
                <div className="mt-4 space-y-3">
                  {requested.map((item) => (
                    <div key={item.student?._id || item.student} className="rounded-2xl bg-slate-50 p-3">
                      <p className="font-bold text-gray-900">{item.student?.firstName} {item.student?.lastName}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button className="btn btn-xs btn-primary" onClick={() => updateStudent(item.student?._id || item.student, "enrolled")}>Approve</button>
                        <button className="btn btn-xs" onClick={() => updateStudent(item.student?._id || item.student, "rejected")}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>

      {showOfficeHourForm && <OfficeHourSlotFormModal courseId={id} onClose={() => setShowOfficeHourForm(false)} />}
      {showAttendanceForm && <AttendanceSessionFormModal courseId={id} onClose={() => setShowAttendanceForm(false)} />}
      {showQuestionForm && <CourseQuestionFormModal courseId={id} onClose={() => setShowQuestionForm(false)} />}
      {showAssessmentForm && <AssessmentFormModal courseId={id} onClose={() => setShowAssessmentForm(false)} />}
      {showAssignmentForm && <AssignmentFormModal courseId={id} onClose={() => setShowAssignmentForm(false)} />}
      {showAnnouncementForm && <CourseAnnouncementFormModal courseId={id} onClose={() => setShowAnnouncementForm(false)} />}
      {showMaterialUpload && <CourseMaterialUploadModal courseId={id} onClose={() => setShowMaterialUpload(false)} />}
    </div>
  );
};

export default CourseDetailPage;
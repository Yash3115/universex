import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AssignmentCard from "../components/AssignmentCard";
import AssignmentFormModal from "../components/AssignmentFormModal";
import AssessmentCard from "../components/AssessmentCard";
import AssessmentFormModal from "../components/AssessmentFormModal";
import CourseAnnouncementCard from "../components/CourseAnnouncementCard";
import CourseAnnouncementFormModal from "../components/CourseAnnouncementFormModal";
import CourseMaterialCard from "../components/CourseMaterialCard";
import CourseMaterialUploadModal from "../components/CourseMaterialUploadModal";
import { fetchCourseAnnouncements, setAnnouncementFilters } from "../features/courseAnnouncements/courseAnnouncementsSlice";
import { fetchCourseMaterials, setMaterialFilters } from "../features/courseMaterials/courseMaterialsSlice";
import { clearSelectedCourse, fetchCourseById, updateEnrollment } from "../features/courses/coursesSlice";
import { fetchCourseAssignments } from "../features/assignments/assignmentsSlice";
import { fetchCourseAssessments } from "../features/results/resultsSlice";
import { getImageUrl } from "../utils/imageUtils";

const CourseDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showMaterialUpload, setShowMaterialUpload] = useState(false);
  const { error, selectedCourse, selectedStatus, viewerContext } = useSelector((state) => state.courses);
  const resultsState = useSelector((state) => state.results);
  const assignmentState = useSelector((state) => state.assignments);
  const announcementState = useSelector((state) => state.courseAnnouncements);
  const materialState = useSelector((state) => state.courseMaterials);
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
                <div className="rounded-2xl bg-blue-50 p-4 text-blue-700"><p className="font-black">Material comments</p><p className="text-sm">Discuss course resources.</p></div>
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

      {showAssessmentForm && <AssessmentFormModal courseId={id} onClose={() => setShowAssessmentForm(false)} />}
      {showAssignmentForm && <AssignmentFormModal courseId={id} onClose={() => setShowAssignmentForm(false)} />}
      {showAnnouncementForm && <CourseAnnouncementFormModal courseId={id} onClose={() => setShowAnnouncementForm(false)} />}
      {showMaterialUpload && <CourseMaterialUploadModal courseId={id} onClose={() => setShowMaterialUpload(false)} />}
    </div>
  );
};

export default CourseDetailPage;
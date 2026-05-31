import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { clearSelectedCourse, fetchCourseById, updateEnrollment } from "../features/courses/coursesSlice";
import { getImageUrl } from "../utils/imageUtils";

const CourseDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, selectedCourse, selectedStatus, viewerContext } = useSelector((state) => state.courses);

  useEffect(() => {
    if (id) dispatch(fetchCourseById(id));
    return () => dispatch(clearSelectedCourse());
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
                <div className="rounded-2xl bg-blue-50 p-4 text-blue-700"><p className="font-black">Materials</p><p className="text-sm">Upload notes and slides.</p></div>
                <div className="rounded-2xl bg-purple-50 p-4 text-purple-700"><p className="font-black">Announcements</p><p className="text-sm">Notify enrolled students.</p></div>
                <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700"><p className="font-black">Assignments</p><p className="text-sm">Publish and grade work.</p></div>
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
    </div>
  );
};

export default CourseDetailPage;
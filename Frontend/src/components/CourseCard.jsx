import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { joinCourse } from "../features/courses/coursesSlice";

const CourseCard = ({ course, showJoin = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUserId = useSelector((state) => state.auth.user?._id);
  const enrollment = course.enrollments?.find((item) => String(item.student?._id || item.student) === String(currentUserId));
  const isJoined = Boolean(enrollment);

  const handleJoin = async () => {
    const joinCode = course.enrollmentPolicy === "inviteOnly" ? window.prompt("Enter course join code") : "";
    try {
      await dispatch(joinCourse({ courseId: course._id, joinCode })).unwrap();
      toast.success(course.enrollmentPolicy === "approval" ? "Enrollment requested" : "Joined course");
    } catch (error) {
      toast.error(error || "Unable to join course");
    }
  };

  return (
    <article className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-600">{course.code}</p>
          <h2 className="mt-1 text-xl font-black text-gray-900">{course.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{course.department || "Department not set"}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{course.enrollmentPolicy}</span>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">{course.description || "No course description added yet."}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {course.semester && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{course.semester}</span>}
        {course.academicYear && <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">{course.academicYear}</span>}
        {course.section && <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Section {course.section}</span>}
      </div>
      <p className="mt-4 text-sm text-gray-500">Professor: <span className="font-bold text-gray-800">{course.professor?.firstName} {course.professor?.lastName}</span></p>
      <p className="mt-1 text-xs text-gray-400">{course.enrollmentSummary?.enrolled ?? course.enrollments?.filter((item) => item.status === "enrolled").length ?? 0} enrolled</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button className="btn rounded-2xl" onClick={() => navigate(`/courses/${course._id}`)}>Open</button>
        {showJoin && <button className="btn btn-primary rounded-2xl" disabled={isJoined} onClick={handleJoin}>{isJoined ? enrollment.status : "Join"}</button>}
      </div>
    </article>
  );
};

export default CourseCard;

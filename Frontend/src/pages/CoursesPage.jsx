import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CourseCard from "../components/CourseCard";
import CourseFormModal from "../components/CourseFormModal";
import { discoverCourses, fetchMyCourses, setCourseFilters } from "../features/courses/coursesSlice";

const CoursesPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { discoveredCourses, discoverStatus, error, filters, myCourses, status } = useSelector((state) => state.courses);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    dispatch(fetchMyCourses());
  }, [dispatch]);

  useEffect(() => {
    if (user?.role === "Student") dispatch(discoverCourses(filters));
  }, [dispatch, filters, user?.role]);

  const isProfessor = user?.role === "Professor" || user?.role === "Admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-indigo-700 to-blue-700 p-6 text-white shadow-2xl shadow-blue-200">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-100">Courses</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">{isProfessor ? "Manage your courses" : "Join courses from your college"}</h1>
          <p className="mt-3 max-w-2xl text-blue-100">Courses become the official space for lectures, announcements, assignments, and results.</p>
          {isProfessor && <button className="btn mt-5 rounded-2xl border-none bg-white text-blue-700 hover:bg-blue-50" onClick={() => setShowCreate(true)}>+ Create course</button>}
        </section>

        {error && <p className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</p>}

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-gray-900">My courses</h2>
          {status === "loading" && <p className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow">Loading courses...</p>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {myCourses.map((course) => <CourseCard key={course._id} course={course} />)}
          </div>
          {status === "succeeded" && myCourses.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow">No courses yet.</p>}
        </section>

        {user?.role === "Student" && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-4 shadow-xl shadow-slate-200/70">
              <h2 className="mb-4 text-2xl font-black text-gray-900">Discover courses</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <input className="input input-bordered rounded-2xl" value={filters.search} onChange={(e) => dispatch(setCourseFilters({ search: e.target.value }))} placeholder="Search course title/code" />
                <input className="input input-bordered rounded-2xl" value={filters.department} onChange={(e) => dispatch(setCourseFilters({ department: e.target.value }))} placeholder="Department" />
              </div>
            </div>
            {discoverStatus === "loading" && <p className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow">Finding courses...</p>}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {discoveredCourses.map((course) => <CourseCard key={course._id} course={course} showJoin />)}
            </div>
          </section>
        )}
      </div>

      {showCreate && <CourseFormModal onClose={() => setShowCreate(false)} />}
    </div>
  );
};

export default CoursesPage;
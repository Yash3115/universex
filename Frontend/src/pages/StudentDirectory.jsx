import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { requestConnection, searchStudents, setDiscoveryFilters } from "../features/discovery/discoverySlice";

const StudentDirectory = () => {
  const dispatch = useDispatch();
  const { students, status, error, filters } = useSelector((state) => state.discovery);

  useEffect(() => {
    dispatch(searchStudents(filters));
  }, [dispatch, filters]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    dispatch(setDiscoveryFilters({ [name]: value }));
  };

  const connect = async (studentId) => {
    try {
      await dispatch(requestConnection(studentId)).unwrap();
      toast.success("Connection request sent");
    } catch (connectError) {
      toast.error(connectError || "Unable to send request");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-purple-700 to-indigo-700 p-6 text-white shadow-2xl shadow-indigo-200">
          <p className="text-sm font-bold uppercase tracking-wide text-purple-100">Student discovery</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Find students across campus</h1>
          <p className="mt-3 max-w-2xl text-purple-100">Search peers by college, department, year, and profile information.</p>
        </section>

        <section className="grid grid-cols-1 gap-3 rounded-3xl bg-white p-4 shadow-xl md:grid-cols-4">
          <input className="input input-bordered rounded-2xl" name="search" value={filters.search} onChange={handleChange} placeholder="Search students" />
          <input className="input input-bordered rounded-2xl" name="department" value={filters.department} onChange={handleChange} placeholder="Department" />
          <input className="input input-bordered rounded-2xl" name="college" value={filters.college} onChange={handleChange} placeholder="College" />
          <input className="input input-bordered rounded-2xl" name="graduationYear" value={filters.graduationYear} onChange={handleChange} placeholder="Graduation year" />
        </section>

        {status === "loading" && <p className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow">Searching students...</p>}
        {status === "failed" && <p className="rounded-3xl bg-red-50 p-8 text-center text-red-600 shadow">{error}</p>}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {students.map((student) => (
            <article key={student._id} className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
              <div className="flex items-center gap-4">
                <img src={student.image || "https://cdn-icons-png.flaticon.com/512/6596/6596121.png"} alt="Student" className="h-16 w-16 rounded-full object-cover" />
                <div>
                  <h2 className="text-lg font-black text-gray-900">{student.firstName} {student.lastName}</h2>
                  <p className="text-sm text-gray-500">{student.college}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">{student.additionalDetails?.about || "No bio added yet."}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {student.additionalDetails?.department && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{student.additionalDetails.department}</span>}
                {student.additionalDetails?.graduationYear && <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">Batch {student.additionalDetails.graduationYear}</span>}
              </div>
              <button className="btn btn-primary mt-5 w-full rounded-2xl" disabled={student.connectionStatus !== "none"} onClick={() => connect(student._id)}>
                {student.connectionStatus === "none" ? "Connect" : student.connectionStatus}
              </button>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

export default StudentDirectory;
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  requestConnection,
  respondToConnection,
  searchStudents,
  setDiscoveryFilters,
} from "../features/discovery/discoverySlice";
import { getImageUrl } from "../utils/imageUtils";

const getConnectionState = (student) =>
  student.connection || { id: null, status: student.connectionStatus || "none", direction: "none" };

const StudentDirectory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { actionLoadingByStudentId, students, status, error, filters } = useSelector((state) => state.discovery);

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
      toast.success("Connection updated");
    } catch (connectError) {
      toast.error(connectError || "Unable to send request");
    }
  };

  const respond = async (student, nextStatus) => {
    const connection = getConnectionState(student);
    if (!connection.id) return;

    try {
      const result = await dispatch(
        respondToConnection({
          connectionId: connection.id,
          status: nextStatus,
          studentId: student._id,
        })
      ).unwrap();
      toast.success(result.message || "Connection updated");
    } catch (respondError) {
      toast.error(respondError || "Unable to update request");
    }
  };

  const renderConnectionActions = (student) => {
    const connection = getConnectionState(student);
    const isLoading = Boolean(actionLoadingByStudentId[student._id]);

    if (connection.direction === "incoming" && connection.status === "pending") {
      return (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            className="btn btn-primary rounded-2xl"
            disabled={isLoading}
            onClick={() => respond(student, "accepted")}
          >
            {isLoading ? "Accepting..." : "Accept"}
          </button>
          <button
            className="btn rounded-2xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            disabled={isLoading}
            onClick={() => respond(student, "rejected")}
          >
            Ignore
          </button>
        </div>
      );
    }

    if (connection.direction === "connected") {
      return (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center font-bold text-emerald-700">Connected</div>
          <button className="btn rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => navigate(`/students/${student._id}`)}>View profile</button>
        </div>
      );
    }

    if (connection.direction === "outgoing" && connection.status === "pending") {
      return <button className="btn mt-5 w-full rounded-2xl" disabled>Request sent</button>;
    }

    if (connection.direction === "rejected") {
      return <button className="btn mt-5 w-full rounded-2xl" disabled>Request declined</button>;
    }

    return (
      <button className="btn btn-primary mt-5 w-full rounded-2xl" disabled={isLoading} onClick={() => connect(student._id)}>
        {isLoading ? "Sending..." : "Connect"}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-purple-700 to-indigo-700 p-6 text-white shadow-2xl shadow-indigo-200">
          <p className="text-sm font-bold uppercase tracking-wide text-purple-100">Student discovery</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Find students across campus</h1>
          <p className="mt-3 max-w-2xl text-purple-100">Search peers by college, department, year, and profile information.</p>
          <button className="btn mt-5 rounded-2xl border-none bg-white text-purple-700 hover:bg-purple-50" onClick={() => navigate("/connections")}>View your connections</button>
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
                <img src={getImageUrl(student.image, "https://cdn-icons-png.flaticon.com/512/6596/6596121.png")} alt="Student" className="h-16 w-16 rounded-full object-cover" />
                <div>
                  <button className="text-left text-lg font-black text-gray-900 hover:text-blue-700" onClick={() => navigate(`/students/${student._id}`)}>{student.firstName} {student.lastName}</button>
                  <p className="text-sm text-gray-500">{student.college}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">{student.additionalDetails?.about || "No bio added yet."}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {student.additionalDetails?.department && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{student.additionalDetails.department}</span>}
                {student.additionalDetails?.graduationYear && <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">Batch {student.additionalDetails.graduationYear}</span>}
              </div>
              {renderConnectionActions(student)}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

export default StudentDirectory;
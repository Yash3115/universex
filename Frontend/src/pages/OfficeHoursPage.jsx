import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import OfficeHourBookingPanel from "../components/OfficeHourBookingPanel";
import { fetchMyOfficeHourBookings, fetchProfessorOfficeHourBookings } from "../features/officeHours/officeHoursSlice";

const OfficeHoursPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { myBookings, professorBookings } = useSelector((state) => state.officeHours);
  const isProfessor = user?.role === "Professor" || user?.role === "Admin";

  useEffect(() => {
    dispatch(fetchMyOfficeHourBookings());
    if (isProfessor) dispatch(fetchProfessorOfficeHourBookings());
  }, [dispatch, isProfessor]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-cyan-700 to-blue-700 p-6 text-white shadow-2xl shadow-blue-200">
          <p className="text-sm font-bold uppercase tracking-wide text-cyan-100">Office hours</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Meetings, guidance, and mentoring</h1>
          <p className="mt-3 max-w-2xl text-cyan-50">Track your professor office-hour bookings and appointment statuses.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
            <h2 className="text-2xl font-black text-gray-900">My bookings</h2>
            <div className="mt-4"><OfficeHourBookingPanel bookings={myBookings} /></div>
          </div>
          {isProfessor && (
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <h2 className="text-2xl font-black text-gray-900">Professor requests</h2>
              <div className="mt-4"><OfficeHourBookingPanel bookings={professorBookings} professorView /></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OfficeHoursPage;
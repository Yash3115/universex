import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { updateOfficeHourBookingStatus } from "../features/officeHours/officeHoursSlice";

const OfficeHourBookingPanel = ({ bookings = [], professorView = false }) => {
  const dispatch = useDispatch();
  const update = async (bookingId, status) => { try { await dispatch(updateOfficeHourBookingStatus({ bookingId, status })).unwrap(); toast.success("Booking updated"); } catch (e) { toast.error(e || "Unable to update booking"); } };
  return <div className="space-y-3">{bookings.map((booking) => <div key={booking._id} className="rounded-2xl bg-white p-4 shadow-sm"><p className="font-bold text-gray-900">{professorView ? `${booking.student?.firstName} ${booking.student?.lastName}` : booking.slot?.title}</p><p className="text-sm text-gray-500">{booking.reason || "No reason provided"}</p><p className="text-xs text-gray-400">{booking.status}</p>{professorView && booking.status === "requested" && <div className="mt-3 flex gap-2"><button className="btn btn-xs btn-primary" onClick={() => update(booking._id, "confirmed")}>Confirm</button><button className="btn btn-xs" onClick={() => update(booking._id, "rejected")}>Reject</button></div>}{professorView && booking.status === "confirmed" && <button className="btn btn-xs mt-3" onClick={() => update(booking._id, "completed")}>Complete</button>}{!professorView && ["requested", "confirmed"].includes(booking.status) && <button className="btn btn-xs mt-3" onClick={() => update(booking._id, "cancelled")}>Cancel</button>}</div>)}{bookings.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-gray-500">No bookings yet.</p>}</div>;
};

export default OfficeHourBookingPanel;
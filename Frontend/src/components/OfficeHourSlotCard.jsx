import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { bookOfficeHourSlot, updateOfficeHourSlot } from "../features/officeHours/officeHoursSlice";

const OfficeHourSlotCard = ({ courseId, isProfessor, slot }) => {
  const dispatch = useDispatch();
  const bookings = useSelector((state) => state.officeHours.bookingsByCourseId[courseId] || []);
  const existingBooking = bookings.find((booking) => String(booking.slot?._id || booking.slot) === String(slot._id));
  const [reason, setReason] = useState("");
  const book = async () => { try { await dispatch(bookOfficeHourSlot({ slotId: slot._id, reason })).unwrap(); toast.success("Booking requested"); setReason(""); } catch (e) { toast.error(e || "Unable to book slot"); } };
  const cancelSlot = () => dispatch(updateOfficeHourSlot({ courseId, slotId: slot._id, payload: { status: "cancelled" } }));
  return <article className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70"><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-700">{slot.status}</span><span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">{slot.mode}</span></div><h3 className="mt-3 text-xl font-black text-gray-900">{slot.title}</h3><p className="mt-2 text-sm text-gray-500">{new Date(slot.startAt).toLocaleString()} - {new Date(slot.endAt).toLocaleString()}</p>{slot.location && <p className="text-sm text-gray-600">{slot.location}</p>}{slot.meetingLink && <a className="text-sm font-bold text-blue-600" href={slot.meetingLink} target="_blank" rel="noreferrer">Meeting link</a>}<p className="mt-2 text-xs text-gray-400">Capacity: {slot.capacity}</p>{isProfessor ? <button className="btn mt-4 btn-sm" disabled={slot.status === "cancelled"} onClick={cancelSlot}>Cancel slot</button> : <div className="mt-4 space-y-2">{existingBooking ? <p className="rounded-2xl bg-blue-50 p-3 text-sm font-bold text-blue-700">Booking: {existingBooking.status}</p> : <><input className="input input-bordered input-sm w-full" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for meeting" /><button className="btn btn-primary btn-sm" onClick={book}>Book slot</button></>}</div>}</article>;
};

export default OfficeHourSlotCard;
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { deleteCourseAnnouncement } from "../features/courseAnnouncements/courseAnnouncementsSlice";

const priorityClass = {
  normal: "bg-blue-50 text-blue-700",
  important: "bg-amber-50 text-amber-700",
  urgent: "bg-red-50 text-red-700",
};

const CourseAnnouncementCard = ({ announcement, courseId, isInstructor }) => {
  const dispatch = useDispatch();
  const isDeleting = useSelector((state) => Boolean(state.courseAnnouncements.actionLoadingById[announcement._id]));
  const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date();

  const remove = async () => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await dispatch(deleteCourseAnnouncement({ courseId, announcementId: announcement._id })).unwrap();
      toast.success("Announcement deleted");
    } catch (error) {
      toast.error(error || "Unable to delete announcement");
    }
  };

  return (
    <article className={`rounded-3xl p-5 shadow-xl shadow-slate-200/70 ${announcement.priority === "urgent" ? "bg-red-50" : "bg-white"}`}>
      <div className="flex flex-wrap gap-2 text-xs">
        {announcement.pinned && <span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-700">Pinned</span>}
        <span className={`rounded-full px-3 py-1 font-bold ${priorityClass[announcement.priority] || priorityClass.normal}`}>{announcement.priority}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">{announcement.visibility}</span>
        {isExpired && <span className="rounded-full bg-slate-200 px-3 py-1 font-bold text-slate-600">Expired</span>}
      </div>
      <h3 className="mt-3 text-xl font-black text-gray-900">{announcement.title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{announcement.body}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-500">
        <span>Posted by {announcement.author?.firstName} {announcement.author?.lastName}</span>
        <span>{new Date(announcement.publishedAt || announcement.createdAt).toLocaleString()}</span>
      </div>
      {announcement.expiresAt && <p className="mt-1 text-xs text-gray-400">Expires {new Date(announcement.expiresAt).toLocaleString()}</p>}
      {isInstructor && <button className="btn mt-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100" disabled={isDeleting} onClick={remove}>{isDeleting ? "Deleting..." : "Delete"}</button>}
    </article>
  );
};

export default CourseAnnouncementCard;
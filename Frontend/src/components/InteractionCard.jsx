import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchInteractionSummary, updateInteractionStatus } from "../features/interactions/interactionsSlice";
import { getImageUrl } from "../utils/imageUtils";

const typeLabels = {
  StudyInvite: "Study Invite",
  ProjectInvite: "Project Invite",
  HelpRequest: "Help Request",
};

const statusClass = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  declined: "bg-red-50 text-red-600",
  completed: "bg-blue-50 text-blue-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "Not scheduled");

const InteractionCard = ({ interaction }) => {
  const dispatch = useDispatch();
  const currentUserId = useSelector((state) => state.auth.user?._id);
  const actionLoading = useSelector((state) => Boolean(state.interactions.actionLoadingById[interaction._id]));
  const isSender = String(interaction.sender?._id || interaction.sender) === String(currentUserId);
  const otherUser = isSender ? interaction.recipient : interaction.sender;

  const updateStatus = async (status) => {
    try {
      await dispatch(updateInteractionStatus({ interactionId: interaction._id, status })).unwrap();
      dispatch(fetchInteractionSummary());
      toast.success("Interaction updated");
    } catch (error) {
      toast.error(error || "Unable to update interaction");
    }
  };

  return (
    <article className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
      <div className="flex items-center gap-4">
        <img src={getImageUrl(otherUser?.image, "https://cdn-icons-png.flaticon.com/512/6596/6596121.png")} alt="Interaction user" className="h-12 w-12 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-500">{isSender ? "To" : "From"} {otherUser?.firstName} {otherUser?.lastName}</p>
          <h2 className="truncate text-lg font-black text-gray-900">{interaction.title}</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[interaction.status] || statusClass.pending}`}>{interaction.status}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-700">{typeLabels[interaction.type] || interaction.type}</span>
        {interaction.payload?.topic && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{interaction.payload.topic}</span>}
        {interaction.payload?.category && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{interaction.payload.category}</span>}
        {interaction.payload?.mode && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{interaction.payload.mode}</span>}
      </div>

      {interaction.message && <p className="mt-4 text-sm leading-6 text-gray-600">{interaction.message}</p>}

      {(interaction.payload?.scheduledAt || interaction.payload?.deadline) && (
        <p className="mt-3 text-xs font-semibold text-gray-400">
          {interaction.payload?.scheduledAt ? `Scheduled: ${formatDate(interaction.payload.scheduledAt)}` : `Deadline: ${formatDate(interaction.payload.deadline)}`}
        </p>
      )}

      {interaction.payload?.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {interaction.payload.skills.map((skill) => <span key={skill} className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">{skill}</span>)}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {!isSender && interaction.status === "pending" && (
          <>
            <button className="btn btn-primary btn-sm rounded-xl" disabled={actionLoading} onClick={() => updateStatus("accepted")}>{actionLoading ? "Accepting..." : "Accept"}</button>
            <button className="btn btn-sm rounded-xl" disabled={actionLoading} onClick={() => updateStatus("declined")}>Decline</button>
          </>
        )}
        {isSender && interaction.status === "pending" && <button className="btn btn-sm rounded-xl" disabled={actionLoading} onClick={() => updateStatus("cancelled")}>Cancel</button>}
        {interaction.status === "accepted" && <button className="btn btn-sm rounded-xl bg-emerald-50 text-emerald-700" disabled={actionLoading} onClick={() => updateStatus("completed")}>Mark completed</button>}
      </div>
    </article>
  );
};

export default InteractionCard;
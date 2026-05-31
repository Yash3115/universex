import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createInteraction, fetchInteractionSummary } from "../features/interactions/interactionsSlice";

const typeOptions = [
  { value: "StudyInvite", label: "Study Invite" },
  { value: "ProjectInvite", label: "Project Invite" },
  { value: "HelpRequest", label: "Help Request" },
];

const InteractionFormModal = ({ defaultType = "StudyInvite", onClose, recipient }) => {
  const dispatch = useDispatch();
  const createStatus = useSelector((state) => state.interactions?.createStatus);
  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [mode, setMode] = useState("online");
  const [skills, setSkills] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("general");
  const [urgency, setUrgency] = useState("normal");

  const isSubmitting = createStatus === "loading";

  const buildPayload = () => {
    if (type === "StudyInvite") return { topic, scheduledAt, mode };
    if (type === "ProjectInvite") return { skills, deadline };
    if (type === "HelpRequest") return { category, urgency };
    return {};
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!recipient?._id) return;

    try {
      await dispatch(
        createInteraction({
          recipientId: recipient._id,
          type,
          title,
          message,
          payload: buildPayload(),
        })
      ).unwrap();
      dispatch(fetchInteractionSummary());
      toast.success("Interaction sent");
      onClose();
    } catch (error) {
      toast.error(error || "Unable to send interaction");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-600">Connected interaction</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Send to {recipient?.firstName || "connection"}</h2>
          </div>
          <button type="button" className="btn btn-sm rounded-xl" onClick={onClose}>✕</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <select className="select select-bordered rounded-2xl" value={type} onChange={(event) => setType(event.target.value)}>
            {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input className="input input-bordered rounded-2xl" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" required maxLength={120} />
        </div>

        {type === "StudyInvite" && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <input className="input input-bordered rounded-2xl" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Study topic" />
            <input className="input input-bordered rounded-2xl" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
            <select className="select select-bordered rounded-2xl" value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        )}

        {type === "ProjectInvite" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input className="input input-bordered rounded-2xl" value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Skills needed, comma separated" />
            <input className="input input-bordered rounded-2xl" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </div>
        )}

        {type === "HelpRequest" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input className="input input-bordered rounded-2xl" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category e.g. placements" />
            <select className="select select-bordered rounded-2xl" value={urgency} onChange={(event) => setUrgency(event.target.value)}>
              <option value="low">Low urgency</option>
              <option value="normal">Normal</option>
              <option value="high">High urgency</option>
            </select>
          </div>
        )}

        <textarea className="textarea textarea-bordered mt-4 min-h-32 w-full rounded-2xl" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add context so your connection knows how to help" maxLength={1000} />

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn rounded-2xl" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary rounded-2xl" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send interaction"}</button>
        </div>
      </form>
    </div>
  );
};

export default InteractionFormModal;
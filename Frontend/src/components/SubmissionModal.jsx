import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { submitAssignment } from "../features/assignments/assignmentsSlice";

const SubmissionModal = ({ assignment, onClose }) => {
  const dispatch = useDispatch();
  const submitStatus = useSelector((state) => state.assignments.submitStatus);
  const [textAnswer, setTextAnswer] = useState(assignment.mySubmission?.textAnswer || "");
  const [file, setFile] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("textAnswer", textAnswer);
    if (file) formData.append("submissionFile", file);
    try {
      await dispatch(submitAssignment({ assignmentId: assignment._id, formData })).unwrap();
      toast.success("Assignment submitted");
      onClose();
    } catch (error) {
      toast.error(error || "Unable to submit assignment");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onSubmit={submit}>
        <div className="flex items-start justify-between"><div><p className="text-sm font-black uppercase tracking-wide text-blue-600">Submit assignment</p><h2 className="text-2xl font-black">{assignment.title}</h2></div><button type="button" className="btn btn-sm" onClick={onClose}>✕</button></div>
        <textarea className="textarea textarea-bordered mt-6 min-h-40 w-full rounded-2xl" value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} placeholder="Write your answer or notes" />
        <input className="file-input file-input-bordered mt-4 w-full rounded-2xl" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={submitStatus === "loading"}>{submitStatus === "loading" ? "Submitting..." : "Submit"}</button></div>
      </form>
    </div>
  );
};

export default SubmissionModal;
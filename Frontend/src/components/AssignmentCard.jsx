import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchAssignmentSubmissions, gradeSubmission } from "../features/assignments/assignmentsSlice";
import AiAssistPanel from "./AiAssistPanel";
import SubmissionModal from "./SubmissionModal";

const AssignmentCard = ({ assignment, courseId, isInstructor }) => {
  const dispatch = useDispatch();
  const submissions = useSelector((state) => state.assignments.submissionsByAssignmentId[assignment._id] || []);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [gradeDrafts, setGradeDrafts] = useState({});
  const isPastDue = assignment.dueDate && new Date() > new Date(assignment.dueDate);

  const loadSubmissions = () => {
    setShowSubmissions((current) => !current);
    dispatch(fetchAssignmentSubmissions(assignment._id));
  };

  const saveGrade = async (submission) => {
    const draft = gradeDrafts[submission._id] || {};
    try {
      await dispatch(gradeSubmission({ submissionId: submission._id, payload: draft })).unwrap();
      toast.success("Submission graded");
    } catch (error) {
      toast.error(error || "Unable to grade submission");
    }
  };

  return (
    <article className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
      <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">{assignment.status}</span>{isPastDue && <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">Past due</span>}</div>
      <h3 className="mt-3 text-xl font-black text-gray-900">{assignment.title}</h3>
      <p className="mt-3 text-sm leading-6 text-gray-600">{assignment.description || "No instructions added."}</p>
      <p className="mt-3 text-xs text-gray-500">Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : "No due date"} - {assignment.totalMarks} marks</p>
      {assignment.attachment?.url && <a className="btn btn-sm mt-3 rounded-xl" href={assignment.attachment.url} target="_blank" rel="noreferrer">Open attachment</a>}
      {assignment.mySubmission && <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm text-blue-700">Submitted - {assignment.mySubmission.status}{assignment.mySubmission.marksAwarded !== undefined ? ` - ${assignment.mySubmission.marksAwarded}/${assignment.totalMarks}` : ""}{assignment.mySubmission.feedback ? ` - ${assignment.mySubmission.feedback}` : ""}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        {isInstructor ? <button className="btn btn-primary btn-sm rounded-xl" onClick={loadSubmissions}>Submissions ({assignment.submissionSummary?.total || 0})</button> : <button className="btn btn-primary btn-sm rounded-xl" onClick={() => setShowSubmit(true)}>{assignment.mySubmission ? "Resubmit" : "Submit"}</button>}
      </div>
      <div className="mt-4">
        <AiAssistPanel
          compact
          sourceType="assignment"
          sourceId={assignment._id}
          title={isInstructor ? "AI assignment copilot" : "AI assignment helper"}
          prompt={{ title: assignment.title, dueDate: assignment.dueDate, totalMarks: assignment.totalMarks }}
          actions={[
            { kind: "summarize", label: "Summary" },
            { kind: "simplify", label: "Simplify" },
            { kind: "action-items", label: "Checklist" },
            ...(isInstructor ? [{ kind: "professor-draft", label: "Rubric draft", prompt: { draftType: "rubric" } }] : []),
          ]}
        />
      </div>
      {showSubmissions && (
        <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-3">
          {submissions.map((submission) => (
            <div key={submission._id} className="rounded-2xl bg-white p-3">
              <p className="font-bold text-gray-900">{submission.student?.firstName} {submission.student?.lastName}</p>
              <p className="text-xs text-gray-500">{submission.status} - {new Date(submission.submittedAt).toLocaleString()}</p>
              {submission.file?.url && <a className="mt-2 inline-block text-sm font-bold text-blue-600" href={submission.file.url} target="_blank" rel="noreferrer">Open submission file</a>}
              {submission.textAnswer && <p className="mt-2 text-sm text-gray-600">{submission.textAnswer}</p>}
              <div className="mt-3 grid gap-2 md:grid-cols-[120px_1fr_auto]">
                <input className="input input-bordered input-sm" type="number" placeholder="Marks" defaultValue={submission.marksAwarded || ""} onChange={(e) => setGradeDrafts((current) => ({ ...current, [submission._id]: { ...(current[submission._id] || {}), marksAwarded: e.target.value } }))} />
                <input className="input input-bordered input-sm" placeholder="Feedback" defaultValue={submission.feedback || ""} onChange={(e) => setGradeDrafts((current) => ({ ...current, [submission._id]: { ...(current[submission._id] || {}), feedback: e.target.value } }))} />
                <button className="btn btn-sm" onClick={() => saveGrade(submission)}>Grade</button>
              </div>
            </div>
          ))}
          {submissions.length === 0 && <p className="text-sm text-gray-500">No submissions yet.</p>}
        </div>
      )}
      {showSubmit && <SubmissionModal assignment={assignment} onClose={() => setShowSubmit(false)} />}
    </article>
  );
};

export default AssignmentCard;

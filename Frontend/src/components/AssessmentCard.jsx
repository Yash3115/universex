import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchAssessmentGrades, publishAssessment, saveAssessmentGrades } from "../features/results/resultsSlice";

const AssessmentCard = ({ assessment, course, isInstructor }) => {
  const dispatch = useDispatch();
  const grades = useSelector((state) => state.results.gradesByAssessmentId[assessment._id] || []);
  const [showGradebook, setShowGradebook] = useState(false);
  const [drafts, setDrafts] = useState({});

  const loadGrades = () => {
    setShowGradebook((current) => !current);
    dispatch(fetchAssessmentGrades(assessment._id));
  };

  const roster = course?.enrollments?.filter((item) => item.status === "enrolled") || [];
  const gradeMap = new Map(grades.map((grade) => [String(grade.student?._id || grade.student), grade]));

  const saveGrades = async () => {
    const gradesPayload = roster.map((item) => {
      const studentId = item.student?._id || item.student;
      const existing = gradeMap.get(String(studentId));
      const draft = drafts[studentId] || {};
      return {
        studentId,
        marks: draft.marks ?? existing?.marks ?? 0,
        grade: draft.grade ?? existing?.grade ?? "",
        feedback: draft.feedback ?? existing?.feedback ?? "",
        privateNote: draft.privateNote ?? existing?.privateNote ?? "",
      };
    });
    try {
      await dispatch(saveAssessmentGrades({ assessmentId: assessment._id, grades: gradesPayload })).unwrap();
      toast.success("Grades saved");
    } catch (error) {
      toast.error(error || "Unable to save grades");
    }
  };

  const publish = async () => {
    try {
      await dispatch(publishAssessment({ assessmentId: assessment._id, payload: { status: assessment.status === "published" ? "draft" : "published" } })).unwrap();
      toast.success("Assessment updated");
    } catch (error) {
      toast.error(error || "Unable to publish results");
    }
  };

  return (
    <article className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
      <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-purple-50 px-3 py-1 font-bold text-purple-700">{assessment.type}</span><span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">{assessment.status}</span></div>
      <h3 className="mt-3 text-xl font-black text-gray-900">{assessment.title}</h3>
      <p className="mt-2 text-sm text-gray-600">{assessment.description || "No description."}</p>
      <p className="mt-3 text-xs text-gray-500">Max {assessment.maxMarks} · Weightage {assessment.weightage || 0}% · Avg {assessment.gradeSummary?.average || 0}</p>
      {!isInstructor && assessment.myGrade && <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm text-blue-700">Marks: {assessment.myGrade.marks}/{assessment.maxMarks} · Grade: {assessment.myGrade.grade || "--"}{assessment.myGrade.feedback ? ` · ${assessment.myGrade.feedback}` : ""}</p>}
      {isInstructor && <div className="mt-4 flex flex-wrap gap-2"><button className="btn btn-primary btn-sm" onClick={loadGrades}>Gradebook ({assessment.gradeSummary?.count || 0})</button><button className="btn btn-sm" onClick={publish}>{assessment.status === "published" ? "Unpublish" : "Publish"}</button></div>}
      {showGradebook && <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-3">
        {roster.map((item) => {
          const student = item.student;
          const studentId = student?._id || student;
          const existing = gradeMap.get(String(studentId));
          return <div key={studentId} className="grid gap-2 rounded-2xl bg-white p-3 md:grid-cols-[1fr_100px_100px_1fr]">
            <p className="font-bold text-gray-900">{student?.firstName} {student?.lastName}</p>
            <input className="input input-bordered input-sm" type="number" placeholder="Marks" defaultValue={existing?.marks || ""} onChange={(e) => setDrafts((current) => ({ ...current, [studentId]: { ...(current[studentId] || {}), marks: e.target.value } }))} />
            <input className="input input-bordered input-sm" placeholder="Grade" defaultValue={existing?.grade || ""} onChange={(e) => setDrafts((current) => ({ ...current, [studentId]: { ...(current[studentId] || {}), grade: e.target.value } }))} />
            <input className="input input-bordered input-sm" placeholder="Feedback" defaultValue={existing?.feedback || ""} onChange={(e) => setDrafts((current) => ({ ...current, [studentId]: { ...(current[studentId] || {}), feedback: e.target.value } }))} />
          </div>;
        })}
        <button className="btn btn-primary btn-sm" onClick={saveGrades}>Save grades</button>
      </div>}
    </article>
  );
};

export default AssessmentCard;
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createCourseAnswer, markAnswerOfficial, toggleAnswerHelpful, toggleQuestionUpvote, updateQuestionStatus } from "../features/courseQA/courseQASlice";
import { getImageUrl } from "../utils/imageUtils";

const CourseQuestionCard = ({ courseId, isInstructor, question }) => {
  const dispatch = useDispatch();
  const answerStatus = useSelector((state) => state.courseQA.answerStatus);
  const [answerBody, setAnswerBody] = useState("");

  const submitAnswer = async (event) => {
    event.preventDefault();
    try {
      await dispatch(createCourseAnswer({ courseId, questionId: question._id, body: answerBody })).unwrap();
      setAnswerBody("");
      toast.success("Answer posted");
    } catch (error) {
      toast.error(error || "Unable to post answer");
    }
  };

  const setStatus = (status) => dispatch(updateQuestionStatus({ courseId, questionId: question._id, status }));

  return (
    <article className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-700">{question.status}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">{question.visibility}</span>
        {(question.tags || []).map((tag) => <span key={tag} className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">{tag}</span>)}
      </div>
      <h3 className="mt-3 text-xl font-black text-gray-900">{question.title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{question.body}</p>
      <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
        <img src={getImageUrl(question.askedBy?.image, "https://cdn-icons-png.flaticon.com/512/6596/6596121.png")} alt="Asker" className="h-8 w-8 rounded-full object-cover" />
        <span>{question.askedBy?.firstName} {question.askedBy?.lastName}</span>
        <button className={`btn btn-xs rounded-xl ${question.hasUpvoted ? "btn-primary" : ""}`} onClick={() => dispatch(toggleQuestionUpvote({ courseId, questionId: question._id }))}>▲ {question.upvoteCount || 0}</button>
      </div>

      <div className="mt-5 space-y-3">
        {(question.answers || []).map((answer) => (
          <div key={answer._id} className={`rounded-2xl p-4 ${answer.official ? "bg-emerald-50" : "bg-slate-50"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-gray-900">{answer.answeredBy?.firstName} {answer.answeredBy?.lastName}</p>
              {answer.official && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Official answer</span>}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{answer.body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-xs rounded-xl" onClick={() => dispatch(toggleAnswerHelpful({ courseId, answerId: answer._id }))}>Helpful {answer.helpfulCount || 0}</button>
              {isInstructor && !answer.official && <button className="btn btn-xs btn-primary rounded-xl" onClick={() => dispatch(markAnswerOfficial({ courseId, answerId: answer._id }))}>Mark official</button>}
            </div>
          </div>
        ))}
      </div>

      {question.status !== "closed" && (
        <form className="mt-5" onSubmit={submitAnswer}>
          <textarea className="textarea textarea-bordered min-h-24 w-full rounded-2xl" value={answerBody} onChange={(e) => setAnswerBody(e.target.value)} placeholder="Write an answer" />
          <button className="btn btn-primary btn-sm mt-2 rounded-xl" disabled={answerStatus === "loading"}>{answerStatus === "loading" ? "Posting..." : "Post answer"}</button>
        </form>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {question.status !== "closed" ? <button className="btn btn-xs rounded-xl" onClick={() => setStatus("closed")}>Close question</button> : <button className="btn btn-xs rounded-xl" onClick={() => setStatus("open")}>Reopen</button>}
      </div>
    </article>
  );
};

export default CourseQuestionCard;
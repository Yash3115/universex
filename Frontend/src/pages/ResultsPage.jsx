import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyResults } from "../features/results/resultsSlice";
import AiAssistPanel from "../components/AiAssistPanel";

const ResultsPage = () => {
  const dispatch = useDispatch();
  const { error, myResults, myResultsStatus } = useSelector((state) => state.results);

  useEffect(() => {
    dispatch(fetchMyResults());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-purple-700 to-indigo-700 p-6 text-white shadow-2xl shadow-indigo-200">
          <p className="text-sm font-bold uppercase tracking-wide text-purple-100">Private results</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">My Results</h1>
          <p className="mt-3 max-w-2xl text-purple-100">Only you can see your marks, grades, and feedback.</p>
        </section>
        {myResultsStatus === "loading" && <p className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow">Loading results...</p>}
        {myResultsStatus === "failed" && <p className="rounded-3xl bg-red-50 p-8 text-red-600 shadow">{error}</p>}
        <section className="grid gap-4 md:grid-cols-2">
          {myResults.map((result) => (
            <article key={result._id} className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
              <p className="text-xs font-black uppercase tracking-wide text-blue-600">{result.course?.code}</p>
              <h2 className="mt-1 text-xl font-black text-gray-900">{result.assessment?.title}</h2>
              <p className="mt-2 text-sm text-gray-500">{result.assessment?.type}</p>
              <p className="mt-4 text-lg font-black text-gray-900">{result.marks}/{result.assessment?.maxMarks || "--"} {result.grade && `- ${result.grade}`}</p>
              {result.feedback && <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm text-blue-700">{result.feedback}</p>}
              {result.feedback && (
                <div className="mt-4">
                  <AiAssistPanel
                    compact
                    sourceType="result"
                    sourceId={result._id}
                    title="AI feedback helper"
                    prompt={{ assessment: result.assessment?.title, marks: result.marks, maxMarks: result.assessment?.maxMarks }}
                    actions={[
                      { kind: "summarize", label: "Explain" },
                      { kind: "action-items", label: "Next steps" },
                    ]}
                  />
                </div>
              )}
              <p className="mt-3 text-xs text-gray-400">Published {new Date(result.publishedAt).toLocaleString()}</p>
            </article>
          ))}
        </section>
        {myResultsStatus === "succeeded" && myResults.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow">No published results yet.</p>}
      </div>
    </div>
  );
};

export default ResultsPage;

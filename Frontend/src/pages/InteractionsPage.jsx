import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import InteractionCard from "../components/InteractionCard";
import { fetchInteractions, fetchInteractionSummary, setInteractionFilters } from "../features/interactions/interactionsSlice";

const tabs = [
  { label: "Incoming", box: "incoming", status: "pending" },
  { label: "Sent", box: "sent", status: "pending" },
  { label: "Accepted", box: "all", status: "accepted" },
  { label: "Completed", box: "all", status: "completed" },
];

const summaryCards = [
  { key: "pendingIncoming", label: "Incoming" },
  { key: "pendingSent", label: "Sent" },
  { key: "accepted", label: "Accepted" },
  { key: "completed", label: "Completed" },
];

const InteractionsPage = () => {
  const dispatch = useDispatch();
  const { error, filters, items, status, summary } = useSelector((state) => state.interactions);

  useEffect(() => {
    dispatch(fetchInteractions(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    dispatch(fetchInteractionSummary());
  }, [dispatch]);

  const switchTab = (tab) => dispatch(setInteractionFilters({ box: tab.box, status: tab.status }));
  const activeTab = tabs.find((tab) => tab.box === filters.box && tab.status === filters.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-2xl shadow-blue-200">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-100">Connection interactions</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Study, collaborate, and ask for help</h1>
          <p className="mt-3 max-w-2xl text-blue-100">Turn your campus network into real collaboration with structured invites and requests.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.key} className="rounded-3xl bg-white/15 p-4 text-center backdrop-blur">
                <p className="text-2xl font-black">{summary?.[card.key] || 0}</p>
                <p className="text-xs font-semibold text-blue-50">{card.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-xl shadow-slate-200/70">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button key={tab.label} className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${activeTab?.label === tab.label ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`} onClick={() => switchTab(tab)}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="input input-bordered rounded-2xl" value={filters.search} onChange={(event) => dispatch(setInteractionFilters({ search: event.target.value }))} placeholder="Search title or message" />
            <select className="select select-bordered rounded-2xl" value={filters.type} onChange={(event) => dispatch(setInteractionFilters({ type: event.target.value }))}>
              <option value="">All types</option>
              <option value="StudyInvite">Study invites</option>
              <option value="ProjectInvite">Project invites</option>
              <option value="HelpRequest">Help requests</option>
            </select>
          </div>
        </section>

        {status === "loading" && <p className="rounded-3xl bg-white p-8 text-center font-semibold text-gray-500 shadow">Loading interactions...</p>}
        {status === "failed" && <p className="rounded-3xl bg-red-50 p-8 text-center font-semibold text-red-600 shadow">{error}</p>}
        {status === "succeeded" && items.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow">No interactions found.</p>}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((interaction) => <InteractionCard key={interaction._id} interaction={interaction} />)}
        </section>
      </div>
    </div>
  );
};

export default InteractionsPage;
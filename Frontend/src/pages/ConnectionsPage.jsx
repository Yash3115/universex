import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchConnections,
  fetchConnectionSummary,
  removeConnection,
  respondToConnection,
  setConnectionFilters,
  updateConnectionPreferences,
} from "../features/discovery/discoverySlice";
import { getImageUrl } from "../utils/imageUtils";

const tabs = [
  { label: "Connections", status: "accepted", direction: "connected" },
  { label: "Incoming", status: "pending", direction: "incoming" },
  { label: "Sent", status: "pending", direction: "outgoing" },
];

const statCards = [
  { key: "accepted", label: "Connections", accent: "from-emerald-500 to-teal-500" },
  { key: "incomingPending", label: "Incoming", accent: "from-blue-500 to-indigo-500" },
  { key: "outgoingPending", label: "Sent", accent: "from-purple-500 to-pink-500" },
];

const formatDate = (value) => {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
};

const getConnectionId = (connection) => connection?.connectionState?.id || connection?._id;

const labelOptions = ["", "Classmate", "Friend", "Project teammate", "Senior", "Mentor", "Study buddy"];

const ConnectionsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [editingNotesByConnectionId, setEditingNotesByConnectionId] = useState({});
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const {
    actionLoadingByConnectionId,
    connectionFilters,
    connections,
    connectionsError,
    connectionsStatus,
    connectionSummary,
  } = useSelector((state) => state.discovery);

  useEffect(() => {
    dispatch(fetchConnections(connectionFilters));
  }, [dispatch, connectionFilters]);

  useEffect(() => {
    dispatch(fetchConnectionSummary());
  }, [dispatch]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    dispatch(setConnectionFilters({ [name]: value }));
  };

  const switchTab = (tab) => {
    dispatch(setConnectionFilters({ status: tab.status, direction: tab.direction }));
  };

  const handleRemove = async (connection) => {
    const connectionId = getConnectionId(connection);
    if (!connectionId) return;

    try {
      const result = await dispatch(removeConnection(connectionId)).unwrap();
      toast.success(result.message || "Connection updated");
      dispatch(fetchConnections(connectionFilters));
      dispatch(fetchConnectionSummary());
    } catch (error) {
      toast.error(error || "Unable to remove connection");
    } finally {
      setPendingRemoval(null);
    }
  };

  const handlePreferenceUpdate = async (connection, preferences) => {
    const connectionId = getConnectionId(connection);
    if (!connectionId) return;

    try {
      await dispatch(updateConnectionPreferences({ connectionId, preferences })).unwrap();
      toast.success("Connection updated");
    } catch (error) {
      toast.error(error || "Unable to update connection");
    }
  };

  const handleNoteChange = (connectionId, value) => {
    setEditingNotesByConnectionId((current) => ({ ...current, [connectionId]: value }));
  };

  const getDraftNote = (connection) => {
    const connectionId = getConnectionId(connection);
    return editingNotesByConnectionId[connectionId] ?? connection.viewerPreferences?.note ?? "";
  };

  const handleRespond = async (connection, status) => {
    const connectionId = getConnectionId(connection);
    if (!connectionId) return;

    try {
      const result = await dispatch(
        respondToConnection({
          connectionId,
          status,
          studentId: connection.student?._id,
        })
      ).unwrap();
      toast.success(result.message || "Connection updated");
      dispatch(fetchConnections(connectionFilters));
      dispatch(fetchConnectionSummary());
    } catch (error) {
      toast.error(error || "Unable to update connection");
    }
  };

  const activeTab = tabs.find(
    (tab) => tab.status === connectionFilters.status && tab.direction === connectionFilters.direction
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 p-6 text-white shadow-2xl shadow-blue-200 md:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-cyan-100">Connected people</p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black sm:text-5xl">Your campus network</h1>
              <p className="mt-3 max-w-2xl text-cyan-50">
                Manage the people you know, respond to requests, and discover patterns across your student network.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {statCards.map((stat) => (
                <div key={stat.key} className="rounded-3xl bg-white/15 p-4 text-center backdrop-blur">
                  <div className={`mx-auto mb-2 h-1.5 w-10 rounded-full bg-gradient-to-r ${stat.accent}`} />
                  <p className="text-2xl font-black">{connectionSummary?.[stat.key] || 0}</p>
                  <p className="text-xs font-semibold text-cyan-50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-4">
            <div className="rounded-3xl bg-white p-4 shadow-xl shadow-slate-200/70">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const isActive = activeTab?.label === tab.label;
                  return (
                    <button
                      key={tab.label}
                      type="button"
                      className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                        isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                      onClick={() => switchTab(tab)}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                <input className="input input-bordered rounded-2xl md:col-span-2" name="search" value={connectionFilters.search} onChange={handleFilterChange} placeholder="Search people, skills, interests" />
                <input className="input input-bordered rounded-2xl" name="department" value={connectionFilters.department} onChange={handleFilterChange} placeholder="Department" />
                <input className="input input-bordered rounded-2xl" name="graduationYear" value={connectionFilters.graduationYear} onChange={handleFilterChange} placeholder="Batch year" />
              </div>
            </div>

            {connectionsStatus === "loading" && <p className="rounded-3xl bg-white p-8 text-center font-semibold text-gray-500 shadow">Loading your network...</p>}
            {connectionsStatus === "failed" && <p className="rounded-3xl bg-red-50 p-8 text-center font-semibold text-red-600 shadow">{connectionsError}</p>}

            {connectionsStatus === "succeeded" && connections.length === 0 && (
              <div className="rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-200/70">
                <h2 className="text-xl font-black text-gray-900">No {activeTab?.label.toLowerCase()} found</h2>
                <p className="mt-2 text-gray-500">Try a different filter or discover more students from the directory.</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {connections.map((connection) => {
                const student = connection.student || {};
                const details = student.additionalDetails || {};
                const connectionId = getConnectionId(connection);
                const isLoading = Boolean(actionLoadingByConnectionId[connectionId]);
                const preferences = connection.viewerPreferences || {};
                const draftNote = getDraftNote(connection);

                return (
                  <article key={connection._id} className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-2xl">
                    <div className="flex items-center gap-4">
                      <img src={getImageUrl(student.image, "https://cdn-icons-png.flaticon.com/512/6596/6596121.png")} alt={`${student.firstName || "Student"} avatar`} className="h-16 w-16 rounded-full object-cover" />
                      <div className="min-w-0">
                        <button className="truncate text-left text-lg font-black text-gray-900 hover:text-blue-700" onClick={() => navigate(`/students/${student._id}`)}>{student.firstName} {student.lastName}</button>
                        <p className="truncate text-sm text-gray-500">{student.college || "College not added"}</p>
                      </div>
                      {connection.status === "accepted" && (
                        <button
                          type="button"
                          className={`ml-auto rounded-full px-3 py-1 text-lg transition ${preferences.favorite ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-500"}`}
                          disabled={isLoading}
                          title={preferences.favorite ? "Remove from favorites" : "Add to favorites"}
                          onClick={() => handlePreferenceUpdate(connection, { favorite: !preferences.favorite })}
                        >
                          ★
                        </button>
                      )}
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">{details.about || "No bio added yet."}</p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      {details.department && <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">{details.department}</span>}
                      {details.graduationYear && <span className="rounded-full bg-purple-50 px-3 py-1 font-semibold text-purple-700">Batch {details.graduationYear}</span>}
                    </div>

                    {(details.skills?.length > 0 || details.interests?.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {[...(details.skills || []), ...(details.interests || [])].slice(0, 4).map((item) => (
                          <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item}</span>
                        ))}
                      </div>
                    )}

                    {connection.status === "accepted" && (
                      <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-3">
                        <select
                          className="select select-bordered select-sm w-full rounded-xl bg-white"
                          value={preferences.label || ""}
                          disabled={isLoading}
                          onChange={(event) => handlePreferenceUpdate(connection, { label: event.target.value })}
                        >
                          {labelOptions.map((label) => (
                            <option key={label || "none"} value={label}>{label || "Add relationship label"}</option>
                          ))}
                        </select>
                        <textarea
                          className="textarea textarea-bordered min-h-20 w-full rounded-xl bg-white text-sm"
                          value={draftNote}
                          disabled={isLoading}
                          maxLength={240}
                          placeholder="Private note about this connection"
                          onChange={(event) => handleNoteChange(connectionId, event.target.value)}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-400">Only you can see labels and notes.</span>
                          <button
                            type="button"
                            className="btn btn-xs rounded-xl"
                            disabled={isLoading || draftNote === (preferences.note || "")}
                            onClick={() => handlePreferenceUpdate(connection, { note: draftNote })}
                          >
                            Save note
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="mt-4 text-xs font-semibold text-gray-400">
                      {connection.status === "accepted" ? `Connected ${formatDate(connection.connectedAt)}` : `Requested ${formatDate(connection.createdAt)}`}
                    </p>

                    {connection.direction === "incoming" && connection.status === "pending" ? (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button className="btn btn-primary rounded-2xl" disabled={isLoading} onClick={() => handleRespond(connection, "accepted")}>{isLoading ? "Accepting..." : "Accept"}</button>
                        <button className="btn rounded-2xl" disabled={isLoading} onClick={() => handleRespond(connection, "rejected")}>Ignore</button>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button className="btn rounded-2xl" onClick={() => navigate(`/students/${student._id}`)}>View profile</button>
                        <button className="btn rounded-2xl border-red-100 bg-red-50 text-red-600 hover:bg-red-100" disabled={isLoading} onClick={() => setPendingRemoval(connection)}>{isLoading ? "Removing..." : connection.status === "accepted" ? "Remove" : "Cancel"}</button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
              <h2 className="text-lg font-black text-gray-900">Network by department</h2>
              <div className="mt-4 space-y-3">
                {(connectionSummary.byDepartment || []).slice(0, 6).map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3 text-sm">
                    <span className="font-bold text-blue-800">{item.name}</span>
                    <span className="font-black text-blue-600">{item.count}</span>
                  </div>
                ))}
                {(connectionSummary.byDepartment || []).length === 0 && <p className="text-sm text-gray-500">Department stats appear after you connect with students.</p>}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70">
              <h2 className="text-lg font-black text-gray-900">Recent connections</h2>
              <div className="mt-4 space-y-3">
                {(connectionSummary.recentConnections || []).slice(0, 5).map((connection) => (
                  <div key={connection._id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <img src={getImageUrl(connection.student?.image, "https://cdn-icons-png.flaticon.com/512/6596/6596121.png")} alt="Recent connection" className="h-10 w-10 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{connection.student?.firstName} {connection.student?.lastName}</p>
                      <p className="text-xs text-gray-500">{formatDate(connection.connectedAt)}</p>
                    </div>
                  </div>
                ))}
                {(connectionSummary.recentConnections || []).length === 0 && <p className="text-sm text-gray-500">No recent connections yet.</p>}
              </div>
            </div>
          </aside>
        </section>
      </div>

      {pendingRemoval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-gray-900">
              {pendingRemoval.status === "accepted" ? "Remove connection?" : "Cancel request?"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {pendingRemoval.status === "accepted"
                ? `This will remove ${pendingRemoval.student?.firstName || "this student"} from your network.`
                : "This will remove the pending connection request."}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="btn rounded-2xl" onClick={() => setPendingRemoval(null)}>Keep</button>
              <button className="btn rounded-2xl border-none bg-red-600 text-white hover:bg-red-700" onClick={() => handleRemove(pendingRemoval)}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionsPage;
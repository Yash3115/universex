import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  fetchChatMessages,
  fetchChatThreads,
  selectChatThread,
  sendChatMessage,
  startDirectChat,
} from "../features/chat/chatSlice";
import { getImageUrl } from "../utils/imageUtils";

const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const ChatPage = () => {
  const dispatch = useDispatch();
  const bottomRef = useRef(null);
  const user = useSelector((state) => state.auth.user);
  const { connections, department, error, messageStatusByThreadId, messagesByThreadId, selectedThreadId, sendStatus, status, threads } = useSelector((state) => state.chat);
  const [draft, setDraft] = useState("");

  const selectedThread = useMemo(
    () => threads.find((thread) => thread._id === selectedThreadId),
    [selectedThreadId, threads]
  );
  const messages = selectedThreadId ? messagesByThreadId[selectedThreadId] || [] : [];
  const existingDirectParticipantIds = useMemo(
    () =>
      new Set(
        threads
          .filter((thread) => thread.type === "direct")
          .map((thread) => thread.otherParticipant?._id)
          .filter(Boolean)
      ),
    [threads]
  );
  const unstartedConnections = connections.filter((connection) => !existingDirectParticipantIds.has(connection._id));

  useEffect(() => {
    dispatch(fetchChatThreads());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedThreadId) return undefined;
    dispatch(fetchChatMessages(selectedThreadId));
    const timer = window.setInterval(() => {
      dispatch(fetchChatMessages(selectedThreadId));
    }, 8000);
    return () => window.clearInterval(timer);
  }, [dispatch, selectedThreadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedThreadId]);

  const handleStartDirect = async (studentId) => {
    try {
      const thread = await dispatch(startDirectChat(studentId)).unwrap();
      dispatch(fetchChatMessages(thread._id));
    } catch (startError) {
      toast.error(startError || "Unable to start chat");
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!selectedThreadId || !draft.trim()) return;

    try {
      await dispatch(sendChatMessage({ threadId: selectedThreadId, content: draft.trim() })).unwrap();
      setDraft("");
    } catch (sendError) {
      toast.error(sendError || "Unable to send message");
    }
  };

  if (user?.role && user.role !== "Student") {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-xl shadow-slate-200/70">
          <h1 className="text-2xl font-black text-gray-900">Student chat</h1>
          <p className="mt-2 text-gray-500">Chat is available for student accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-blue-600">Student chat</p>
              <h1 className="mt-1 text-3xl font-black text-gray-900">Messages</h1>
              <p className="mt-2 text-sm text-gray-500">{department ? `${department} department room is ready.` : "Add your department in profile to unlock a department room."}</p>
            </div>
            <button className="btn rounded-2xl" onClick={() => dispatch(fetchChatThreads())}>Refresh</button>
          </div>
        </section>

        {error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</p>}

        <section className="grid min-h-[70vh] gap-5 lg:grid-cols-[22rem_1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">Chats</h2>
                {status === "loading" && <span className="loading loading-spinner loading-sm text-blue-600" />}
              </div>
              <div className="mt-4 space-y-2">
                {threads.map((thread) => (
                  <button
                    key={thread._id}
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                      selectedThreadId === thread._id ? "bg-blue-600 text-white" : "bg-slate-50 text-gray-700 hover:bg-blue-50"
                    }`}
                    onClick={() => dispatch(selectChatThread(thread._id))}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ${selectedThreadId === thread._id ? "bg-white/20" : "bg-blue-100"}`}>
                      {thread.type === "direct" ? (
                        <img src={getImageUrl(thread.otherParticipant?.image, "https://cdn-icons-png.flaticon.com/512/6596/6596121.png")} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-black">{thread.department?.slice(0, 2).toUpperCase() || "DP"}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black">{thread.title}</p>
                      <p className={`truncate text-xs ${selectedThreadId === thread._id ? "text-blue-100" : "text-gray-500"}`}>
                        {thread.lastMessage || (thread.type === "department" ? "Department group" : "Direct chat")}
                      </p>
                    </div>
                  </button>
                ))}
                {status === "succeeded" && threads.length === 0 && (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-gray-500">No chats yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
              <h2 className="text-lg font-black text-gray-900">Connected students</h2>
              <div className="mt-4 space-y-2">
                {unstartedConnections.map((connection) => (
                  <button
                    key={connection._id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-blue-50"
                    onClick={() => handleStartDirect(connection._id)}
                  >
                    <img src={getImageUrl(connection.image, "https://cdn-icons-png.flaticon.com/512/6596/6596121.png")} alt="" className="h-10 w-10 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-gray-900">{connection.firstName} {connection.lastName}</p>
                      <p className="truncate text-xs text-gray-500">{connection.additionalDetails?.department || connection.college}</p>
                    </div>
                  </button>
                ))}
                {unstartedConnections.length === 0 && (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-gray-500">All connected students with chats are listed above.</p>
                )}
              </div>
            </div>
          </aside>

          <main className="flex min-h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
            {selectedThread ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{selectedThread.title}</h2>
                    <p className="text-sm text-gray-500">{selectedThread.type === "department" ? "Department group" : selectedThread.otherParticipant?.college}</p>
                  </div>
                  {messageStatusByThreadId[selectedThread._id] === "loading" && <span className="loading loading-spinner loading-sm text-blue-600" />}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((message) => {
                    const isMine = String(message.sender?._id || message.sender) === String(user?._id);
                    return (
                      <div key={message._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${isMine ? "bg-blue-600 text-white" : "bg-slate-100 text-gray-800"}`}>
                          {!isMine && <p className="mb-1 text-xs font-black">{message.sender?.firstName} {message.sender?.lastName}</p>}
                          <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                          <p className={`mt-1 text-[11px] ${isMine ? "text-blue-100" : "text-gray-500"}`}>{formatTime(message.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-gray-500">No messages yet.</p>
                  )}
                  <div ref={bottomRef} />
                </div>

                <form className="border-t border-slate-100 p-4" onSubmit={handleSend}>
                  <div className="flex gap-3">
                    <textarea
                      className="textarea textarea-bordered min-h-12 flex-1 resize-none rounded-2xl"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Write a message"
                      maxLength={1000}
                    />
                    <button className="btn btn-primary rounded-2xl" type="submit" disabled={!draft.trim() || sendStatus === "loading"}>
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Select a chat</h2>
                  <p className="mt-2 text-gray-500">Start with a connected student or your department room.</p>
                </div>
              </div>
            )}
          </main>
        </section>
      </div>
    </div>
  );
};

export default ChatPage;

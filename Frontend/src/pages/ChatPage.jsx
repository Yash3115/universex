import { useEffect, useMemo, useRef, useState } from "react";
import { FiMessageCircle, FiRefreshCw, FiSearch, FiSend, FiUsers } from "react-icons/fi";
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

const fallbackAvatar = "https://cdn-icons-png.flaticon.com/512/6596/6596121.png";

const formatMessageTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatThreadTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
};

const getSenderName = (sender) =>
  `${sender?.firstName || "Student"} ${sender?.lastName || ""}`.trim();

const normalizeId = (value) => String(value?._id || value?.id || value || "");

const isOwnMessage = (message, user) => {
  if (message.isOwn === true) return true;
  if (message.isOwn === false) return false;

  const senderId = normalizeId(message.senderId || message.sender);
  const userId = normalizeId(user);
  return Boolean(senderId && userId && senderId === userId);
};

const getThreadSearchText = (thread) =>
  [
    thread.title,
    thread.department,
    thread.lastMessage,
    thread.otherParticipant?.firstName,
    thread.otherParticipant?.lastName,
    thread.otherParticipant?.email,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const Avatar = ({ className = "h-11 w-11", image, label, type }) => {
  if (type === "group") {
    return (
      <div className={`${className} flex shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700`}>
        <FiUsers aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={getImageUrl(image, fallbackAvatar)}
      alt=""
      className={`${className} shrink-0 rounded-full object-cover`}
    />
  );
};

const ThreadButton = ({ active, iconType, image, onClick, subtitle, thread, title }) => (
  <button
    type="button"
    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
      active ? "bg-emerald-50" : "hover:bg-slate-50"
    }`}
    onClick={onClick}
  >
    <Avatar image={image} type={iconType} />
    <div className="min-w-0 flex-1 border-b border-slate-100 pb-2 group-last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <p className={`truncate text-sm font-black ${active ? "text-emerald-900" : "text-slate-900"}`}>
          {title}
        </p>
        <span className="shrink-0 text-[11px] font-semibold text-slate-400">
          {formatThreadTime(thread.lastMessageAt || thread.updatedAt)}
        </span>
      </div>
      <p className="mt-1 truncate text-xs text-slate-500">{subtitle}</p>
    </div>
  </button>
);

const SectionHeader = ({ count, icon: Icon, title }) => (
  <div className="mb-2 flex items-center justify-between px-1">
    <div className="flex items-center gap-2">
      <Icon className="text-slate-400" aria-hidden="true" />
      <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</h3>
    </div>
    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">{count}</span>
  </div>
);

const ChatPage = () => {
  const dispatch = useDispatch();
  const bottomRef = useRef(null);
  const user = useSelector((state) => state.auth.user);
  const {
    connections,
    department,
    error,
    messageStatusByThreadId,
    messagesByThreadId,
    selectedThreadId,
    sendStatus,
    status,
    threads,
  } = useSelector((state) => state.chat);
  const [draft, setDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const selectedThread = useMemo(
    () => threads.find((thread) => thread._id === selectedThreadId),
    [selectedThreadId, threads]
  );
  const messages = selectedThreadId ? messagesByThreadId[selectedThreadId] || [] : [];

  const groupThreads = useMemo(
    () => threads.filter((thread) => thread.type !== "direct"),
    [threads]
  );
  const directThreads = useMemo(
    () => threads.filter((thread) => thread.type === "direct"),
    [threads]
  );

  const searchValue = searchTerm.trim().toLowerCase();
  const visibleGroupThreads = useMemo(
    () =>
      searchValue
        ? groupThreads.filter((thread) => getThreadSearchText(thread).includes(searchValue))
        : groupThreads,
    [groupThreads, searchValue]
  );
  const visibleDirectThreads = useMemo(
    () =>
      searchValue
        ? directThreads.filter((thread) => getThreadSearchText(thread).includes(searchValue))
        : directThreads,
    [directThreads, searchValue]
  );

  const existingDirectParticipantIds = useMemo(
    () =>
      new Set(
        directThreads
          .map((thread) => thread.otherParticipant?._id)
          .filter(Boolean)
      ),
    [directThreads]
  );
  const unstartedConnections = useMemo(
    () =>
      connections
        .filter((connection) => !existingDirectParticipantIds.has(connection._id))
        .filter((connection) => {
          if (!searchValue) return true;
          return [
            connection.firstName,
            connection.lastName,
            connection.email,
            connection.college,
            connection.additionalDetails?.department,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(searchValue);
        }),
    [connections, existingDirectParticipantIds, searchValue]
  );

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

  const handleDraftKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      handleSend(event);
    }
  };

  if (user?.role && user.role !== "Student") {
    return (
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-xl shadow-slate-200/70">
          <h1 className="text-2xl font-black text-slate-900">Student chat</h1>
          <p className="mt-2 text-slate-500">Chat is available for student accounts.</p>
        </section>
      </main>
    );
  }

  const selectedIsGroup = selectedThread?.type !== "direct";
  const selectedSubtitle = selectedIsGroup
    ? `${selectedThread?.department || department || "Department"} group`
    : selectedThread?.otherParticipant?.college || "Direct message";

  return (
    <main className="min-h-screen bg-[#edf2ef] p-3 sm:p-5 lg:p-8">
      <section className="mx-auto grid h-[calc(100vh-7rem)] min-h-[42rem] max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-[23rem_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Student chat</p>
                <h1 className="text-2xl font-black text-slate-950">Messages</h1>
              </div>
              <button
                type="button"
                className="btn btn-circle btn-sm bg-white"
                aria-label="Refresh chats"
                onClick={() => dispatch(fetchChatThreads())}
              >
                {status === "loading" ? (
                  <span className="loading loading-spinner loading-xs text-emerald-600" />
                ) : (
                  <FiRefreshCw aria-hidden="true" />
                )}
              </button>
            </div>
            <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <FiSearch className="text-slate-400" aria-hidden="true" />
              <span className="sr-only">Search chats</span>
              <input
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search chats"
              />
            </label>
          </div>

          {error && (
            <p className="m-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <SectionHeader count={visibleGroupThreads.length} icon={FiUsers} title="Groups" />
            <div className="space-y-1">
              {visibleGroupThreads.map((thread) => (
                <ThreadButton
                  key={thread._id}
                  active={selectedThreadId === thread._id}
                  iconType="group"
                  onClick={() => dispatch(selectChatThread(thread._id))}
                  subtitle={thread.lastMessage || "Department group"}
                  thread={thread}
                  title={thread.title}
                />
              ))}
              {status === "succeeded" && visibleGroupThreads.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No groups found.</p>
              )}
            </div>

            <div className="mt-6">
              <SectionHeader count={visibleDirectThreads.length} icon={FiMessageCircle} title="Direct messages" />
              <div className="space-y-1">
                {visibleDirectThreads.map((thread) => (
                  <ThreadButton
                    key={thread._id}
                    active={selectedThreadId === thread._id}
                    image={thread.otherParticipant?.image}
                    onClick={() => dispatch(selectChatThread(thread._id))}
                    subtitle={thread.lastMessage || "Direct chat"}
                    thread={thread}
                    title={thread.title}
                  />
                ))}
                {status === "succeeded" && visibleDirectThreads.length === 0 && (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No direct messages found.</p>
                )}
              </div>
            </div>

            {unstartedConnections.length > 0 && (
              <div className="mt-6">
                <SectionHeader count={unstartedConnections.length} icon={FiMessageCircle} title="Start a DM" />
                <div className="space-y-1">
                  {unstartedConnections.map((connection) => (
                    <button
                      key={connection._id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
                      onClick={() => handleStartDirect(connection._id)}
                    >
                      <Avatar image={connection.image} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">
                          {connection.firstName} {connection.lastName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {connection.additionalDetails?.department || connection.college}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-[#efeae2]">
          {selectedThread ? (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    image={selectedThread.otherParticipant?.image}
                    label={selectedThread.title}
                    type={selectedIsGroup ? "group" : "direct"}
                  />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black text-slate-950">{selectedThread.title}</h2>
                    <p className="truncate text-sm text-slate-500">{selectedSubtitle}</p>
                  </div>
                </div>
                {messageStatusByThreadId[selectedThread._id] === "loading" && (
                  <span className="loading loading-spinner loading-sm text-emerald-600" />
                )}
              </header>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-5">
                {messages.map((message) => {
                  const isMine = isOwnMessage(message, user);
                  return (
                    <div
                      key={message._id}
                      className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex max-w-[86%] items-end gap-2 sm:max-w-[72%] ${isMine ? "flex-row-reverse" : ""}`}>
                        {!isMine && (
                          <Avatar
                            className="h-8 w-8"
                            image={message.sender?.image}
                            label={getSenderName(message.sender)}
                          />
                        )}
                        <div
                          className={`rounded-2xl px-3 py-2 shadow-sm ${
                            isMine
                              ? "rounded-br-sm bg-emerald-600 text-white"
                              : "rounded-bl-sm bg-white text-slate-900"
                          }`}
                        >
                          {!isMine && selectedIsGroup && (
                            <p className="mb-1 text-xs font-black text-emerald-700">
                              {getSenderName(message.sender)}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                          <p className={`mt-1 text-right text-[11px] ${isMine ? "text-emerald-50" : "text-slate-400"}`}>
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <div className="flex h-full items-center justify-center p-6 text-center">
                    <p className="rounded-xl bg-white/80 px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm">
                      No messages yet.
                    </p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form className="border-t border-slate-200 bg-slate-50 px-3 py-3 sm:px-4" onSubmit={handleSend}>
                <div className="flex items-end gap-2">
                  <textarea
                    className="textarea textarea-bordered max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-white text-sm"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleDraftKeyDown}
                    placeholder="Type a message"
                    maxLength={1000}
                  />
                  <button
                    className="btn btn-circle bg-emerald-600 text-white hover:bg-emerald-700"
                    type="submit"
                    aria-label="Send message"
                    disabled={!draft.trim() || sendStatus === "loading"}
                  >
                    {sendStatus === "loading" ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <FiSend aria-hidden="true" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div className="max-w-sm rounded-2xl bg-white/80 p-6 shadow-sm">
                <FiMessageCircle className="mx-auto text-4xl text-emerald-600" aria-hidden="true" />
                <h2 className="mt-3 text-2xl font-black text-slate-950">Select a chat</h2>
                <p className="mt-2 text-sm text-slate-500">Start with a direct message or your department group.</p>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default ChatPage;

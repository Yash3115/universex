const mongoose = require("mongoose");
const ChatMessage = require("../models/chatMessageSchema");
const ChatThread = require("../models/chatThreadSchema");
const Connection = require("../models/connectionSchema");
const User = require("../models/userSchema");

const USER_SELECT = "firstName lastName email image college role active additionalDetails";
const MESSAGE_POPULATE = { path: "sender", select: "firstName lastName image role" };
const THREAD_POPULATE = {
  path: "participants",
  select: USER_SELECT,
  populate: { path: "additionalDetails", select: "department" },
};

const buildPairKey = (firstUserId, secondUserId) => [String(firstUserId), String(secondUserId)].sort().join(":");

const normalizeDepartment = (department) => String(department || "").trim();

const normalizeId = (value) => String(value?._id || value?.id || value || "");

const getViewerWithProfile = (viewerId) =>
  User.findById(viewerId).select(USER_SELECT).populate("additionalDetails", "department");

const getAcceptedConnection = async (firstUserId, secondUserId) => {
  const pairKey = buildPairKey(firstUserId, secondUserId);
  return Connection.findOne({
    status: "accepted",
    $or: [
      { pairKey },
      { requester: firstUserId, recipient: secondUserId },
      { requester: secondUserId, recipient: firstUserId },
    ],
  });
};

const serializeThread = (thread, viewerId) => {
  const data = thread.toObject ? thread.toObject() : thread;
  const otherParticipant = data.type === "direct"
    ? (data.participants || []).find((participant) => String(participant._id || participant) !== String(viewerId))
    : null;

  return {
    ...data,
    title: data.type === "department"
      ? `${data.department} Department`
      : `${otherParticipant?.firstName || "Student"} ${otherParticipant?.lastName || ""}`.trim(),
    otherParticipant,
  };
};

const serializeMessage = (message, viewerId) => {
  const data = message.toObject ? message.toObject() : message;
  const senderId = normalizeId(data.sender);
  const viewerIdString = normalizeId(viewerId);

  return {
    ...data,
    senderId,
    isOwn: Boolean(senderId && viewerIdString && senderId === viewerIdString),
  };
};

const canAccessThread = async (thread, viewer) => {
  if (!thread || !viewer) return false;

  if (thread.type === "direct") {
    const participants = thread.participants || [];
    const isParticipant = participants.some((participant) => String(participant?._id || participant) === String(viewer._id));
    const otherParticipant = participants.find((participant) => String(participant?._id || participant) !== String(viewer._id));
    if (!isParticipant || !otherParticipant) return false;
    return Boolean(await getAcceptedConnection(viewer._id, otherParticipant?._id || otherParticipant));
  }

  const viewerDepartment = normalizeDepartment(viewer.additionalDetails?.department);
  return thread.type === "department" && viewerDepartment && normalizeDepartment(thread.department) === viewerDepartment;
};

exports.getThreads = async (req, res) => {
  try {
    if (req.user.role !== "Student") {
      return res.status(403).json({ success: false, message: "Chat is available for students" });
    }

    const viewer = await getViewerWithProfile(req.user.id);
    const department = normalizeDepartment(viewer?.additionalDetails?.department);
    const query = {
      $or: [
        { type: "direct", participants: req.user.id },
        ...(department ? [{ type: "department", department }] : []),
      ],
    };

    let threads = await ChatThread.find(query).populate(THREAD_POPULATE).sort({ lastMessageAt: -1, updatedAt: -1 });

    let departmentThread = null;
    if (department && !threads.some((thread) => thread.type === "department" && normalizeDepartment(thread.department) === department)) {
      departmentThread = await ChatThread.findOneAndUpdate(
        { type: "department", department },
        { type: "department", department, participants: [] },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).populate(THREAD_POPULATE);
      threads = [departmentThread, ...threads];
    }

    const acceptedConnections = await Connection.find({
      status: "accepted",
      $or: [{ requester: req.user.id }, { recipient: req.user.id }],
    })
      .populate({ path: "requester", select: USER_SELECT, populate: { path: "additionalDetails", select: "department" } })
      .populate({ path: "recipient", select: USER_SELECT, populate: { path: "additionalDetails", select: "department" } })
      .sort({ updatedAt: -1 });

    const connections = acceptedConnections
      .map((connection) => {
        const requesterId = String(connection.requester?._id || connection.requester);
        return requesterId === String(req.user.id) ? connection.recipient : connection.requester;
      })
      .filter((student) => student?.role === "Student");

    return res.status(200).json({
      success: true,
      threads: threads.map((thread) => serializeThread(thread, req.user.id)),
      connections,
      department,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load chats", error: error.message });
  }
};

exports.startDirectThread = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (req.user.role !== "Student") {
      return res.status(403).json({ success: false, message: "Chat is available for students" });
    }
    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId) || String(recipientId) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: "Valid connected student is required" });
    }

    const [recipient, connection] = await Promise.all([
      User.findById(recipientId).select(USER_SELECT).populate("additionalDetails", "department"),
      getAcceptedConnection(req.user.id, recipientId),
    ]);

    if (!recipient || recipient.role !== "Student" || recipient.active === false) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    if (!connection) {
      return res.status(403).json({ success: false, message: "You can chat only with accepted connections" });
    }

    const pairKey = buildPairKey(req.user.id, recipientId);
    const thread = await ChatThread.findOneAndUpdate(
      { type: "direct", pairKey },
      { type: "direct", pairKey, participants: [req.user.id, recipientId] },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate(THREAD_POPULATE);

    return res.status(200).json({ success: true, thread: serializeThread(thread, req.user.id) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to start chat", error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.threadId)) {
      return res.status(400).json({ success: false, message: "Valid thread id is required" });
    }

    const [thread, viewer] = await Promise.all([
      ChatThread.findById(req.params.threadId).populate(THREAD_POPULATE),
      getViewerWithProfile(req.user.id),
    ]);

    if (!(await canAccessThread(thread, viewer))) {
      return res.status(403).json({ success: false, message: "You cannot access this chat" });
    }

    const messages = await ChatMessage.find({ thread: thread._id })
      .populate(MESSAGE_POPULATE)
      .sort({ createdAt: 1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      thread: serializeThread(thread, req.user.id),
      messages: messages.map((message) => serializeMessage(message, req.user.id)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load messages", error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.threadId)) {
      return res.status(400).json({ success: false, message: "Valid thread id is required" });
    }

    const content = String(req.body.content || "").trim();
    if (!content) return res.status(400).json({ success: false, message: "Message cannot be empty" });

    const [thread, viewer] = await Promise.all([
      ChatThread.findById(req.params.threadId).populate(THREAD_POPULATE),
      getViewerWithProfile(req.user.id),
    ]);

    if (!(await canAccessThread(thread, viewer))) {
      return res.status(403).json({ success: false, message: "You cannot access this chat" });
    }

    let message = await ChatMessage.create({
      thread: thread._id,
      sender: req.user.id,
      content: content.slice(0, 1000),
    });
    message = await message.populate(MESSAGE_POPULATE);

    thread.lastMessage = message.content;
    thread.lastMessageAt = message.createdAt;
    await thread.save();

    return res.status(201).json({
      success: true,
      message: serializeMessage(message, req.user.id),
      thread: serializeThread(thread, req.user.id),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to send message", error: error.message });
  }
};

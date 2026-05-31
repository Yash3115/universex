const mongoose = require("mongoose");
const Connection = require("../models/connectionSchema");
const { ConnectionInteraction, INTERACTION_STATUSES, INTERACTION_TYPES } = require("../models/connectionInteractionSchema");
const User = require("../models/userSchema");
const { createNotification } = require("../utils/notificationService");

const USER_SELECT = "firstName lastName image college additionalDetails active";
const populateOptions = [
  { path: "sender", select: USER_SELECT, populate: { path: "additionalDetails" } },
  { path: "recipient", select: USER_SELECT, populate: { path: "additionalDetails" } },
  { path: "connection", select: "requester recipient status acceptedAt" },
];

const buildPairKey = (firstUserId, secondUserId) => [String(firstUserId), String(secondUserId)].sort().join(":");

const interactionLabels = {
  StudyInvite: "study invite",
  ProjectInvite: "project invite",
  HelpRequest: "help request",
};

const getAcceptedConnection = async (userId, recipientId) => {
  const pairKey = buildPairKey(userId, recipientId);
  return Connection.findOne({
    status: "accepted",
    $or: [
      { pairKey },
      { requester: userId, recipient: recipientId },
      { requester: recipientId, recipient: userId },
    ],
  });
};

const populateInteraction = (interaction) => interaction.populate(populateOptions);

const sanitizePayload = (type, payload = {}) => {
  const safePayload = {};
  if (type === "StudyInvite") {
    safePayload.topic = String(payload.topic || "").trim().slice(0, 120);
    safePayload.mode = ["online", "offline", "hybrid"].includes(payload.mode) ? payload.mode : "online";
    safePayload.scheduledAt = payload.scheduledAt ? new Date(payload.scheduledAt) : null;
  }
  if (type === "ProjectInvite") {
    safePayload.skills = Array.isArray(payload.skills)
      ? payload.skills.map((skill) => String(skill).trim()).filter(Boolean).slice(0, 8)
      : String(payload.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 8);
    safePayload.deadline = payload.deadline ? new Date(payload.deadline) : null;
  }
  if (type === "HelpRequest") {
    safePayload.category = String(payload.category || "general").trim().slice(0, 60);
    safePayload.urgency = ["low", "normal", "high"].includes(payload.urgency) ? payload.urgency : "normal";
  }
  return safePayload;
};

exports.createInteraction = async (req, res) => {
  try {
    const { recipientId, type, title, message = "", payload = {} } = req.body;
    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId) || String(recipientId) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: "Valid connected recipient is required" });
    }
    if (!INTERACTION_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: "Valid interaction type is required" });
    }
    const normalizedTitle = String(title || "").trim();
    if (!normalizedTitle) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const [recipient, connection, pendingDuplicateCount] = await Promise.all([
      User.findById(recipientId).select("_id active"),
      getAcceptedConnection(req.user.id, recipientId),
      ConnectionInteraction.countDocuments({ sender: req.user.id, recipient: recipientId, status: "pending" }),
    ]);

    if (!recipient || recipient.active === false) {
      return res.status(404).json({ success: false, message: "Recipient not found" });
    }
    if (!connection) {
      return res.status(403).json({ success: false, message: "You can interact only with accepted connections" });
    }
    if (pendingDuplicateCount >= 5) {
      return res.status(429).json({ success: false, message: "Too many pending interactions with this student" });
    }

    let interaction = await ConnectionInteraction.create({
      connection: connection._id,
      sender: req.user.id,
      recipient: recipientId,
      type,
      title: normalizedTitle,
      message: String(message || "").trim(),
      payload: sanitizePayload(type, payload),
      readBy: [req.user.id],
    });
    interaction = await populateInteraction(interaction);

    await createNotification({
      recipient: recipientId,
      sender: req.user.id,
      connection: connection._id,
      interaction: interaction._id,
      type: "Interaction",
      message: `sent you a ${interactionLabels[type] || "connection interaction"}`,
    });

    res.status(201).json({ success: true, message: "Interaction sent", interaction });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create interaction", error: error.message });
  }
};

exports.getInteractions = async (req, res) => {
  try {
    const { box = "incoming", status, type, search = "", page = 1, limit = 30 } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 50);
    const query = {};

    if (box === "sent") query.sender = req.user.id;
    else if (box === "all") query.$or = [{ sender: req.user.id }, { recipient: req.user.id }];
    else query.recipient = req.user.id;

    if (INTERACTION_STATUSES.includes(status)) query.status = status;
    if (INTERACTION_TYPES.includes(type)) query.type = type;
    if (search.trim()) {
      query.$and = [
        ...(query.$and || []),
        { $or: [{ title: new RegExp(search.trim(), "i") }, { message: new RegExp(search.trim(), "i") }] },
      ];
    }

    const [interactions, total] = await Promise.all([
      ConnectionInteraction.find(query)
        .populate(populateOptions)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      ConnectionInteraction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      interactions,
      pagination: { currentPage: pageNumber, totalPages: Math.ceil(total / pageSize), total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch interactions", error: error.message });
  }
};

exports.getInteractionSummary = async (req, res) => {
  try {
    const [pendingIncoming, pendingSent, accepted, completed] = await Promise.all([
      ConnectionInteraction.countDocuments({ recipient: req.user.id, status: "pending" }),
      ConnectionInteraction.countDocuments({ sender: req.user.id, status: "pending" }),
      ConnectionInteraction.countDocuments({ $or: [{ sender: req.user.id }, { recipient: req.user.id }], status: "accepted" }),
      ConnectionInteraction.countDocuments({ $or: [{ sender: req.user.id }, { recipient: req.user.id }], status: "completed" }),
    ]);

    res.status(200).json({ success: true, summary: { pendingIncoming, pendingSent, accepted, completed } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch interaction summary", error: error.message });
  }
};

exports.updateInteractionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Valid interaction id is required" });
    }
    if (!INTERACTION_STATUSES.includes(status) || status === "pending") {
      return res.status(400).json({ success: false, message: "Valid next status is required" });
    }

    const interaction = await ConnectionInteraction.findOne({
      _id: id,
      $or: [{ sender: req.user.id }, { recipient: req.user.id }],
    });
    if (!interaction) return res.status(404).json({ success: false, message: "Interaction not found" });

    const isSender = String(interaction.sender) === String(req.user.id);
    const isRecipient = String(interaction.recipient) === String(req.user.id);
    const previousStatus = interaction.status;

    const canAcceptOrDecline = previousStatus === "pending" && isRecipient && ["accepted", "declined"].includes(status);
    const canCancel = previousStatus === "pending" && isSender && status === "cancelled";
    const canComplete = previousStatus === "accepted" && status === "completed";

    if (!canAcceptOrDecline && !canCancel && !canComplete) {
      return res.status(403).json({ success: false, message: "You cannot apply this status change" });
    }

    const notificationRecipient = isSender ? interaction.recipient : interaction.sender;
    interaction.status = status;
    interaction.readBy = Array.from(new Set([...(interaction.readBy || []).map(String), String(req.user.id)]));
    await interaction.save();
    await populateInteraction(interaction);

    const statusMessage = status === "accepted"
      ? "accepted your interaction"
      : status === "declined"
        ? "declined your interaction"
        : status === "completed"
          ? "marked an interaction as completed"
          : "cancelled an interaction";

    await createNotification({
      recipient: notificationRecipient,
      sender: req.user.id,
      connection: interaction.connection?._id || interaction.connection,
      interaction: interaction._id,
      type: "Interaction",
      message: statusMessage,
    });

    res.status(200).json({ success: true, message: "Interaction updated", interaction });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update interaction", error: error.message });
  }
};
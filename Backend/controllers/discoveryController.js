const Connection = require("../models/connectionSchema");
const User = require("../models/userSchema");
const { createNotification } = require("../utils/notificationService");
const mongoose = require("mongoose");

const buildConnectionState = (connection, currentUserId) => {
  if (!connection) {
    return { id: null, status: "none", direction: "none" };
  }

  const requesterId = String(connection.requester?._id || connection.requester);
  const recipientId = String(connection.recipient?._id || connection.recipient);
  const currentId = String(currentUserId);

  if (connection.status === "accepted") {
    return { id: connection._id, status: "accepted", direction: "connected" };
  }

  if (connection.status === "rejected") {
    return {
      id: connection._id,
      status: "rejected",
      direction: requesterId === currentId ? "rejected" : "none",
    };
  }

  return {
    id: connection._id,
    status: connection.status,
    direction: requesterId === currentId && recipientId !== currentId ? "outgoing" : "incoming",
  };
};

exports.searchStudents = async (req, res) => {
  try {
    const { search = "", department, college, graduationYear, page = 1, limit = 24 } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 50);

    const filter = { _id: { $ne: req.user.id } };
    if (college) filter.college = college;
    if (search.trim()) {
      filter.$or = [
        { firstName: new RegExp(search.trim(), "i") },
        { lastName: new RegExp(search.trim(), "i") },
        { email: new RegExp(search.trim(), "i") },
      ];
    }

    let query = User.find(filter)
      .select("firstName lastName email image college additionalDetails")
      .populate("additionalDetails")
      .sort({ firstName: 1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    let students = await query;
    students = students.filter((student) => {
      const details = student.additionalDetails || {};
      if (details.visibility === "private") return false;
      if (department && details.department !== department) return false;
      if (graduationYear && String(details.graduationYear) !== String(graduationYear)) return false;
      return true;
    });

    const connections = await Connection.find({
      $or: [
        { requester: req.user.id },
        { recipient: req.user.id },
      ],
    });

    const connectionMap = new Map();
    connections.forEach((connection) => {
      const otherId = String(connection.requester) === String(req.user.id) ? String(connection.recipient) : String(connection.requester);
      connectionMap.set(otherId, buildConnectionState(connection, req.user.id));
    });

    res.status(200).json({
      success: true,
      students: students.map((student) => ({
        ...student.toObject(),
        connection: connectionMap.get(String(student._id)) || buildConnectionState(null, req.user.id),
        connectionStatus: connectionMap.get(String(student._id))?.status || "none",
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to search students", error: error.message });
  }
};

exports.requestConnection = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId || String(recipientId) === String(req.user.id) || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ success: false, message: "Valid recipient is required" });
    }

    const recipient = await User.findById(recipientId).select("_id active");
    if (!recipient || recipient.active === false) {
      return res.status(404).json({ success: false, message: "Recipient not found" });
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { requester: req.user.id, recipient: recipientId },
        { requester: recipientId, recipient: req.user.id },
      ],
    });

    if (existingConnection) {
      if (existingConnection.status === "accepted") {
        return res.status(200).json({
          success: true,
          message: "You are already connected",
          connection: existingConnection,
          connectionState: buildConnectionState(existingConnection, req.user.id),
        });
      }

      const incomingRequest = String(existingConnection.recipient) === String(req.user.id);
      if (existingConnection.status === "pending" && incomingRequest) {
        existingConnection.status = "accepted";
        await existingConnection.save();
        await createNotification({
          recipient: existingConnection.requester,
          sender: req.user.id,
          connection: existingConnection._id,
          type: "Connection",
          message: "accepted your connection request",
        });

        return res.status(200).json({
          success: true,
          message: "Connection request accepted",
          connection: existingConnection,
          connectionState: buildConnectionState(existingConnection, req.user.id),
        });
      }

      if (existingConnection.status === "pending") {
        return res.status(200).json({
          success: true,
          message: "Connection request already sent",
          connection: existingConnection,
          connectionState: buildConnectionState(existingConnection, req.user.id),
        });
      }

      existingConnection.requester = req.user.id;
      existingConnection.recipient = recipientId;
      existingConnection.status = "pending";
      await existingConnection.save();

      await createNotification({
        recipient: recipientId,
        sender: req.user.id,
        connection: existingConnection._id,
        type: "Connection",
        message: "sent you a connection request",
      });

      return res.status(200).json({
        success: true,
        message: "Connection request sent",
        connection: existingConnection,
        connectionState: buildConnectionState(existingConnection, req.user.id),
      });
    }

    const connection = await Connection.findOneAndUpdate(
      { requester: req.user.id, recipient: recipientId },
      { status: "pending" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await createNotification({
      recipient: recipientId,
      sender: req.user.id,
      connection: connection._id,
      type: "Connection",
      message: "sent you a connection request",
    });

    res.status(200).json({
      success: true,
      message: "Connection request sent",
      connection,
      connectionState: buildConnectionState(connection, req.user.id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to request connection", error: error.message });
  }
};

exports.respondToConnection = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid status is required" });
    }

    const connection = await Connection.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id, status: "pending" },
      { status },
      { new: true }
    );

    if (!connection) return res.status(404).json({ success: false, message: "Connection request not found" });

    await createNotification({
      recipient: connection.requester,
      sender: req.user.id,
      connection: connection._id,
      type: "Connection",
      message: status === "accepted" ? "accepted your connection request" : "declined your connection request",
    });

    res.status(200).json({
      success: true,
      message: status === "accepted" ? "Connection request accepted" : "Connection request ignored",
      connection,
      connectionState: buildConnectionState(connection, req.user.id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update connection", error: error.message });
  }
};
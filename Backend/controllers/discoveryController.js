const Connection = require("../models/connectionSchema");
const User = require("../models/userSchema");
const { createNotification } = require("../utils/notificationService");

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
      connectionMap.set(otherId, connection.status);
    });

    res.status(200).json({
      success: true,
      students: students.map((student) => ({
        ...student.toObject(),
        connectionStatus: connectionMap.get(String(student._id)) || "none",
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to search students", error: error.message });
  }
};

exports.requestConnection = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId || recipientId === req.user.id) {
      return res.status(400).json({ success: false, message: "Valid recipient is required" });
    }

    const connection = await Connection.findOneAndUpdate(
      { requester: req.user.id, recipient: recipientId },
      { status: "pending" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await createNotification({
      recipient: recipientId,
      sender: req.user.id,
      type: "System",
      message: "sent you a connection request",
    });

    res.status(200).json({ success: true, message: "Connection request sent", connection });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to request connection", error: error.message });
  }
};

exports.respondToConnection = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["accepted", "pending"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid status is required" });
    }

    const connection = await Connection.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { status },
      { new: true }
    );

    if (!connection) return res.status(404).json({ success: false, message: "Connection request not found" });
    res.status(200).json({ success: true, message: "Connection updated", connection });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update connection", error: error.message });
  }
};
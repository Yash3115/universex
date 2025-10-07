const Notification = require("../models/notificationSchema");

// Get Notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.userId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mark Notification as Read
exports.markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ message: "Notification marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
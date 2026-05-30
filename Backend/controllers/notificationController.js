const Notification = require("../models/notificationSchema");

// Get Notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mark Notification as Read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Notification marked as read", notification });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
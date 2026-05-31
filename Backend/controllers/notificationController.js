const Notification = require("../models/notificationSchema");

// Get Notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .populate("sender", "firstName lastName image")
            .populate("connection", "requester recipient status")
            .populate("interaction", "type title status")
            .populate("course", "title code")
            .populate("material", "title type")
            .populate("post", "content")
            .populate("job", "title companyName")
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification.countDocuments({ recipient: req.user.id, read: false });
        res.json({ success: true, notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
        res.json({ success: true, message: "Notifications marked as read" });
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
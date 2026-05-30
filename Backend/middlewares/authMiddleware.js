const User = require('../models/userSchema');
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const bearerToken = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : null;
        const token = req.cookies?.token || bearerToken;

        if (!token) {
            return res.status(401).json({ message: "User is not authenticated" });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT secret is not configured" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");

        if (!req.user) {
            return res.status(401).json({ message: "User not found" });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

const isAuthorised = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "User is not authorized to perform this action" });
        }
        next();
    };
};

module.exports = { authMiddleware, isAuthorised };
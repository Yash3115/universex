const User = require('../models/userSchema');
const jwt = require('jsonwebtoken');
const { isDemoScope } = require("../utils/dataScope");

const getRequestToken = (req) => {
    const bearerToken = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null;
    return isDemoScope() ? req.cookies?.demoToken || bearerToken : req.cookies?.token || bearerToken;
};

const attachUserFromToken = async (req, token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT secret is not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (isDemoScope() !== Boolean(decoded.isDemo)) {
        throw new Error("Token scope mismatch");
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
        throw new Error("User not found");
    }

    user.isDemo = Boolean(decoded.isDemo);
    user.demoExpiresAt = decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null;
    req.user = user;
};

const authMiddleware = async (req, res, next) => {
    try {
        const token = getRequestToken(req);

        if (!token) {
            return res.status(401).json({ message: "User is not authenticated" });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT secret is not configured" });
        }

        await attachUserFromToken(req, token);
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

const optionalAuthMiddleware = async (req, _res, next) => {
    const token = getRequestToken(req);
    if (!token) return next();

    try {
        await attachUserFromToken(req, token);
    } catch (_error) {
        req.user = undefined;
    }

    return next();
};

const isAuthorised = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "User is not authorized to perform this action" });
        }
        next();
    };
};

const requireNonDemo = (req, res, next) => {
    if (req.user?.isDemo) {
        return res.status(403).json({
            success: false,
            message: "Demo mode cannot perform this action",
        });
    }
    next();
};

const hasUploadedFiles = (files = {}) =>
    Object.values(files || {}).some((file) => (Array.isArray(file) ? file.length > 0 : Boolean(file)));

const blockDemoFileUploads = (req, res, next) => {
    if (req.user?.isDemo && hasUploadedFiles(req.files)) {
        return res.status(403).json({
            success: false,
            message: "File uploads are disabled in demo mode",
        });
    }
    next();
};

module.exports = { authMiddleware, optionalAuthMiddleware, isAuthorised, requireNonDemo, blockDemoFileUploads };

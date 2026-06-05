const jwt = require("jsonwebtoken");
const AccessRequest = require("../models/accessRequestSchema");
const User = require("../models/userSchema");
const {
  getAuthCookieOptions,
  getClearAuthCookieOptions,
} = require("../utils/cookieOptions");

const DEMO_STUDENT_EMAIL = process.env.DEMO_STUDENT_EMAIL || "student@universex.demo";
const DEMO_SESSION_SECONDS = Number(process.env.DEMO_SESSION_SECONDS) || 60 * 60 * 2;
const DEMO_RESET_NOTE =
  process.env.DEMO_RESET_NOTE || "Sample data resets regularly and demo activity is disposable.";

const parseBoolean = (value) => String(value).toLowerCase() === "true";

const isDemoDatabaseRuntime = () =>
  parseBoolean(process.env.USE_DEMO_DB) ||
  parseBoolean(process.env.DEMO_DATABASE_ENABLED) ||
  process.env.NODE_ENV === "demo";

const serializeDemoUser = (user, expiresAt) => {
  const data = user.toObject ? user.toObject() : user;
  return {
    ...data,
    isDemo: true,
    demoExpiresAt: expiresAt,
  };
};

exports.startDemo = async (_req, res) => {
  try {
    if (!isDemoDatabaseRuntime() && !parseBoolean(process.env.ALLOW_DEMO_ON_PRIMARY_DB)) {
      return res.status(503).json({
        success: false,
        message:
          "Demo mode is not configured for this API. Set USE_DEMO_DB=true with MONGODB_DEMO_URL, or explicitly allow primary-DB demo testing.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "JWT secret is not configured" });
    }

    const demoUser = await User.findOne({ email: DEMO_STUDENT_EMAIL.toLowerCase(), active: { $ne: false } })
      .select("-password")
      .populate("additionalDetails")
      .populate("facultyProfile");

    if (!demoUser) {
      return res.status(404).json({
        success: false,
        message: "Demo user is not seeded. Run npm run seed:demo in the backend.",
      });
    }

    const token = jwt.sign(
      { email: demoUser.email, id: demoUser._id, role: demoUser.role, isDemo: true },
      process.env.JWT_SECRET,
      { expiresIn: DEMO_SESSION_SECONDS }
    );
    const expiresAt = new Date(Date.now() + DEMO_SESSION_SECONDS * 1000).toISOString();

    res.cookie("token", token, {
      ...getAuthCookieOptions(),
      maxAge: DEMO_SESSION_SECONDS * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Demo mode started",
      isDemo: true,
      role: demoUser.role,
      expiresAt,
      resetNote: DEMO_RESET_NOTE,
      user: serializeDemoUser(demoUser, expiresAt),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to start demo", error: error.message });
  }
};

exports.getDemoStatus = (req, res) =>
  res.status(200).json({
    success: true,
    isDemo: Boolean(req.user?.isDemo),
    role: req.user?.role || null,
    expiresAt: req.user?.demoExpiresAt || null,
    resetNote: DEMO_RESET_NOTE,
  });

exports.exitDemo = (_req, res) => {
  res.clearCookie("token", getClearAuthCookieOptions());
  return res.status(200).json({ success: true, message: "Demo mode ended" });
};

exports.createAccessRequest = async (req, res) => {
  try {
    const { name, email, college, role = "Student", message = "" } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedRole = role === "Professor" ? "Professor" : "Student";

    if (!name?.trim() || !normalizedEmail || !college?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and college are required",
      });
    }

    const accessRequest = await AccessRequest.create({
      name: name.trim(),
      email: normalizedEmail,
      college: college.trim(),
      role: normalizedRole,
      message,
      source: req.user?.isDemo ? "demo" : "public",
    });

    return res.status(201).json({
      success: true,
      message: "Access request submitted",
      accessRequest,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to submit access request", error: error.message });
  }
};

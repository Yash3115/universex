require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

// Import Database Connection
const connectDB = require("./config/db");

const errorMiddleware = require("./middlewares/errorMiddleware.js");

// Import Routes
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const reactionRoutes = require("./routes/reactionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes.js");
const jobRoutes = require("./routes/jobRoutes.js");
const transactionRoutes = require("./routes/transactionRoutes.js");
const academicRoutes = require("./routes/academicRoutes.js");
const discoveryRoutes = require("./routes/discoveryRoutes.js");
const interactionRoutes = require("./routes/interactionRoutes.js");
const courseRoutes = require("./routes/courseRoutes.js");
const assignmentRoutes = require("./routes/assignmentRoutes.js");
const resultRoutes = require("./routes/resultRoutes.js");
const { cloudinaryConnect } = require("./config/cloudinary");

// Initialize Express App
const app = express();

// Connect to Database
connectDB();

//cloudinary connection
cloudinaryConnect();

app.use(helmet());

// Middleware Setup
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: process.env.FILE_UPLOAD_TEMP_DIR || "/tmp/",
    limits: { fileSize: Number(process.env.MAX_FILE_SIZE_BYTES) || 5 * 1024 * 1024 },
    abortOnLimit: true,
  })
);
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || "1mb" }));

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,https://universex-project.vercel.app")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsoptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
};
app.use(cors(corsoptions));
app.options("*", cors(corsoptions));

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser());

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts. Please try again later." },
});

// Test Route (No Authentication Required)
app.get("/api/test", (req, res) => {
  res.send("Hello, API is working!");
});

// API Routes
app.use("/api/users/login", authRateLimiter);
app.use("/api/users/sendotp", authRateLimiter);
app.use("/api/users/signup", authRateLimiter);
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/reactions", reactionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/jobposting", jobRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/results", resultRoutes);
// Global Error Handling Middleware
app.use(errorMiddleware);

// Root Route
app.get("/", (req, res) => {
  res.send("Welcome to the Campus Connection API 🚀");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

const mongoose = require("mongoose");

const parseBoolean = (value) => String(value).toLowerCase() === "true";

const shouldUseDemoDatabase = () =>
  parseBoolean(process.env.USE_DEMO_DB) ||
  parseBoolean(process.env.DEMO_DATABASE_ENABLED) ||
  process.env.NODE_ENV === "demo";

const connectDB = async () => {
  try {
    const useDemoDb = shouldUseDemoDatabase();
    const mongoUrl = useDemoDb ? process.env.MONGODB_DEMO_URL : process.env.MONGODB_URL;

    if (!mongoUrl) {
      throw new Error(useDemoDb ? "MONGODB_DEMO_URL is not configured" : "MONGODB_URL is not configured");
    }

    await mongoose.connect(mongoUrl);
    console.log(`MongoDB connected successfully${useDemoDb ? " (demo database)" : ""}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

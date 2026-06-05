const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

process.env.USE_DEMO_DB = "true";

const { seedDummyUsers } = require("./seedDummyUsers");

const resetDemoData = async () => {
  const demoUrl = process.env.MONGODB_DEMO_URL;
  const primaryUrl = process.env.MONGODB_URL;

  if (!demoUrl) {
    throw new Error("MONGODB_DEMO_URL is not configured. Refusing to reset demo data.");
  }

  if (primaryUrl && demoUrl === primaryUrl && process.env.ALLOW_DEMO_RESET_ON_PRIMARY !== "true") {
    throw new Error(
      "MONGODB_DEMO_URL matches MONGODB_URL. Refusing to drop the primary database without ALLOW_DEMO_RESET_ON_PRIMARY=true."
    );
  }

  await mongoose.connect(demoUrl);
  await mongoose.connection.dropDatabase();
  console.log("Demo database dropped.");
  await mongoose.disconnect();

  await seedDummyUsers();
};

resetDemoData()
  .catch((error) => {
    console.error("Failed to reset demo data:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

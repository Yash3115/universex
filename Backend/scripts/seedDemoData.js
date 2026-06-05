process.env.USE_DEMO_DB = "true";

const mongoose = require("mongoose");
const { seedDummyUsers } = require("./seedDummyUsers");

seedDummyUsers()
  .catch((error) => {
    console.error("Failed to seed demo data:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

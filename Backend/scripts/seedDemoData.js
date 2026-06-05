const mongoose = require("mongoose");
const { DATA_SCOPES } = require("../utils/dataScope");
const { seedDummyUsers } = require("./seedDummyUsers");

seedDummyUsers({ dataScope: DATA_SCOPES.DEMO })
  .catch((error) => {
    console.error("Failed to seed demo data:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

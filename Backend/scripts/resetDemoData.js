const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { DATA_SCOPES } = require("../utils/dataScope");
const { seedDummyUsers } = require("./seedDummyUsers");

const DEMO_DELETE_FILTER = Object.freeze({ dataScope: DATA_SCOPES.DEMO });

const resetDemoData = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is not configured. Refusing to reset demo data.");
  }

  await mongoose.connect(process.env.MONGODB_URL);

  const collections = Object.values(mongoose.connection.collections);
  for (const collection of collections) {
    const filter = { ...DEMO_DELETE_FILTER };
    if (filter.dataScope !== DATA_SCOPES.DEMO || Object.keys(filter).length !== 1) {
      throw new Error(`Unsafe demo reset filter for ${collection.collectionName}`);
    }

    const result = await collection.deleteMany(filter);
    if (result.deletedCount) {
      console.log(`Deleted ${result.deletedCount} demo records from ${collection.collectionName}`);
    }
  }

  await mongoose.disconnect();
  await seedDummyUsers({ dataScope: DATA_SCOPES.DEMO });
};

resetDemoData()
  .catch((error) => {
    console.error("Failed to reset demo data:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

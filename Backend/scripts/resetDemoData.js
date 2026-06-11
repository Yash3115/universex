const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { DATA_SCOPES } = require("../utils/dataScope");
const { seedDummyUsers } = require("./seedDummyUsers");

const DEMO_DELETE_FILTER = Object.freeze({ dataScope: DATA_SCOPES.DEMO });
const isDryRun = process.argv.includes("--dry-run");

const getDemoDeleteFilter = () => ({ ...DEMO_DELETE_FILTER });

const assertSafeDemoFilter = (filter, collectionName) => {
  if (filter.dataScope !== DATA_SCOPES.DEMO || Object.keys(filter).length !== 1) {
    throw new Error(`Unsafe demo reset filter for ${collectionName}`);
  }
};

const listCollections = async () => {
  const collections = await mongoose.connection.db.listCollections({}, { nameOnly: false }).toArray();
  return collections
    .filter((collection) => !collection.type || collection.type === "collection")
    .filter((collection) => !collection.name.startsWith("system."))
    .sort((first, second) => first.name.localeCompare(second.name));
};

const resetDemoData = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is not configured. Refusing to reset demo data.");
  }

  await mongoose.connect(process.env.MONGODB_URL);

  const collections = await listCollections();
  let totalDemoRecords = 0;

  for (const collectionInfo of collections) {
    const collection = mongoose.connection.db.collection(collectionInfo.name);
    const filter = getDemoDeleteFilter();
    assertSafeDemoFilter(filter, collectionInfo.name);

    const demoRecordCount = await collection.countDocuments(filter);
    totalDemoRecords += demoRecordCount;

    if (isDryRun) {
      console.log(`[dry-run] ${collectionInfo.name}: ${demoRecordCount} demo records`);
      continue;
    }

    if (demoRecordCount) {
      const result = await collection.deleteMany(filter);
      console.log(`Deleted ${result.deletedCount} demo records from ${collectionInfo.name}`);
    }
  }

  if (isDryRun) {
    console.log(`[dry-run] Total demo records found: ${totalDemoRecords}`);
    return;
  }

  console.log(`Deleted ${totalDemoRecords} demo records in total.`);
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

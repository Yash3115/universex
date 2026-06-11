const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { DATA_SCOPES } = require("../utils/dataScope");

const OLD_JOIN_CODE_INDEX_NAME = "joinCode_1";
const SCOPED_JOIN_CODE_INDEX_NAME = "dataScope_1_joinCode_1";
const JOIN_CODE_PARTIAL_FILTER = { joinCode: { $type: "string", $gt: "" } };
const isDryRun = process.argv.includes("--dry-run");

const legacyScopeFilter = {
  $or: [
    { dataScope: { $exists: false } },
    { dataScope: null },
  ],
};

const getDuplicateJoinCodes = (courses) =>
  courses.aggregate([
    { $match: JOIN_CODE_PARTIAL_FILTER },
    {
      $project: {
        joinCode: 1,
        dataScope: { $ifNull: ["$dataScope", DATA_SCOPES.PRODUCTION] },
      },
    },
    {
      $group: {
        _id: { dataScope: "$dataScope", joinCode: "$joinCode" },
        count: { $sum: 1 },
        ids: { $push: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { "_id.dataScope": 1, "_id.joinCode": 1 } },
  ]).toArray();

const migrateDemoIndexes = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is not configured. Refusing to migrate demo indexes.");
  }

  await mongoose.connect(process.env.MONGODB_URL);

  const courses = mongoose.connection.db.collection("courses");
  const legacyScopeCount = await courses.countDocuments(legacyScopeFilter);
  const indexes = await courses.indexes();
  const oldJoinCodeIndex = indexes.find((index) => index.name === OLD_JOIN_CODE_INDEX_NAME);
  const scopedJoinCodeIndex = indexes.find((index) => index.name === SCOPED_JOIN_CODE_INDEX_NAME);
  const duplicateJoinCodes = await getDuplicateJoinCodes(courses);

  console.log(`${legacyScopeCount} course records need production dataScope backfill.`);
  console.log(`${oldJoinCodeIndex ? "Found" : "Did not find"} old ${OLD_JOIN_CODE_INDEX_NAME} index.`);
  console.log(`${scopedJoinCodeIndex ? "Found" : "Did not find"} scoped ${SCOPED_JOIN_CODE_INDEX_NAME} index.`);

  if (duplicateJoinCodes.length) {
    console.log("Duplicate join codes must be resolved before creating the scoped unique index:");
    duplicateJoinCodes.forEach((item) => {
      console.log(`- ${item._id.dataScope} / ${item._id.joinCode}: ${item.count} records`);
    });
    throw new Error("Duplicate course join codes found.");
  }

  if (isDryRun) {
    console.log("[dry-run] No indexes or records were changed.");
    return;
  }

  if (legacyScopeCount) {
    const backfillResult = await courses.updateMany(legacyScopeFilter, {
      $set: { dataScope: DATA_SCOPES.PRODUCTION },
    });
    console.log(`Backfilled ${backfillResult.modifiedCount} course records with production dataScope.`);
  }

  if (oldJoinCodeIndex) {
    await courses.dropIndex(OLD_JOIN_CODE_INDEX_NAME);
    console.log(`Dropped ${OLD_JOIN_CODE_INDEX_NAME}.`);
  }

  if (!scopedJoinCodeIndex) {
    await courses.createIndex(
      { dataScope: 1, joinCode: 1 },
      {
        name: SCOPED_JOIN_CODE_INDEX_NAME,
        unique: true,
        partialFilterExpression: JOIN_CODE_PARTIAL_FILTER,
      }
    );
    console.log(`Created ${SCOPED_JOIN_CODE_INDEX_NAME}.`);
  }
};

migrateDemoIndexes()
  .catch((error) => {
    console.error("Failed to migrate demo indexes:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

const mongoose = require("mongoose");
const { DATA_SCOPES, getDataScope, isDataScopeBypassed } = require("./dataScope");

const SCOPED_VALUES = Object.values(DATA_SCOPES);

const getScopeCondition = () => {
  const dataScope = getDataScope();
  if (dataScope === DATA_SCOPES.DEMO) return { dataScope: DATA_SCOPES.DEMO };

  return {
    $or: [
      { dataScope: DATA_SCOPES.PRODUCTION },
      { dataScope: { $exists: false } },
      { dataScope: null },
    ],
  };
};

const scopedFilter = (filter = {}) => {
  const scopeCondition = getScopeCondition();
  if (!filter || Object.keys(filter).length === 0) return scopeCondition;
  return { $and: [filter, scopeCondition] };
};

const stampUpdateScope = (query) => {
  const update = query.getUpdate?.();
  if (!update || Array.isArray(update)) return;

  const currentScope = getDataScope();
  const nextUpdate = { ...update };

  if (nextUpdate.dataScope === undefined && nextUpdate.$set?.dataScope === undefined && nextUpdate.$setOnInsert?.dataScope === undefined) {
    nextUpdate.$setOnInsert = {
      ...(nextUpdate.$setOnInsert || {}),
      dataScope: currentScope,
    };
  }

  query.setUpdate(nextUpdate);
};

const dataScopePlugin = (schema) => {
  if (schema.options?._id === false || schema.options?.disableDataScope === true) {
    return;
  }

  if (!schema.path("dataScope")) {
    schema.add({
      dataScope: {
        type: String,
        enum: SCOPED_VALUES,
        default: DATA_SCOPES.PRODUCTION,
        index: true,
      },
    });
  }

  schema.pre("validate", function setDocumentDataScope(next) {
    if (!this.dataScope) this.dataScope = getDataScope();
    next();
  });

  schema.pre("insertMany", function setInsertedDataScope(next, docs = []) {
    docs.forEach((doc) => {
      if (!doc.dataScope) doc.dataScope = getDataScope();
    });
    next();
  });

  const scopedQueryOps = [
    "count",
    "countDocuments",
    "deleteMany",
    "deleteOne",
    "distinct",
    "find",
    "findOne",
    "findOneAndDelete",
    "findOneAndRemove",
    "findOneAndReplace",
    "findOneAndUpdate",
    "replaceOne",
    "updateMany",
    "updateOne",
  ];

  scopedQueryOps.forEach((operation) => {
    schema.pre(operation, function applyQueryDataScope(next) {
      if (isDataScopeBypassed()) return next();

      this.setQuery(scopedFilter(this.getFilter()));
      stampUpdateScope(this);
      return next();
    });
  });

  schema.pre("aggregate", function applyAggregateDataScope(next) {
    if (isDataScopeBypassed()) return next();

    const pipeline = this.pipeline();
    const firstStage = pipeline[0] || {};
    const insertAt = firstStage.$geoNear || firstStage.$search ? 1 : 0;
    pipeline.splice(insertAt, 0, { $match: getScopeCondition() });
    return next();
  });
};

if (!mongoose.__universexDataScopePluginRegistered) {
  mongoose.plugin(dataScopePlugin);
  mongoose.__universexDataScopePluginRegistered = true;
}

module.exports = dataScopePlugin;

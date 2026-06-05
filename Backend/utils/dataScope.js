const { AsyncLocalStorage } = require("async_hooks");

const DATA_SCOPES = {
  PRODUCTION: "production",
  DEMO: "demo",
};

const scopeStorage = new AsyncLocalStorage();

const normalizeScope = (scope) => (scope === DATA_SCOPES.DEMO ? DATA_SCOPES.DEMO : DATA_SCOPES.PRODUCTION);

const getScopeState = () => scopeStorage.getStore() || { dataScope: DATA_SCOPES.PRODUCTION, bypassDataScope: false };

const getDataScope = () => normalizeScope(getScopeState().dataScope);

const isDemoScope = () => getDataScope() === DATA_SCOPES.DEMO;

const isDataScopeBypassed = () => Boolean(getScopeState().bypassDataScope);

const runWithDataScope = (dataScope, callback) =>
  scopeStorage.run({ ...getScopeState(), dataScope: normalizeScope(dataScope), bypassDataScope: false }, callback);

const runWithoutDataScope = (callback) =>
  scopeStorage.run({ ...getScopeState(), bypassDataScope: true }, callback);

const resolveRequestDataScope = (req) => {
  const headerValue = String(req.headers["x-universex-mode"] || "").toLowerCase();
  if (req.path?.startsWith("/api/demo") || headerValue === "demo") return DATA_SCOPES.DEMO;
  return DATA_SCOPES.PRODUCTION;
};

const dataScopeMiddleware = (req, _res, next) => {
  runWithDataScope(resolveRequestDataScope(req), next);
};

module.exports = {
  DATA_SCOPES,
  dataScopeMiddleware,
  getDataScope,
  isDataScopeBypassed,
  isDemoScope,
  runWithDataScope,
  runWithoutDataScope,
};

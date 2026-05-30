const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const parseBoolean = (value) => String(value).toLowerCase() === "true";

const useSecureCookies =
  parseBoolean(process.env.COOKIE_SECURE) || process.env.NODE_ENV === "production";

const sameSite =
  process.env.COOKIE_SAME_SITE || (useSecureCookies ? "None" : "Lax");

const authCookieMaxAge = Number(process.env.AUTH_COOKIE_MAX_AGE_MS) || ONE_DAY_MS;

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: useSecureCookies,
  sameSite,
  maxAge: authCookieMaxAge,
});

const getClearAuthCookieOptions = () => ({
  httpOnly: true,
  secure: useSecureCookies,
  sameSite,
});

module.exports = {
  getAuthCookieOptions,
  getClearAuthCookieOptions,
};
const DEFAULT_AUTH_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_LOGIN_MAX_REQUESTS = 10;
const DEFAULT_REGISTER_MAX_REQUESTS = 5;

function getPositiveIntegerEnv(name: string, fallback: number) {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getAuthRateLimitWindowMs() {
  return getPositiveIntegerEnv(
    "AUTH_RATE_LIMIT_WINDOW_MS",
    DEFAULT_AUTH_WINDOW_MS,
  );
}

export function getLoginRateLimitMaxRequests() {
  return getPositiveIntegerEnv(
    "LOGIN_RATE_LIMIT_MAX_REQUESTS",
    DEFAULT_LOGIN_MAX_REQUESTS,
  );
}

export function getRegisterRateLimitMaxRequests() {
  return getPositiveIntegerEnv(
    "REGISTER_RATE_LIMIT_MAX_REQUESTS",
    DEFAULT_REGISTER_MAX_REQUESTS,
  );
}

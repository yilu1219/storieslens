const crypto = require("crypto");

function enabled() {
  return String(process.env.BETA_RATE_LIMIT_ENABLED || "").toLowerCase() === "true";
}

function requestAddress(request) {
  return String(request.headers["cf-connecting-ip"] || request.socket?.remoteAddress || "unknown").slice(0, 160);
}

function createRequestRateLimiter() {
  const windows = new Map();

  function consume(request, response, { bucket, limit, windowMs, sendJson }) {
    if (!enabled()) return true;
    const secret = process.env.RATE_LIMIT_SECRET;
    if (!secret) {
      sendJson(response, 503, { error: "The beta safety gate is not fully configured." });
      return false;
    }
    const identity = crypto.createHmac("sha256", secret).update(`${bucket}:${requestAddress(request)}`).digest("hex");
    const now = Date.now();
    const current = windows.get(identity);
    const record = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    record.count += 1;
    windows.set(identity, record);
    response.setHeader("RateLimit-Limit", String(limit));
    response.setHeader("RateLimit-Remaining", String(Math.max(0, limit - record.count)));
    response.setHeader("RateLimit-Reset", String(Math.ceil(record.resetAt / 1000)));
    if (record.count <= limit) return true;
    response.setHeader("Retry-After", String(Math.max(1, Math.ceil((record.resetAt - now) / 1000))));
    sendJson(response, 429, { error: "Too many attempts. Please wait and try again." });
    return false;
  }

  function prune() {
    const now = Date.now();
    for (const [key, value] of windows) if (value.resetAt <= now) windows.delete(key);
  }

  const timer = setInterval(prune, 10 * 60 * 1000);
  timer.unref?.();
  return { consume };
}

module.exports = { createRequestRateLimiter };

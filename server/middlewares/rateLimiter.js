// In-memory IP rate limiter — no external package needed
// Stores: { ip -> [timestamps] }
const store = new Map();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3;

const rateLimiter = (req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const timestamps = (store.get(ip) || []).filter(t => now - t < WINDOW_MS);
  timestamps.push(now);
  store.set(ip, timestamps);

  if (timestamps.length > MAX_REQUESTS) {
    const retryAfter = Math.ceil((timestamps[0] + WINDOW_MS - now) / 60000);
    return res.status(429).json({
      code: 'RATE_LIMITED',
      message: `Too many complaints submitted. Please wait ${retryAfter} minute(s) before trying again.`,
    });
  }

  next();
};

// Clean up old entries every 30 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of store.entries()) {
    const fresh = timestamps.filter(t => now - t < WINDOW_MS);
    fresh.length === 0 ? store.delete(ip) : store.set(ip, fresh);
  }
}, 30 * 60 * 1000);

module.exports = rateLimiter;

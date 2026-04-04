const requestStore = new Map();

const cleanExpiredEntries = (now) => {
  for (const [key, value] of requestStore.entries()) {
    if (value.expiresAt <= now) {
      requestStore.delete(key);
    }
  }
};

export const createRateLimiter = ({ windowMs, maxRequests, keyPrefix, message }) => {
  return (req, res, next) => {
    const now = Date.now();
    cleanExpiredEntries(now);

    const key = `${keyPrefix}:${req.ip}`;
    const entry = requestStore.get(key);

    if (!entry || entry.expiresAt <= now) {
      requestStore.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({ message });
    }

    entry.count += 1;
    requestStore.set(key, entry);
    next();
  };
};

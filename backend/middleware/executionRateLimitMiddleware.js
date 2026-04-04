const executionStore = new Map();

const clearExpired = (now) => {
  for (const [key, value] of executionStore.entries()) {
    if (value.expiresAt <= now) {
      executionStore.delete(key);
    }
  }
};

export const createExecutionRateLimiter = ({
  windowMs,
  maxRequests,
  message,
}) => {
  return (req, res, next) => {
    const now = Date.now();
    clearExpired(now);

    const key = `${req.user?._id || req.ip}:${req.path}`;
    const entry = executionStore.get(key);

    if (!entry || entry.expiresAt <= now) {
      executionStore.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({ message });
    }

    entry.count += 1;
    executionStore.set(key, entry);
    next();
  };
};

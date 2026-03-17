const executionWindows = new Map();

export const consumeExecutionQuota = ({
  key,
  now = Date.now(),
  windowMs,
  maxRuns,
}) => {
  const quotaKey = String(key || 'anonymous');
  const current = executionWindows.get(quotaKey);

  if (!current || now - current.windowStart >= windowMs) {
    executionWindows.set(quotaKey, {
      count: 1,
      windowStart: now,
    });
    return { allowed: true, retryAfterMs: 0, remaining: maxRuns - 1 };
  }

  if (current.count >= maxRuns) {
    return {
      allowed: false,
      retryAfterMs: Math.max(0, windowMs - (now - current.windowStart)),
      remaining: 0,
    };
  }

  current.count += 1;
  executionWindows.set(quotaKey, current);

  return { allowed: true, retryAfterMs: 0, remaining: maxRuns - current.count };
};
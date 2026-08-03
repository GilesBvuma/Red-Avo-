const rateLimitMap = new Map();

export function rateLimit(ip, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return true; // allowed
  }
  if (entry.count >= limit) return false; // blocked
  rateLimitMap.set(ip, { ...entry, count: entry.count + 1 });
  return true;
}

const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, max = 30, windowMs = 60_000) {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return { allowed: true, remaining: max - 1 } }
  current.count += 1
  return { allowed: current.count <= max, remaining: Math.max(0, max - current.count), retryAfter: Math.ceil((current.resetAt - now) / 1000) }
}

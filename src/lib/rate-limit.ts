// Módulo profundo de Rate Limiting em memória (Janela Deslizante por IP e Bucket)
// shortcut: armazenamento em memória local por instância, migrar para Cloudflare KV/Upstash quando escalar horizontalmente

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const MAX_RATE_LIMIT_KEYS = 5000;
const rateLimitStore = new Map<string, number[]>();

export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

export function extractClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) return cfIp.trim().slice(0, 64);

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded && forwarded.trim()) {
    return forwarded.split(",")[0].trim().slice(0, 64);
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim().slice(0, 64);

  return "127.0.0.1";
}

export function checkRateLimit(
  bucket: string,
  key: string,
  limit: number,
  windowMs: number,
  nowMs: number = Date.now()
): RateLimitResult {
  const safeKey = key.slice(0, 64);
  const compositeKey = `${bucket}:${safeKey}`;
  const cutoff = nowMs - windowMs;

  if (rateLimitStore.size > MAX_RATE_LIMIT_KEYS) {
    for (const [k, timestamps] of Array.from(rateLimitStore.entries())) {
      const lastTs = timestamps[timestamps.length - 1] ?? 0;
      if (lastTs <= cutoff) {
        rateLimitStore.delete(k);
      }
    }
    if (rateLimitStore.size > MAX_RATE_LIMIT_KEYS) {
      const oldestKey = rateLimitStore.keys().next().value;
      if (oldestKey) {
        rateLimitStore.delete(oldestKey);
      }
    }
  }

  const existing = rateLimitStore.get(compositeKey) || [];
  const validTimestamps = existing.filter((ts) => ts > cutoff);

  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - nowMs) / 1000)
    );
    rateLimitStore.set(compositeKey, validTimestamps);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  validTimestamps.push(nowMs);
  rateLimitStore.set(compositeKey, validTimestamps);

  return {
    allowed: true,
    remaining: Math.max(0, limit - validTimestamps.length),
    retryAfterSeconds: 0,
  };
}

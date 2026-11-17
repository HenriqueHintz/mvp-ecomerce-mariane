import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { db, coupons, rateLimits, type Coupon } from "@/db";
import { withSqliteWriteLock } from "@/lib/orders";
import {
  type CouponType,
  type CouponRecord,
  type CouponEvaluationResult,
  resolveCouponMinSubtotalCents,
  normalizeCouponCode,
  evaluateCoupon,
  getCouponErrorMessage,
} from "@/lib/coupon-rules";

export {
  type CouponType,
  type CouponRecord,
  type CouponEvaluationResult,
  resolveCouponMinSubtotalCents,
  normalizeCouponCode,
  evaluateCoupon,
  getCouponErrorMessage,
};

const COUPON_RATE_LIMIT_MAX = 10;
const COUPON_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos

/**
 * Busca um cupom pelo código normalizado no banco via Drizzle.
 */
export async function findCouponByCode(
  rawCode: string | null | undefined
): Promise<Coupon | null> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return null;

  const rows = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Rate limit persistido no banco (`rate_limits`): máximo de 10 validações
 * de cupom não vazio por IP a cada 10 minutos.
 */
export async function checkCouponQuoteRateLimit(
  ip: string,
  nowMs: number = Date.now()
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const ipHash = crypto
    .createHash("sha256")
    .update(`coupon_rl:${(ip || "unknown").trim()}`, "utf8")
    .digest("hex")
    .slice(0, 32);
  const key = `coupon_quote:${ipHash}`;

  return withSqliteWriteLock(async () => {
    const existing = await db
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .limit(1);

    if (
      existing.length === 0 ||
      nowMs - existing[0].windowStart >= COUPON_RATE_LIMIT_WINDOW_MS
    ) {
      await db
        .insert(rateLimits)
        .values({
          key,
          count: 1,
          windowStart: nowMs,
        })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: {
            count: 1,
            windowStart: nowMs,
          },
        });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const row = existing[0];
    if (row.count >= COUPON_RATE_LIMIT_MAX) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(
          (row.windowStart + COUPON_RATE_LIMIT_WINDOW_MS - nowMs) / 1000
        )
      );
      return { allowed: false, retryAfterSeconds };
    }

    await db
      .update(rateLimits)
      .set({ count: sql`${rateLimits.count} + 1` })
      .where(eq(rateLimits.key, key));

    return { allowed: true, retryAfterSeconds: 0 };
  });
}

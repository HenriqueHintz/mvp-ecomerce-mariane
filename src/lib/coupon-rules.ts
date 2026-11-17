export type CouponType = "percent" | "fixed" | "free_shipping";

export interface CouponRecord {
  id?: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotalCents?: number;
  min_subtotal_cents?: number;
  startsAt?: number | Date | null;
  starts_at?: number | Date | null;
  expiresAt?: number | Date | null;
  expires_at?: number | Date | null;
  maxUses?: number | null;
  max_uses?: number | null;
  usedCount?: number;
  used_count?: number;
  active?: number | boolean;
  createdAt?: string | null;
  created_at?: string | null;
}

export type CouponEvaluationResult =
  | { ok: true; discountCents: number; freeShipping: boolean }
  | { ok: false; reason: "invalid" | "min_subtotal" };

function formatCentsAsBrl(cents: number): string {
  const safeReais = Number.isFinite(cents) ? cents / 100 : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(safeReais);
}

function toEpochMs(val: number | Date | null | undefined): number | null {
  if (val == null) return null;
  if (val instanceof Date) return val.getTime();
  if (!Number.isFinite(val)) return null;
  return val > 0 && val < 1e11 ? val * 1000 : val;
}

export function resolveCouponMinSubtotalCents(c: CouponRecord): number {
  const raw =
    c.minSubtotalCents !== undefined
      ? c.minSubtotalCents
      : c.min_subtotal_cents ?? 0;
  return Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
}

/**
 * Remove espaços nas pontas, converte para maiúsculas e valida `/^[A-Z0-9-]{3,30}$/`.
 */
export function normalizeCouponCode(
  raw: string | null | undefined
): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,30}$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Avalia um cupom de forma pura em centavos inteiros.
 */
export function evaluateCoupon(
  c: CouponRecord,
  subtotalCents: number,
  now: Date = new Date()
): CouponEvaluationResult {
  const rawActive = c.active !== undefined ? c.active : 1;
  const isActive = rawActive === true || rawActive === 1;
  if (!isActive) {
    return { ok: false, reason: "invalid" };
  }

  const nowMs = now.getTime();
  const startsAtMs = toEpochMs(
    c.startsAt !== undefined ? c.startsAt : c.starts_at
  );
  const expiresAtMs = toEpochMs(
    c.expiresAt !== undefined ? c.expiresAt : c.expires_at
  );

  if (startsAtMs !== null && nowMs < startsAtMs) {
    return { ok: false, reason: "invalid" };
  }
  if (expiresAtMs !== null && nowMs > expiresAtMs) {
    return { ok: false, reason: "invalid" };
  }

  const maxUses =
    c.maxUses !== undefined ? c.maxUses : c.max_uses ?? null;
  const usedCount =
    c.usedCount !== undefined ? c.usedCount : c.used_count ?? 0;

  if (maxUses !== null && usedCount >= maxUses) {
    return { ok: false, reason: "invalid" };
  }

  if (
    c.type !== "percent" &&
    c.type !== "fixed" &&
    c.type !== "free_shipping"
  ) {
    return { ok: false, reason: "invalid" };
  }

  if (
    c.type === "percent" &&
    (!Number.isFinite(c.value) || c.value < 1 || c.value > 100)
  ) {
    return { ok: false, reason: "invalid" };
  }

  if (c.type === "fixed" && (!Number.isFinite(c.value) || c.value <= 0)) {
    return { ok: false, reason: "invalid" };
  }

  const minSubtotalCents = resolveCouponMinSubtotalCents(c);
  if (subtotalCents < minSubtotalCents) {
    return { ok: false, reason: "min_subtotal" };
  }

  const safeSubtotal = Math.max(0, Math.round(subtotalCents));

  if (c.type === "percent") {
    const discountCents = Math.min(
      safeSubtotal,
      Math.max(0, Math.round((safeSubtotal * c.value) / 100))
    );
    return { ok: true, discountCents, freeShipping: false };
  }

  if (c.type === "fixed") {
    const discountCents = Math.min(Math.round(c.value), safeSubtotal);
    return { ok: true, discountCents, freeShipping: false };
  }

  return { ok: true, discountCents: 0, freeShipping: true };
}

/**
 * Mensagens padronizadas para a cliente (apenas estas duas).
 */
export function getCouponErrorMessage(
  reason: "invalid" | "min_subtotal",
  minSubtotalCents = 0
): string {
  if (reason === "min_subtotal") {
    return `Este cupom vale para compras a partir de ${formatCentsAsBrl(
      minSubtotalCents
    )}`;
  }
  return "Cupom inválido ou expirado";
}

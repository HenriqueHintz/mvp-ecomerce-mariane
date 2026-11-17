import { COMMERCE_CONFIG } from "@/config/commerce";
import { SHIPPING_ZONES } from "@/config/shipping";
import { getShippingZone } from "@/lib/shipping";
import {
  type CouponRecord,
  evaluateCoupon,
  getCouponErrorMessage,
  resolveCouponMinSubtotalCents,
} from "@/lib/coupon-rules";

export function toCents(reais: number): number {
  if (!Number.isFinite(reais)) return 0;
  return Math.round(reais * 100);
}

export function toReais(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  return cents / 100;
}

export function formatBRL(reais: number): string {
  const safe = Number.isFinite(reais) ? reais : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(safe);
}

export function formatBrl(cents: number): string {
  return formatBRL(toReais(cents));
}

export interface ItemPricingSource {
  priceCents: number;
  promoPriceCents?: number | null;
}

export function calculateItemPriceCents(item: ItemPricingSource): number {
  const price = Math.max(0, Math.round(item.priceCents));
  if (
    item.promoPriceCents != null &&
    Number.isFinite(item.promoPriceCents) &&
    item.promoPriceCents > 0 &&
    item.promoPriceCents < price
  ) {
    return Math.round(item.promoPriceCents);
  }
  return price;
}

export function calculateShippingCents(
  subtotalCents: number,
  deliveryMode: "entrega" | "retirada",
  cep: string | null = null
): number | null {
  if (deliveryMode === "retirada") {
    return 0;
  }
  if (subtotalCents >= COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS) {
    return 0;
  }
  if (!cep) {
    return null;
  }
  const zone = getShippingZone(cep);
  if (!zone) {
    return null;
  }
  return SHIPPING_ZONES[zone].priceCents;
}

export interface PixDiscountItem {
  unitPriceCents: number;
  quantity: number;
  pixDiscountPercent?: number | null;
}

export function calculatePixDiscountCents(items: PixDiscountItem[]): number {
  let totalDiscountCents = 0;
  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    if (qty <= 0) continue;
    const unitPrice = Math.max(0, Math.round(item.unitPriceCents));
    const percent =
      item.pixDiscountPercent != null &&
      Number.isFinite(item.pixDiscountPercent) &&
      item.pixDiscountPercent >= 0
        ? item.pixDiscountPercent
        : COMMERCE_CONFIG.DEFAULT_PIX_DISCOUNT_PERCENT;

    const lineTotal = unitPrice * qty;
    const lineDiscount = Math.round((lineTotal * percent) / 100);
    totalDiscountCents += lineDiscount;
  }
  return totalDiscountCents;
}

export interface PricingInputItem {
  productId: string;
  name: string;
  priceCents: number;
  promoPriceCents?: number | null;
  quantity: number;
  pixDiscountPercent?: number | null;
}

export interface PricingOrderInput {
  deliveryMode: "entrega" | "retirada";
  paymentMethod: "whatsapp" | "pix" | "cartao";
  items: PricingInputItem[];
  cep?: string | null;
  coupon?: CouponRecord | null;
  couponCodeInput?: string | null;
  now?: Date;
}

export interface ResolvedLineItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  pixDiscountCents: number;
}

export interface OrderPricingSummary {
  subtotalCents: number;
  shippingCents: number | null;
  shippingZoneLabel: string | null;
  shippingEtaDays: { min: number; max: number } | null;
  couponCode: string | null;
  couponDiscountCents: number;
  couponError: string | null;
  pixDiscountCents: number;
  discountCents: number;
  totalCents: number;
  freeShippingThresholdCents: number;
  freeShippingRemainingCents: number;
  items: ResolvedLineItem[];
}

export function calculateOrderPricing(
  input: PricingOrderInput
): OrderPricingSummary {
  let subtotalCents = 0;
  const resolvedItems: ResolvedLineItem[] = [];
  const itemPercents: number[] = [];

  // 1. Subtotal
  for (const item of input.items) {
    const qty = Math.max(1, Math.floor(item.quantity));
    const unitPriceCents = calculateItemPriceCents(item);
    const lineTotalCents = unitPriceCents * qty;
    subtotalCents += lineTotalCents;

    const percent =
      item.pixDiscountPercent != null &&
      Number.isFinite(item.pixDiscountPercent) &&
      item.pixDiscountPercent >= 0
        ? item.pixDiscountPercent
        : COMMERCE_CONFIG.DEFAULT_PIX_DISCOUNT_PERCENT;
    itemPercents.push(percent);

    const pixDiscountCents = calculatePixDiscountCents([
      {
        unitPriceCents,
        quantity: qty,
        pixDiscountPercent: item.pixDiscountPercent,
      },
    ]);

    resolvedItems.push({
      productId: item.productId,
      name: item.name,
      quantity: qty,
      unitPriceCents,
      lineTotalCents,
      pixDiscountCents,
    });
  }

  // 2. Cupom (incide só sobre o subtotal; free_shipping zera o frete)
  let couponCode: string | null = null;
  let couponDiscountCents = 0;
  let couponError: string | null = null;
  let couponFreeShipping = false;

  if (input.coupon) {
    const evalRes = evaluateCoupon(
      input.coupon,
      subtotalCents,
      input.now ?? new Date()
    );
    if (evalRes.ok) {
      couponCode = input.coupon.code.trim().toUpperCase();
      couponDiscountCents = evalRes.discountCents;
      couponFreeShipping = evalRes.freeShipping;
    } else {
      couponError = getCouponErrorMessage(
        evalRes.reason,
        resolveCouponMinSubtotalCents(input.coupon)
      );
    }
  } else if (
    input.couponCodeInput != null &&
    input.couponCodeInput.trim().length > 0
  ) {
    couponError = getCouponErrorMessage("invalid");
  }

  // 3. PIX de 5% sobre (subtotal - cupom), mantendo o percentual de cada produto proporcionalmente
  const discountedSubtotalCents = Math.max(
    0,
    subtotalCents - couponDiscountCents
  );

  let pixDiscountCents = 0;
  if (input.paymentMethod === "pix" && discountedSubtotalCents > 0) {
    if (couponDiscountCents === 0) {
      pixDiscountCents = resolvedItems.reduce(
        (acc, curr) => acc + curr.pixDiscountCents,
        0
      );
    } else if (subtotalCents > 0) {
      const weightedNumerator = resolvedItems.reduce(
        (acc, item, idx) => acc + item.lineTotalCents * itemPercents[idx],
        0
      );
      pixDiscountCents = Math.min(
        discountedSubtotalCents,
        Math.max(
          0,
          Math.round(
            (weightedNumerator * discountedSubtotalCents) /
              (subtotalCents * 100)
          )
        )
      );
    }
  }

  // 4. Frete e Região
  const zone =
    input.deliveryMode === "entrega" && input.cep
      ? getShippingZone(input.cep)
      : null;

  const shippingZoneLabel = zone ? SHIPPING_ZONES[zone].label : null;
  const shippingEtaDays = zone
    ? { min: SHIPPING_ZONES[zone].etaMin, max: SHIPPING_ZONES[zone].etaMax }
    : null;

  const baseShippingCents = calculateShippingCents(
    subtotalCents,
    input.deliveryMode,
    input.cep ?? null
  );

  const shippingCents = couponFreeShipping ? 0 : baseShippingCents;

  // 5. Total = max(0, subtotal - cupom - pix + (frete ?? 0))
  const discountCents = couponDiscountCents + pixDiscountCents;
  const totalCents = Math.max(
    0,
    subtotalCents -
      couponDiscountCents -
      pixDiscountCents +
      (shippingCents ?? 0)
  );

  const freeShippingThresholdCents =
    COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS;
  const freeShippingRemainingCents = Math.max(
    0,
    freeShippingThresholdCents - subtotalCents
  );

  return {
    subtotalCents,
    shippingCents,
    shippingZoneLabel,
    shippingEtaDays,
    couponCode,
    couponDiscountCents,
    couponError,
    pixDiscountCents,
    discountCents,
    totalCents,
    freeShippingThresholdCents,
    freeShippingRemainingCents,
    items: resolvedItems,
  };
}

import { COMMERCE_CONFIG } from "@/config/commerce";

export function toCents(reais: number): number {
  if (!Number.isFinite(reais)) return 0;
  return Math.round(reais * 100);
}

export function toReais(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  return cents / 100;
}

export function formatBrl(cents: number): string {
  const reais = toReais(cents);
  return reais.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
  deliveryMode: "entrega" | "retirada"
): number {
  if (deliveryMode === "retirada") {
    return 0;
  }
  if (subtotalCents >= COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS) {
    return 0;
  }
  return COMMERCE_CONFIG.SHIPPING_FIXED_CENTS;
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
      item.pixDiscountPercent != null && Number.isFinite(item.pixDiscountPercent) && item.pixDiscountPercent >= 0
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
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  freeShippingThresholdCents: number;
  freeShippingRemainingCents: number;
  items: ResolvedLineItem[];
}

export function calculateOrderPricing(input: PricingOrderInput): OrderPricingSummary {
  let subtotalCents = 0;
  const resolvedItems: ResolvedLineItem[] = [];

  for (const item of input.items) {
    const qty = Math.max(1, Math.floor(item.quantity));
    const unitPriceCents = calculateItemPriceCents(item);
    const lineTotalCents = unitPriceCents * qty;
    subtotalCents += lineTotalCents;

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

  const shippingCents = calculateShippingCents(subtotalCents, input.deliveryMode);

  const discountCents =
    input.paymentMethod === "pix"
      ? resolvedItems.reduce((acc, curr) => acc + curr.pixDiscountCents, 0)
      : 0;

  const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);

  const freeShippingThresholdCents = COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS;
  const freeShippingRemainingCents = Math.max(
    0,
    freeShippingThresholdCents - subtotalCents
  );

  return {
    subtotalCents,
    shippingCents,
    discountCents,
    totalCents,
    freeShippingThresholdCents,
    freeShippingRemainingCents,
    items: resolvedItems,
  };
}

import assert from "node:assert/strict";
import { getShippingZone, normalizeCep } from "../../src/lib/shipping";
import {
  evaluateCoupon,
  getCouponErrorMessage,
  normalizeCouponCode,
  type CouponRecord,
} from "../../src/lib/coupons";
import {
  calculateOrderPricing,
  calculateShippingCents,
} from "../../src/lib/pricing";

console.log("▶ Iniciando testes unitários de Frete por CEP e Cupons (shipping-coupons.test.ts)...");

// 1. Normalização e Regiões por CEP
assert.equal(normalizeCep("88505-300"), "88505300");
assert.equal(normalizeCep("123"), null);

assert.equal(getShippingZone("88505-300"), "lages");
assert.equal(getShippingZone("88020-302"), "sc");
assert.equal(getShippingZone("80010-000"), "sul");
assert.equal(getShippingZone("01310-100"), "sudeste");
assert.equal(getShippingZone("70040-010"), "centro_nordeste");
assert.equal(getShippingZone("69005-000"), "norte");
assert.equal(getShippingZone("123"), null);

// 1.1 Cálculo de frete em centavos
assert.equal(calculateShippingCents(10000, "retirada", null), 0);
assert.equal(calculateShippingCents(19900, "entrega", "69005-000"), 0);
assert.equal(calculateShippingCents(10000, "entrega", null), null);
assert.equal(calculateShippingCents(10000, "entrega", "123"), null);
assert.equal(calculateShippingCents(10000, "entrega", "88505-300"), 990);
assert.equal(calculateShippingCents(10000, "entrega", "88020-302"), 1690);
assert.equal(calculateShippingCents(10000, "entrega", "80010-000"), 2290);
assert.equal(calculateShippingCents(10000, "entrega", "01310-100"), 2690);
assert.equal(calculateShippingCents(10000, "entrega", "70040-010"), 3490);
assert.equal(calculateShippingCents(10000, "entrega", "69005-000"), 4290);

// 2. Normalização de código de cupom
assert.equal(normalizeCouponCode("  bemvinda10 "), "BEMVINDA10");
assert.equal(normalizeCouponCode("AB"), null);
assert.equal(normalizeCouponCode("CUPOM_INVALIDO!"), null);

const now = new Date("2026-11-17T12:00:00Z");

// 3. Cupom percent de 10% sobre 36756 -> 3676
const percent10Coupon: CouponRecord = {
  id: "c_percent10",
  code: "BEMVINDA10",
  type: "percent",
  value: 10,
  minSubtotalCents: 10000,
  active: 1,
};
const evalPercent = evaluateCoupon(percent10Coupon, 36756, now);
assert.deepEqual(evalPercent, {
  ok: true,
  discountCents: 3676,
  freeShipping: false,
});

// 4. Cupom fixed 50000 sobre 36756 -> 36756 (limitado ao subtotal)
const fixed50000Coupon: CouponRecord = {
  id: "c_fixed50k",
  code: "VALE500",
  type: "fixed",
  value: 50000,
  minSubtotalCents: 0,
  active: 1,
};
const evalFixed = evaluateCoupon(fixed50000Coupon, 36756, now);
assert.deepEqual(evalFixed, {
  ok: true,
  discountCents: 36756,
  freeShipping: false,
});

// 5. Cupom free_shipping zera o frete
const freeShipCoupon: CouponRecord = {
  id: "c_freeship",
  code: "FRETEGRATIS",
  type: "free_shipping",
  value: 0,
  minSubtotalCents: 5000,
  active: 1,
};
const evalFreeShip = evaluateCoupon(freeShipCoupon, 12000, now);
assert.deepEqual(evalFreeShip, {
  ok: true,
  discountCents: 0,
  freeShipping: true,
});

const pricingWithFreeShip = calculateOrderPricing({
  deliveryMode: "entrega",
  paymentMethod: "cartao",
  cep: "69005-000", // Norte seria 4290 sem cupom (< 19900)
  coupon: freeShipCoupon,
  now,
  items: [
    {
      productId: "p1",
      name: "Shampoo Profissional",
      priceCents: 12000,
      quantity: 1,
    },
  ],
});
assert.equal(pricingWithFreeShip.shippingCents, 0);
assert.equal(pricingWithFreeShip.totalCents, 12000);

// 6. Cupom expirado -> invalid
const expiredCoupon: CouponRecord = {
  id: "c_exp",
  code: "EXPIRADO",
  type: "percent",
  value: 15,
  expiresAt: now.getTime() - 1000,
  active: 1,
};
const evalExpired = evaluateCoupon(expiredCoupon, 20000, now);
assert.deepEqual(evalExpired, { ok: false, reason: "invalid" });
assert.equal(getCouponErrorMessage("invalid"), "Cupom inválido ou expirado");

// 7. Cupom com used_count === max_uses -> invalid
const exhaustedCoupon: CouponRecord = {
  id: "c_exhausted",
  code: "ESGOTADO1",
  type: "percent",
  value: 10,
  max_uses: 5,
  used_count: 5,
  active: 1,
};
const evalExhausted = evaluateCoupon(exhaustedCoupon, 20000, now);
assert.deepEqual(evalExhausted, { ok: false, reason: "invalid" });

// 8. Subtotal abaixo do mínimo -> min_subtotal
const evalBelowMin = evaluateCoupon(percent10Coupon, 9999, now);
assert.deepEqual(evalBelowMin, { ok: false, reason: "min_subtotal" });
assert.equal(
  getCouponErrorMessage("min_subtotal", 10000).replace(/\u00A0/g, " "),
  "Este cupom vale para compras a partir de R$ 100,00"
);

// 9. Cupom + PIX: o PIX incide sobre o valor já descontado (subtotal - cupom)
// Subtotal = 36756; Cupom 10% = 3676; Base PIX = 36756 - 3676 = 33080; PIX 5% = round(33080 * 0.05) = 1654
// Frete (>= 19900) = 0; Total = 36756 - 3676 - 1654 = 31426
const quoteCouponPix = calculateOrderPricing({
  deliveryMode: "entrega",
  paymentMethod: "pix",
  cep: "88020-302",
  coupon: percent10Coupon,
  now,
  items: [
    {
      productId: "p_kit",
      name: "Kit L'Oréal Absolut Repair",
      priceCents: 36756,
      quantity: 1,
      pixDiscountPercent: 5,
    },
  ],
});
assert.equal(quoteCouponPix.subtotalCents, 36756);
assert.equal(quoteCouponPix.couponDiscountCents, 3676);
assert.equal(quoteCouponPix.pixDiscountCents, 1654);
assert.equal(quoteCouponPix.discountCents, 3676 + 1654);
assert.equal(quoteCouponPix.shippingCents, 0);
assert.equal(quoteCouponPix.totalCents, 31426);

// 10. O total nunca fica negativo
const quoteNeverNegative = calculateOrderPricing({
  deliveryMode: "retirada",
  paymentMethod: "pix",
  coupon: fixed50000Coupon,
  now,
  items: [
    {
      productId: "p_small",
      name: "Ampola Capilar",
      priceCents: 36756,
      quantity: 1,
      pixDiscountPercent: 5,
    },
  ],
});
assert.equal(quoteNeverNegative.couponDiscountCents, 36756);
assert.equal(quoteNeverNegative.pixDiscountCents, 0);
assert.equal(quoteNeverNegative.totalCents, 0);
assert.ok(quoteNeverNegative.totalCents >= 0);

console.log("✔ Todos os testes de shipping-coupons.test.ts passaram com 100% de sucesso!");

import {
  toCents,
  toReais,
  formatBrl,
  calculateItemPriceCents,
  calculateShippingCents,
  calculatePixDiscountCents,
  calculateOrderPricing,
} from "../../src/lib/pricing";

console.log("▶ Iniciando testes do módulo de preços puro (pricing.ts)...");

// 1. Conversão de Moeda
if (toCents(199) !== 19900) throw new Error("toCents(199) falhou");
if (toCents(22.9) !== 2290) throw new Error("toCents(22.90) falhou");
if (toCents(0.01) !== 1) throw new Error("toCents(0.01) falhou");
if (toReais(19900) !== 199) throw new Error("toReais(19900) falhou");
if (toReais(2290) !== 22.9) throw new Error("toReais(2290) falhou");

const formatted = formatBrl(19900).replace(/\u00A0/g, " ");
if (formatted !== "R$ 199,00") {
  throw new Error(`formatBrl(19900) falhou: ${formatted}`);
}

// 2. Preço do Item (com ou sem preço promocional)
const normalPrice = calculateItemPriceCents({ priceCents: 10000, promoPriceCents: null });
if (normalPrice !== 10000) throw new Error("Preço sem promoção falhou");

const promoPrice = calculateItemPriceCents({ priceCents: 10000, promoPriceCents: 8500 });
if (promoPrice !== 8500) throw new Error("Preço promocional válido falhou");

const invalidPromo = calculateItemPriceCents({ priceCents: 10000, promoPriceCents: 12000 });
if (invalidPromo !== 10000) throw new Error("Preço promocional mais caro que o original deve ser ignorado");

// 3. Frete Fixo vs Frete Grátis
// 3.1 Retirada é sempre 0
if (calculateShippingCents(5000, "retirada") !== 0) throw new Error("Retirada deve ter frete 0");
if (calculateShippingCents(0, "retirada") !== 0) throw new Error("Retirada com subtotal 0 deve ter frete 0");

// 3.2 Entrega abaixo do threshold (R$ 199,00 = 19900 cents)
if (calculateShippingCents(19899, "entrega") !== 2290) {
  throw new Error("Entrega de R$ 198,99 deve ter frete R$ 22,90 (2290 cents)");
}

// 3.3 Entrega no valor EXATO do threshold (R$ 199,00)
if (calculateShippingCents(19900, "entrega") !== 0) {
  throw new Error("Entrega no valor exato de R$ 199,00 (19900 cents) DEVE ser frete grátis (0)");
}

// 3.4 Entrega acima do threshold
if (calculateShippingCents(25000, "entrega") !== 0) {
  throw new Error("Entrega acima do threshold DEVE ser frete grátis (0)");
}

// 4. Desconto PIX
// 4.1 Desconto padrão 5% em produto de R$ 100,00 -> R$ 5,00 (500 cents)
const discDefault = calculatePixDiscountCents([
  { unitPriceCents: 10000, quantity: 1, pixDiscountPercent: null },
]);
if (discDefault !== 500) throw new Error(`Desconto PIX padrão de 5% falhou: ${discDefault}`);

// 4.2 Desconto customizado 10%
const discCustom = calculatePixDiscountCents([
  { unitPriceCents: 10000, quantity: 2, pixDiscountPercent: 10 },
]);
if (discCustom !== 2000) throw new Error(`Desconto PIX customizado falhou: ${discCustom}`);

// 4.3 Arredondamento monetário de centavos: 5% sobre R$ 19,90 (1990 cents) -> 99.5 -> 100 cents (R$ 1,00)
const discRound = calculatePixDiscountCents([
  { unitPriceCents: 1990, quantity: 1, pixDiscountPercent: 5 },
]);
if (discRound !== 100) throw new Error(`Arredondamento centavos do PIX falhou: ${discRound}`);

// 5. Cotação Completa do Pedido (calculateOrderPricing)
const quotePix = calculateOrderPricing({
  deliveryMode: "entrega",
  paymentMethod: "pix",
  items: [
    {
      productId: "p1",
      name: "Produto 1",
      priceCents: 10000,
      promoPriceCents: 9000, // unitPriceCents = 9000
      quantity: 2,
      pixDiscountPercent: 5,
    },
  ],
});

// subtotal: 9000 * 2 = 18000
// shipping: 2290 (18000 < 19900)
// discount: 5% de 18000 = 900
// total: 18000 - 900 + 2290 = 19390
if (quotePix.subtotalCents !== 18000) throw new Error("Subtotal da cotação falhou");
if (quotePix.shippingCents !== 2290) throw new Error("Frete da cotação falhou");
if (quotePix.discountCents !== 900) throw new Error("Desconto da cotação falhou");
if (quotePix.totalCents !== 19390) throw new Error("Total da cotação falhou");
if (quotePix.freeShippingRemainingCents !== 1900) throw new Error("Faltante frete grátis falhou");

// 5.2 Cotação Cartão (sem desconto PIX) no valor exato do frete grátis
const quoteCard = calculateOrderPricing({
  deliveryMode: "entrega",
  paymentMethod: "cartao",
  items: [
    {
      productId: "p2",
      name: "Produto 2",
      priceCents: 19900,
      promoPriceCents: null,
      quantity: 1,
    },
  ],
});
if (quoteCard.subtotalCents !== 19900) throw new Error("Subtotal card falhou");
if (quoteCard.shippingCents !== 0) throw new Error("Frete grátis card falhou");
if (quoteCard.discountCents !== 0) throw new Error("Cartão não deve ter desconto PIX");
if (quoteCard.totalCents !== 19900) throw new Error("Total card falhou");
if (quoteCard.freeShippingRemainingCents !== 0) throw new Error("Faltante deve ser 0");

console.log("✔ Todos os testes do módulo de preços passaram com 100% de sucesso!");

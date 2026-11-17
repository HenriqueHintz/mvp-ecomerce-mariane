import crypto from "node:crypto";
import { describe, test, expect } from "./framework";
import {
  db,
  products,
  orders,
  orderItems,
  orderStatusHistory,
  coupons,
  rateLimits,
} from "@/db";
import { eq, inArray } from "drizzle-orm";
import {
  EMAIL_VERIFICATION_COOKIE_NAME,
  createVerifiedEmailToken,
} from "@/lib/email-verification";
import { formatBrl } from "@/lib/pricing";

describe("Tier 2 & Tier 4 - Cupom de Desconto e Frete por CEP no Checkout", () => {
  test(
    "2.8.1 [Coupons Quote] Aplicar BEMVINDA10 calcula 10% de desconto no resumo; código XYZ999 retorna 'Cupom inválido ou expirado'",
    async () => {
      const testProdId = `prod_coupon_quote_${Date.now()}`;
      const ip = `198.51.100.${Math.floor(100 + Math.random() * 50)}`;

      await db.insert(products).values({
        id: testProdId,
        name: "Kit Teste Cupom BEMVINDA10",
        slug: `kit-teste-cupom-${Date.now()}`,
        price: 150.0,
        priceCents: 15000,
        promoPrice: null,
        promoPriceCents: null,
        pixDiscountPercent: 5,
        stock: 10,
        createdAt: new Date().toISOString(),
      });

      try {
        const { POST: postCotacao } = await import(
          "@/app/api/checkout/cotacao/route"
        );

        // 1. Aplicar BEMVINDA10 sobre subtotal 15000 (>= 10000)
        const resValid = await postCotacao(
          new Request("http://localhost:3001/api/checkout/cotacao", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": ip,
            },
            body: JSON.stringify({
              deliveryMode: "entrega",
              paymentMethod: "cartao",
              cep: "88505-300",
              couponCode: "bemvinda10",
              items: [{ productId: testProdId, quantity: 1 }],
            }),
          })
        );
        expect(resValid.status).toBe(200);
        const validData = (await resValid.json()) as {
          success: boolean;
          quote: {
            subtotalCents: number;
            couponCode: string | null;
            couponDiscountCents: number;
            couponError: string | null;
            shippingCents: number | null;
            totalCents: number;
          };
        };
        expect(validData.success).toBe(true);
        expect(validData.quote.couponCode).toBe("BEMVINDA10");
        expect(validData.quote.couponDiscountCents).toBe(1500);
        expect(validData.quote.couponError).toBe(null);
        expect(validData.quote.shippingCents).toBe(990);
        expect(validData.quote.totalCents).toBe(15000 - 1500 + 990);

        // 2. Código XYZ999 mostra "Cupom inválido ou expirado"
        const resInvalid = await postCotacao(
          new Request("http://localhost:3001/api/checkout/cotacao", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": ip,
            },
            body: JSON.stringify({
              deliveryMode: "entrega",
              paymentMethod: "cartao",
              cep: "88505-300",
              couponCode: "XYZ999",
              items: [{ productId: testProdId, quantity: 1 }],
            }),
          })
        );
        expect(resInvalid.status).toBe(200);
        const invalidData = (await resInvalid.json()) as {
          success: boolean;
          quote: {
            couponCode: string | null;
            couponDiscountCents: number;
            couponError: string | null;
          };
        };
        expect(invalidData.quote.couponCode).toBe(null);
        expect(invalidData.quote.couponDiscountCents).toBe(0);
        expect(invalidData.quote.couponError).toBe("Cupom inválido ou expirado");
      } finally {
        await db.delete(products).where(eq(products.id, testProdId));
      }
    },
    { tier: 2, milestone: "M4", authoritativeSource: "Checkout Coupons & Shipping Spec #5 & #7" }
  );

  test(
    "2.8.2 [Shipping by CEP] CEP 88505-300 -> R$ 9,90; trocar para 01310-100 -> R$ 26,90; subtotal >= R$ 199 -> Grátis (0)",
    async () => {
      const prodUnderId = `prod_ship_under_${Date.now()}`;
      const prodOverId = `prod_ship_over_${Date.now()}`;
      const ip = `198.51.100.${Math.floor(151 + Math.random() * 40)}`;

      await db.insert(products).values([
        {
          id: prodUnderId,
          name: "Máscara Capilar 250g",
          slug: `mascara-ship-under-${Date.now()}`,
          price: 120.0,
          priceCents: 12000,
          stock: 10,
          createdAt: new Date().toISOString(),
        },
        {
          id: prodOverId,
          name: "Kit Cronograma Completo",
          slug: `kit-ship-over-${Date.now()}`,
          price: 210.0,
          priceCents: 21000,
          stock: 10,
          createdAt: new Date().toISOString(),
        },
      ]);

      try {
        const { POST: postCotacao } = await import(
          "@/app/api/checkout/cotacao/route"
        );

        // 1. CEP 88505-300 (Lages) -> R$ 9,90 (990 cents)
        const resLages = await postCotacao(
          new Request("http://localhost:3001/api/checkout/cotacao", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": ip,
            },
            body: JSON.stringify({
              deliveryMode: "entrega",
              paymentMethod: "whatsapp",
              cep: "88505-300",
              items: [{ productId: prodUnderId, quantity: 1 }],
            }),
          })
        );
        const lagesData = (await resLages.json()) as {
          quote: {
            shippingCents: number | null;
            shippingZoneLabel: string | null;
          };
        };
        expect(lagesData.quote.shippingCents).toBe(990);
        expect(
          formatBrl(lagesData.quote.shippingCents ?? 0).replace(/\u00A0/g, " ")
        ).toBe("R$ 9,90");
        expect(lagesData.quote.shippingZoneLabel).toBe("Entrega local — Lages");

        // 2. Trocar para 01310-100 (Sudeste) -> R$ 26,90 (2690 cents)
        const resSudeste = await postCotacao(
          new Request("http://localhost:3001/api/checkout/cotacao", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": ip,
            },
            body: JSON.stringify({
              deliveryMode: "entrega",
              paymentMethod: "whatsapp",
              cep: "01310-100",
              items: [{ productId: prodUnderId, quantity: 1 }],
            }),
          })
        );
        const sudesteData = (await resSudeste.json()) as {
          quote: {
            shippingCents: number | null;
            shippingZoneLabel: string | null;
          };
        };
        expect(sudesteData.quote.shippingCents).toBe(2690);
        expect(
          formatBrl(sudesteData.quote.shippingCents ?? 0).replace(
            /\u00A0/g,
            " "
          )
        ).toBe("R$ 26,90");
        expect(sudesteData.quote.shippingZoneLabel).toBe("Região Sudeste");

        // 3. Subtotal >= R$ 199 -> Frete Grátis (0)
        const resFree = await postCotacao(
          new Request("http://localhost:3001/api/checkout/cotacao", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": ip,
            },
            body: JSON.stringify({
              deliveryMode: "entrega",
              paymentMethod: "whatsapp",
              cep: "01310-100",
              items: [{ productId: prodOverId, quantity: 1 }],
            }),
          })
        );
        const freeData = (await resFree.json()) as {
          quote: { shippingCents: number | null };
        };
        expect(freeData.quote.shippingCents).toBe(0);
      } finally {
        await db
          .delete(products)
          .where(inArray(products.id, [prodUnderId, prodOverId]));
      }
    },
    { tier: 2, milestone: "M4", authoritativeSource: "Checkout Coupons & Shipping Spec #1-#3" }
  );

  test(
    "2.8.3 [Coupon DB Rate Limit] 11ª tentativa de validação de cupom em 10 minutos pelo mesmo IP retorna 429 Problem Details",
    async () => {
      const testProdId = `prod_rl_${Date.now()}`;
      const rlIp = `203.0.113.${Math.floor(10 + Math.random() * 200)}`;
      const ipHash = crypto
        .createHash("sha256")
        .update(`coupon_rl:${rlIp}`, "utf8")
        .digest("hex")
        .slice(0, 32);
      const rlKey = `coupon_quote:${ipHash}`;

      await db.insert(products).values({
        id: testProdId,
        name: "Produto Rate Limit Cupom",
        slug: `prod-rl-cupom-${Date.now()}`,
        price: 150.0,
        priceCents: 15000,
        stock: 10,
        createdAt: new Date().toISOString(),
      });

      try {
        await db.delete(rateLimits).where(eq(rateLimits.key, rlKey));
        const { POST: postCotacao } = await import(
          "@/app/api/checkout/cotacao/route"
        );

        for (let i = 1; i <= 10; i++) {
          const res = await postCotacao(
            new Request("http://localhost:3001/api/checkout/cotacao", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-forwarded-for": rlIp,
              },
              body: JSON.stringify({
                deliveryMode: "retirada",
                paymentMethod: "whatsapp",
                couponCode: `TENTATIVA${i}`,
                items: [{ productId: testProdId, quantity: 1 }],
              }),
            })
          );
          expect(res.status).toBe(200, `Tentativa #${i} deveria ser permitida (200)`);
        }

        // 11ª tentativa -> 429
        const res11 = await postCotacao(
          new Request("http://localhost:3001/api/checkout/cotacao", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": rlIp,
            },
            body: JSON.stringify({
              deliveryMode: "retirada",
              paymentMethod: "whatsapp",
              couponCode: "TENTATIVA11",
              items: [{ productId: testProdId, quantity: 1 }],
            }),
          })
        );
        expect(res11.status).toBe(429);
        const body11 = (await res11.json()) as { status: number; title: string };
        expect(body11.status).toBe(429);
      } finally {
        await db.delete(rateLimits).where(eq(rateLimits.key, rlKey));
        await db.delete(products).where(eq(products.id, testProdId));
      }
    },
    { tier: 2, milestone: "M4", authoritativeSource: "Checkout Coupons & Shipping Spec #7" }
  );

  test(
    "4.13 [Security & Concurrency] POST /api/pedidos ignora shippingCents/discountCents forjados e cupom com max_uses=1 bloqueia 2º pedido com 409",
    async () => {
      const testProdId = `prod_sec_coupon_${Date.now()}`;
      const singleUseCouponId = `coupon_single_${Date.now()}`;
      const singleUseCode = `UNICO-${Date.now().toString().slice(-6)}`;
      const createdOrderIds: string[] = [];

      await db.insert(products).values({
        id: testProdId,
        name: "Sérum Reconstrutor Teste Segurança",
        slug: `serum-sec-coupon-${Date.now()}`,
        price: 150.0,
        priceCents: 15000,
        pixDiscountPercent: 5,
        stock: 10,
        createdAt: new Date().toISOString(),
      });

      await db.insert(coupons).values({
        id: singleUseCouponId,
        code: singleUseCode,
        type: "fixed",
        value: 2000, // R$ 20,00
        minSubtotalCents: 10000,
        startsAt: null,
        expiresAt: null,
        maxUses: 1,
        usedCount: 0,
        active: 1,
        createdAt: new Date().toISOString(),
      });

      try {
        const { POST: postPedidosRoute } = await import(
          "@/app/api/pedidos/route"
        );

        // 1. POST forjado com shippingCents: 0 e discountCents: 99999 (Sudeste 01310-100 = 2690, BEMVINDA10 10% de 15000 = 1500)
        const email1 = `forjado.${Date.now()}@exemplo.com.br`;
        const cookie1 = `${EMAIL_VERIFICATION_COOKIE_NAME}=${createVerifiedEmailToken(
          email1
        )}`;
        const forgedRes = await postPedidosRoute(
          new Request("http://localhost:3001/api/pedidos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookie1,
              "x-forwarded-for": "198.51.100.201",
            },
            body: JSON.stringify({
              customerName: "Cliente Teste Forjado",
              customerPhone: "(49) 99125-1617",
              customerEmail: email1,
              deliveryMode: "entrega",
              cep: "01310-100",
              address: "Av Paulista, Nº 1000 — Bela Vista",
              city: "São Paulo - SP",
              paymentMethod: "cartao",
              couponCode: "BEMVINDA10",
              shippingCents: 0,
              discountCents: 99999,
              totalCents: 1,
              marketingConsent: false,
              idempotencyKey: crypto.randomUUID(),
              honeypot: "",
              items: [{ productId: testProdId, quantity: 1 }],
            }),
          })
        );
        expect(forgedRes.status).toBe(201);
        const forgedJson = (await forgedRes.json()) as {
          order: {
            id: string;
            subtotalCents: number;
            shippingCents: number;
            discountCents: number;
            couponCode: string | null;
            couponDiscountCents: number;
            totalCents: number;
          };
        };
        createdOrderIds.push(forgedJson.order.id);
        expect(forgedJson.order.subtotalCents).toBe(15000);
        expect(forgedJson.order.shippingCents).toBe(2690);
        expect(forgedJson.order.couponCode).toBe("BEMVINDA10");
        expect(forgedJson.order.couponDiscountCents).toBe(1500);
        expect(forgedJson.order.discountCents).toBe(1500);
        expect(forgedJson.order.totalCents).toBe(15000 - 1500 + 2690);

        // 2. Cupom com max_uses = 1 usado em 2 pedidos -> 1º recebe 201, 2º recebe 409 "Este cupom acabou de esgotar"
        const email2 = `unico1.${Date.now()}@exemplo.com.br`;
        const cookie2 = `${EMAIL_VERIFICATION_COOKIE_NAME}=${createVerifiedEmailToken(
          email2
        )}`;
        const firstUseRes = await postPedidosRoute(
          new Request("http://localhost:3001/api/pedidos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookie2,
              "x-forwarded-for": "198.51.100.202",
            },
            body: JSON.stringify({
              customerName: "Cliente Uso Único 1",
              customerPhone: "(49) 99125-1617",
              customerEmail: email2,
              deliveryMode: "retirada",
              paymentMethod: "whatsapp",
              couponCode: singleUseCode,
              marketingConsent: false,
              idempotencyKey: crypto.randomUUID(),
              honeypot: "",
              items: [{ productId: testProdId, quantity: 1 }],
            }),
          })
        );
        expect(firstUseRes.status).toBe(201);
        const firstUseJson = (await firstUseRes.json()) as {
          order: { id: string; couponDiscountCents: number };
        };
        createdOrderIds.push(firstUseJson.order.id);
        expect(firstUseJson.order.couponDiscountCents).toBe(2000);

        const email3 = `unico2.${Date.now()}@exemplo.com.br`;
        const cookie3 = `${EMAIL_VERIFICATION_COOKIE_NAME}=${createVerifiedEmailToken(
          email3
        )}`;
        const secondUseRes = await postPedidosRoute(
          new Request("http://localhost:3001/api/pedidos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookie3,
              "x-forwarded-for": "198.51.100.203",
            },
            body: JSON.stringify({
              customerName: "Cliente Uso Único 2",
              customerPhone: "(49) 99125-1617",
              customerEmail: email3,
              deliveryMode: "retirada",
              paymentMethod: "whatsapp",
              couponCode: singleUseCode,
              marketingConsent: false,
              idempotencyKey: crypto.randomUUID(),
              honeypot: "",
              items: [{ productId: testProdId, quantity: 1 }],
            }),
          })
        );
        expect(secondUseRes.status).toBe(409);
        const secondUseJson = (await secondUseRes.json()) as {
          detail?: string;
        };
        expect(secondUseJson.detail).toContain("Este cupom acabou de esgotar");
      } finally {
        for (const oid of createdOrderIds) {
          await db
            .delete(orderStatusHistory)
            .where(eq(orderStatusHistory.orderId, oid));
          await db.delete(orderItems).where(eq(orderItems.orderId, oid));
          await db.delete(orders).where(eq(orders.id, oid));
        }
        await db.delete(coupons).where(eq(coupons.id, singleUseCouponId));
        await db.delete(products).where(eq(products.id, testProdId));
      }
    },
    { tier: 4, milestone: "E2E", authoritativeSource: "Checkout Coupons & Shipping Spec #8" }
  );
});

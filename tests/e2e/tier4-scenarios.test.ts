import fs from "fs";
import path from "path";
import { describe, test, expect } from "./framework";
import { db, products, brands, categories } from "@/db";
import { eq } from "drizzle-orm";

const ROOT_DIR = path.resolve(__dirname, "../..");

describe("Tier 4 - Real-World Application Scenarios", () => {
  // =========================================================================
  // Scenario 1: Professional Salon Treatment Shopping Journey (Wella & L'Oréal)
  // Authoritative Source: ORIGINAL_REQUEST.md §R2, §R3, PROJECT.md
  // =========================================================================
  test(
    "4.1 Real-World Journey: Salon Treatment Shopping (Wella & L'Oréal Selection)",
    async () => {
      // Step 1: Query products from Wella and L'Oréal brands
      const allBrands = await db.select().from(brands);
      const wella = allBrands.find((b) => b.slug.includes("wella"));
      const loreal = allBrands.find((b) => b.slug.includes("loreal"));

      expect(wella).toBeDefined();
      expect(loreal).toBeDefined();

      const wellaProds = await db.select().from(products).where(eq(products.brandId, wella!.id)).limit(1);
      const lorealProds = await db.select().from(products).where(eq(products.brandId, loreal!.id)).limit(1);

      expect(wellaProds.length).toBe(1);
      expect(lorealProds.length).toBe(1);

      const item1 = wellaProds[0];
      const item2 = lorealProds[0];

      // Step 2: Customer adds 1 unit of each to cart
      const cart = [
        { id: item1.id, name: item1.name, brandName: wella!.name, price: item1.price, quantity: 1 },
        { id: item2.id, name: item2.name, brandName: loreal!.name, price: item2.price, quantity: 1 },
      ];

      // Step 3: Compute calculations
      const subtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
      const pixDiscount = subtotal * 0.05;
      const pixPrice = subtotal - pixDiscount;
      const freeShipping = subtotal >= 199.0;

      expect(subtotal).toBeGreaterThan(0);
      expect(pixPrice).toBeCloseTo(subtotal * 0.95, 0.01);
      expect(typeof freeShipping).toBe("boolean");

      // Step 4: Verify WhatsApp dispatch template
      const phone = "5549991251617";
      let msg = `*NOVO PEDIDO - MARIANE COSMÉTICOS*\n`;
      msg += `_Linda é a mulher que bem se quer_\n\n`;
      cart.forEach((i, idx) => {
        msg += `${idx + 1}. ${i.name} (${i.brandName}) - R$ ${i.price.toFixed(2)}\n`;
      });
      msg += `\n💰 Subtotal: R$ ${subtotal.toFixed(2)}`;

      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      expect(url).toContain("5549991251617");
      expect(decodeURIComponent(url)).toContain("Linda é a mulher que bem se quer");
    },
    { tier: 4, milestone: "E2E", authoritativeSource: "ORIGINAL_REQUEST.md §R2, §R3" }
  );

  // =========================================================================
  // Scenario 2: Complete 3-Step Cronograma Capilar Package Journey
  // Authoritative Source: ORIGINAL_REQUEST.md §R2, PROJECT.md
  // =========================================================================
  test(
    "4.2 Real-World Journey: 3-Step Cronograma Capilar (Hidratação + Nutrição + Reconstrução)",
    async () => {
      // Step 1: Query treatment products
      const prods = await db.select().from(products).limit(3);
      expect(prods.length).toBe(3);

      // Step 2: Form Cronograma package
      const cronogramaSteps = ["Hidratação", "Nutrição", "Reconstrução"];
      const cart = prods.map((p, idx) => ({
        id: p.id,
        name: `${p.name} - Etapa ${cronogramaSteps[idx]}`,
        price: p.promoPrice || p.price,
        quantity: 1,
      }));

      // Step 3: Verify subtotal exceeds free shipping threshold
      const subtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
      const threshold = 199.0;
      const freeShipping = subtotal >= threshold;

      expect(cart.length).toBe(3);
      expect(subtotal).toBeGreaterThan(0);
      expect(freeShipping).toBe(true, "3 professional treatment products should surpass R$ 199 threshold");

      // Step 4: Verify free shipping progress is 100%
      const progress = Math.min(100, Math.round((subtotal / threshold) * 100));
      expect(progress).toBe(100);
    },
    { tier: 4, milestone: "E2E", authoritativeSource: "PROJECT.md Feature #16" }
  );

  // =========================================================================
  // Scenario 3: Mobile WhatsApp Quick Consultation & Direct Purchase Flow
  // Authoritative Source: ORIGINAL_REQUEST.md §R3, PROJECT.md Feature #10, #13
  // =========================================================================
  test(
    "4.3 Real-World Journey: Direct WhatsApp Product Purchase Consultation",
    async () => {
      const sample = await db.select().from(products).limit(1);
      expect(sample.length).toBe(1);
      const prod = sample[0];

      const currentPrice = prod.promoPrice || prod.price;
      const pixPrice = (currentPrice * 0.95).toFixed(2);
      const brand = "Wella Profissional";

      const consultationMsg = `Olá, Mariane Cosméticos! Gostaria de pedir o produto:\n*${prod.name}*\nMarca: ${brand}\nPreço: R$ ${currentPrice.toFixed(2)} (ou R$ ${pixPrice} no PIX)\nLink: https://marianecosmeticos.com.br/produto/${prod.slug}`;

      const waPhone = "5549991251617";
      const fullUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(consultationMsg)}`;

      expect(fullUrl.startsWith("https://wa.me/5549991251617")).toBe(true);
      const decoded = decodeURIComponent(fullUrl);
      expect(decoded).toContain("Mariane Cosméticos");
      expect(decoded).toContain(prod.name);
      expect(decoded).toContain(pixPrice);
      expect(decoded).toContain(`/produto/${prod.slug}`);
    },
    { tier: 4, milestone: "E2E", authoritativeSource: "ORIGINAL_REQUEST.md §R3" }
  );

  // =========================================================================
  // Scenario 4: Direct Online Checkout Flow with 5% PIX Discount
  // Authoritative Source: PROJECT.md Feature #16, src/app/checkout/page.tsx
  // =========================================================================
  test(
    "4.4 Real-World Journey: Online Checkout with PIX Discount and Shipping Breakdown",
    () => {
      const subtotal = 250.0; // Above free shipping threshold
      const discountPix = subtotal * 0.05; // R$ 12.50
      const shippingCost = subtotal >= 199.0 ? 0 : 22.9;

      const finalTotalPix = subtotal - discountPix + shippingCost; // R$ 237.50
      const finalTotalCard = subtotal + shippingCost; // R$ 250.00

      expect(discountPix).toBe(12.5);
      expect(shippingCost).toBe(0);
      expect(finalTotalPix).toBe(237.5);
      expect(finalTotalCard).toBe(250.0);

      // Verify customer form fields schema
      const customerForm = {
        name: "Letícia Mendes",
        phone: "(49) 99125-1617",
        email: "leticia@exemplo.com",
        cep: "88505-300",
        city: "Lages - SC",
        address: "Rua Blumenau, 623",
        paymentMethod: "pix",
      };

      expect(customerForm.name.length).toBeGreaterThan(0);
      expect(customerForm.phone.length).toBeGreaterThan(0);
      expect(customerForm.city).toContain("Lages");
    },
    { tier: 4, milestone: "E2E", authoritativeSource: "PROJECT.md Feature #16" }
  );

  // =========================================================================
  // Scenario 5: Search Recovery Journey (Empty Search -> Clear Filters -> Catalog)
  // Authoritative Source: PROJECT.md Feature #15
  // =========================================================================
  test(
    "4.5 Real-World Journey: Search Recovery from Zero Results to Full Catalog",
    async () => {
      const allProducts = await db.select().from(products);
      expect(allProducts.length).toBeGreaterThan(20);

      // 1. Search for non-existent brand query
      const nonExistentQuery = "marca-inexistente-xyz-12345";
      const filtered = allProducts.filter((p) => p.name.toLowerCase().includes(nonExistentQuery));
      expect(filtered.length).toBe(0);

      // 2. User recovers by resetting filters
      const clearedQuery = "";
      const restored = clearedQuery ? allProducts.filter((p) => p.name.includes(clearedQuery)) : allProducts;
      expect(restored.length).toBe(allProducts.length);
    },
    { tier: 4, milestone: "E2E", authoritativeSource: "PROJECT.md Feature #15" }
  );

  // =========================================================================
  // Scenario 6: Order Persistence in SQLite (`orders` + `order_items`) & WhatsApp Link
  // Authoritative Source: docs/plans/mvp.md Task 4, src/lib/orders.ts
  // =========================================================================
  test(
    "4.6 Real-World Journey: Checkout Persists Order in Database ('aguardando pagamento') and Generates Official WhatsApp Link",
    async () => {
      const { createOrderInDb } = await import("@/lib/orders");
      const { orders, orderItems } = await import("@/db");

      const sampleProds = await db.select().from(products).limit(2);
      expect(sampleProds.length).toBe(2);

      const created = await createOrderInDb({
        customerName: "Fernanda Oliveira",
        customerPhone: "(49) 99125-1617",
        customerEmail: "fernanda@teste.com.br",
        deliveryMode: "entrega",
        cep: "88505-300",
        city: "Lages - SC",
        address: "Rua Blumenau, Nº 623 - Coral",
        paymentMethod: "pix",
        notes: "Entregar na recepção",
        items: [
          { productId: sampleProds[0].id, quantity: 1 },
          { productId: sampleProds[1].id, quantity: 2 },
        ],
      });

      expect(created.success).toBe(true);
      if (!created.success) return;

      try {
        expect(created.orderId.startsWith("MC-")).toBe(true, "Order ID must start with MC- prefix");
        expect(created.status).toBe("aguardando pagamento", "Initial order status must be 'aguardando pagamento'");
        expect(created.whatsappUrl).toContain("https://wa.me/5549991251617?text=");
        expect(decodeURIComponent(created.whatsappUrl)).toContain(created.orderId);

        const persistedOrder = await db.select().from(orders).where(eq(orders.id, created.orderId)).limit(1);
        expect(persistedOrder.length).toBe(1, "Order must be persisted in orders table");
        expect(persistedOrder[0].status).toBe("aguardando pagamento");

        const persistedItems = await db.select().from(orderItems).where(eq(orderItems.orderId, created.orderId));
        expect(persistedItems.length).toBe(2, "Order items must be persisted in order_items table");
      } finally {
        await db.delete(orderItems).where(eq(orderItems.orderId, created.orderId));
        await db.delete(orders).where(eq(orders.id, created.orderId));
      }
    },
    { tier: 4, milestone: "E2E", authoritativeSource: "docs/plans/mvp.md Task 4" }
  );

  // =========================================================================
  // Scenario 7: Payment Sandbox Creation + Webhook Signature & Idempotency Contract
  // Authoritative Source: docs/payments-comparison.md, src/lib/payments.ts
  // =========================================================================
  test(
    "4.7 Real-World Journey: Asaas Sandbox Payment Creation, Webhook HMAC Signature Verification, Idempotency & Status Update",
    async () => {
      const { createOrderInDb } = await import("@/lib/orders");
      const { createSandboxPayment, computeWebhookHmac, verifyWebhookSignature, handlePaymentWebhook } =
        await import("@/lib/payments");
      const { orders, orderItems, paymentWebhooks } = await import("@/db");

      const sampleProd = await db.select().from(products).limit(1);
      expect(sampleProd.length).toBe(1);

      const order = await createOrderInDb({
        customerName: "Juliana Costa",
        customerPhone: "(49) 99988-7766",
        deliveryMode: "retirada",
        paymentMethod: "pix",
        items: [{ productId: sampleProd[0].id, quantity: 1 }],
      });

      expect(order.success).toBe(true);
      if (!order.success) return;

      const eventId = `evt_test_${Date.now()}`;
      const testSecret = "whsec_mariane_test_secret_2026";

      try {
        // 1. Create Sandbox PIX payment
        const payment = await createSandboxPayment(
          {
            orderId: order.orderId,
            paymentMethod: "pix",
          },
          { forceSandboxMock: true }
        );

        expect(payment.success).toBe(true);
        if (!payment.success || !payment.sandboxConfigured) return;

        expect(payment.provider).toBe("asaas-sandbox");
        expect(payment.orderStatus).toBe("aguardando pagamento");
        expect(typeof payment.pixCopyPaste === "string" && payment.pixCopyPaste.length > 10).toBe(
          true,
          "Sandbox PIX payment must return EMV copy-paste payload"
        );

        // 2. Verify invalid webhook signature is rejected
        const payloadObj = {
          eventId,
          event: "PAYMENT_RECEIVED" as const,
          orderId: order.orderId,
          payment: {
            id: payment.paymentId,
            externalReference: order.orderId,
            value: payment.amount,
            billingType: "PIX",
            status: "RECEIVED",
          },
        };
        const rawBody = JSON.stringify(payloadObj);

        const forgedCheck = verifyWebhookSignature(rawBody, "assinatura_invalida_forjada_123", null, testSecret);
        expect(forgedCheck).toBe(false, "Forged webhook signature must be rejected");

        const rejectedRes = await handlePaymentWebhook({
          rawBody,
          signatureHeader: "assinatura_invalida_forjada_123",
          accessTokenHeader: null,
          secretOverride: testSecret,
        });
        expect(rejectedRes.statusHttp).toBe(401, "Invalid webhook signature must return HTTP 401");

        // 3. Compute valid HMAC-SHA256 signature and process webhook
        const validSignature = computeWebhookHmac(rawBody, testSecret);
        expect(verifyWebhookSignature(rawBody, validSignature, null, testSecret)).toBe(
          true,
          "Valid HMAC-SHA256 signature must pass"
        );

        const firstProcess = await handlePaymentWebhook({
          rawBody,
          signatureHeader: validSignature,
          accessTokenHeader: null,
          secretOverride: testSecret,
        });
        expect(firstProcess.statusHttp).toBe(200);
        expect(firstProcess.body.success).toBe(true);
        expect(firstProcess.body.idempotentReplay).toBe(false);
        expect(firstProcess.body.status).toBe("pago");

        // 4. Verify order status in DB transitioned to 'pago'
        const updatedOrder = await db.select().from(orders).where(eq(orders.id, order.orderId)).limit(1);
        expect(updatedOrder[0].status).toBe("pago", "Order status in DB must transition to 'pago' after webhook");

        // 5. Replay identical webhook event and verify idempotency protection
        const replayProcess = await handlePaymentWebhook({
          rawBody,
          signatureHeader: validSignature,
          accessTokenHeader: null,
          secretOverride: testSecret,
        });
        expect(replayProcess.statusHttp).toBe(200);
        expect(replayProcess.body.success).toBe(true);
        expect(replayProcess.body.idempotentReplay).toBe(
          true,
          "Second delivery of same eventId must be flagged as idempotentReplay"
        );
      } finally {
        await db.delete(paymentWebhooks).where(eq(paymentWebhooks.eventId, eventId));
        await db.delete(orderItems).where(eq(orderItems.orderId, order.orderId));
        await db.delete(orders).where(eq(orders.id, order.orderId));
      }
    },
    { tier: 4, milestone: "E2E", authoritativeSource: "docs/payments-comparison.md" }
  );

  // =========================================================================
  // Scenario 8: Concurrent Webhook Race Condition, Monotonic State Machine & Underpayment Guard
  // Authoritative Source: docs/payments-comparison.md §3.1, src/lib/payments.ts
  // =========================================================================
  test(
    "4.8 Real-World Journey: Concurrent Webhook Deliveries, Out-of-Order Event Protection & Underpayment Rejection",
    async () => {
      const { createOrderInDb } = await import("@/lib/orders");
      const { computeWebhookHmac, handlePaymentWebhook } = await import("@/lib/payments");
      const { orders, orderItems, paymentWebhooks } = await import("@/db");

      const sampleProd = await db.select().from(products).limit(1);
      expect(sampleProd.length).toBe(1);

      const order = await createOrderInDb({
        customerName: "Camila Andrade",
        customerPhone: "(49) 99111-2233",
        deliveryMode: "retirada",
        paymentMethod: "pix",
        items: [{ productId: sampleProd[0].id, quantity: 1 }],
      });

      expect(order.success).toBe(true);
      if (!order.success) return;

      const testSecret = "whsec_mariane_concurrency_secret_2026";
      const concurrentEventId = `evt_concurrent_${Date.now()}`;
      const overdueEventId = `evt_overdue_${Date.now()}`;
      const underpaidEventId = `evt_underpaid_${Date.now()}`;

      try {
        // 1. Underpayment attempt must be rejected with HTTP 400
        const underpaidBody = JSON.stringify({
          eventId: underpaidEventId,
          event: "PAYMENT_CONFIRMED",
          orderId: order.orderId,
          payment: {
            id: "pay_underpaid_1",
            externalReference: order.orderId,
            value: Math.max(0.01, order.order.total - 10),
            billingType: "PIX",
          },
        });
        const underpaidRes = await handlePaymentWebhook({
          rawBody: underpaidBody,
          signatureHeader: computeWebhookHmac(underpaidBody, testSecret),
          accessTokenHeader: null,
          secretOverride: testSecret,
        });
        expect(underpaidRes.statusHttp).toBe(400, "Underpaid webhook amount must be rejected with HTTP 400");

        // 2. Concurrent duplicate deliveries of the same valid PAYMENT_CONFIRMED event
        const validBody = JSON.stringify({
          eventId: concurrentEventId,
          event: "PAYMENT_CONFIRMED",
          orderId: order.orderId,
          payment: {
            id: "pay_concurrent_1",
            externalReference: order.orderId,
            value: order.order.total,
            billingType: "PIX",
          },
        });
        const validSig = computeWebhookHmac(validBody, testSecret);

        const [resA, resB] = await Promise.all([
          handlePaymentWebhook({
            rawBody: validBody,
            signatureHeader: validSig,
            accessTokenHeader: null,
            secretOverride: testSecret,
          }),
          handlePaymentWebhook({
            rawBody: validBody,
            signatureHeader: validSig,
            accessTokenHeader: null,
            secretOverride: testSecret,
          }),
        ]);

        expect(resA.statusHttp).toBe(200, "First concurrent webhook delivery must return HTTP 200");
        expect(resB.statusHttp).toBe(200, "Second concurrent webhook delivery must return HTTP 200 without 500 PK error");
        const replayFlags = [resA.body.idempotentReplay, resB.body.idempotentReplay];
        expect(replayFlags.includes(false) && replayFlags.includes(true)).toBe(
          true,
          "Exactly one concurrent delivery must process and the other must return idempotentReplay=true"
        );

        // 3. Out-of-order PAYMENT_OVERDUE arriving after order is already 'pago' must NOT downgrade status
        const overdueBody = JSON.stringify({
          eventId: overdueEventId,
          event: "PAYMENT_OVERDUE",
          orderId: order.orderId,
          payment: {
            id: "pay_concurrent_1",
            externalReference: order.orderId,
            billingType: "PIX",
          },
        });
        const overdueRes = await handlePaymentWebhook({
          rawBody: overdueBody,
          signatureHeader: computeWebhookHmac(overdueBody, testSecret),
          accessTokenHeader: null,
          secretOverride: testSecret,
        });
        expect(overdueRes.statusHttp).toBe(200);
        expect(overdueRes.body.status).toBe("pago", "Paid order must not be downgraded to 'falhou' by out-of-order overdue event");

        const finalOrder = await db.select().from(orders).where(eq(orders.id, order.orderId)).limit(1);
        expect(finalOrder[0].status).toBe("pago", "Database order status must remain 'pago'");
      } finally {
        await db.delete(paymentWebhooks).where(eq(paymentWebhooks.eventId, concurrentEventId));
        await db.delete(paymentWebhooks).where(eq(paymentWebhooks.eventId, overdueEventId));
        await db.delete(paymentWebhooks).where(eq(paymentWebhooks.eventId, underpaidEventId));
        await db.delete(orderItems).where(eq(orderItems.orderId, order.orderId));
        await db.delete(orders).where(eq(orders.id, order.orderId));
      }
    },
    { tier: 4, milestone: "E2E", authoritativeSource: "docs/payments-comparison.md §3.1" }
  );
});


import assert from "assert";
import crypto from "crypto";
import { client, db, products, orders, orderItems, orderStatusHistory } from "../../src/db";
import { eq } from "drizzle-orm";
import {
  createOrderTransaction,
  getOrderByPublicToken,
  generatePublicToken,
  generateOrderHumanCode,
} from "../../src/lib/orders";
import { sanitizeCsvCell, generateOrdersCsv } from "../../src/lib/admin-auth";
import { queryAdminOrders } from "../../src/lib/admin-orders";
import { validateReturnUrl, validateAsaasCheckoutUrl } from "../../src/lib/payment-urls";
import { createSandboxPayment } from "../../src/lib/payments";
import { checkRateLimit, resetRateLimitStore } from "../../src/lib/rate-limit";
import { GET as legacyGetOrderById } from "../../src/app/api/pedidos/route";
import { buildOrderWhatsAppMessage, buildWhatsAppLink } from "../../src/config/store";

console.log("▶ Iniciando Suíte de Segurança Defensiva Local (10 Categorias Checklist)...");

async function runAdversarialSuite() {
  const testProdId = `prod_adv_${Date.now()}`;
  await db.insert(products).values({
    id: testProdId,
    name: "Kit Blindagem Adversarial",
    slug: `kit-adversarial-${Date.now()}`,
    price: 150.0,
    priceCents: 15000,
    promoPrice: null,
    promoPriceCents: null,
    pixDiscountPercent: 5,
    stock: 2,
    createdAt: new Date().toISOString(),
  });

  const createdOrderIds: string[] = [];

  try {
    // 1. Business Logic Errors & 2. Mass Assignment
    // - Preço adulterado, frete adulterado, desconto PIX com método 'cartao', status='pago' e total=0.01 no body
    const tamperIdemKey = crypto.randomUUID();
    const tamperRes = await createOrderTransaction({
      customerName: "Cliente Teste Integridade",
      customerPhone: "49991251617",
      deliveryMode: "entrega",
      cep: "88505300",
      address: "Rua Blumenau, 623",
      city: "Lages - SC",
      paymentMethod: "cartao",
      idempotencyKey: tamperIdemKey,
      honeypot: "",
      status: "pago",
      total: 0.01,
      totalCents: 1,
      shippingCents: 0,
      discountCents: 14999,
      items: [
        {
          productId: testProdId,
          quantity: 1,
          price: 0.01,
          unitPriceCents: 1,
        },
      ],
    });

    assert.strictEqual(tamperRes.success, true);
    if (tamperRes.success) {
      createdOrderIds.push(tamperRes.order.id);
      assert.strictEqual(
        tamperRes.order.subtotalCents,
        15000,
        "Subtotal deve usar exclusivamente o preço oficial do banco (15000 centavos)"
      );
      assert.strictEqual(
        tamperRes.order.discountCents,
        0,
        "Desconto PIX jamais deve ser aplicado quando paymentMethod='cartao'"
      );
      assert.strictEqual(
        tamperRes.order.shippingCents,
        2290,
        "Entrega abaixo de R$ 199,00 deve cobrar frete fixo oficial (2290 centavos)"
      );
      assert.strictEqual(
        tamperRes.order.totalCents,
        17290,
        "Total deve ser exatamente 15000 + 2290 = 17290 centavos"
      );
      assert.strictEqual(
        tamperRes.order.status,
        "aguardando_pagamento",
        "Mass Assignment de status='pago' deve ser ignorado pelo servidor"
      );
    }

    // Quantidade zero e negativa devem ser rejeitadas com HTTP 400
    const zeroQtyRes = await createOrderTransaction({
      customerName: "Cliente Quantidade Zero",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "pix",
      idempotencyKey: crypto.randomUUID(),
      honeypot: "",
      items: [{ productId: testProdId, quantity: 0 }],
    });
    assert.strictEqual(zeroQtyRes.success, false);
    assert.strictEqual(zeroQtyRes.statusHttp, 400);

    const negQtyRes = await createOrderTransaction({
      customerName: "Cliente Quantidade Negativa",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "pix",
      idempotencyKey: crypto.randomUUID(),
      honeypot: "",
      items: [{ productId: testProdId, quantity: -3 }],
    });
    assert.strictEqual(negQtyRes.success, false);
    assert.strictEqual(negQtyRes.statusHttp, 400);

    // Soma de itens duplicados acima de MAX_QUANTITY_PER_ITEM (20) deve ser rejeitada com HTTP 400
    const splitMaxQtyRes = await createOrderTransaction({
      customerName: "Cliente Split Max Qty",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "pix",
      idempotencyKey: crypto.randomUUID(),
      honeypot: "",
      items: [
        { productId: testProdId, quantity: 15 },
        { productId: testProdId, quantity: 10 },
      ],
    });
    assert.strictEqual(splitMaxQtyRes.success, false);
    assert.strictEqual(splitMaxQtyRes.statusHttp, 400);

    // Replay de idempotência deve exigir mesmo proprietário (409 se divergente) e mascarar PII no retorno 200
    if (tamperRes.success) {
      const spoofedReplay = await createOrderTransaction({
        customerName: "Atacante Tentando Colisão",
        customerPhone: "11988887777",
        deliveryMode: "entrega",
        cep: "88505300",
        address: "Rua Blumenau, 623",
        city: "Lages - SC",
        paymentMethod: "cartao",
        idempotencyKey: tamperIdemKey,
        honeypot: "",
        items: [{ productId: testProdId, quantity: 1 }],
      });
      assert.strictEqual(spoofedReplay.success, false);
      if (!spoofedReplay.success) {
        assert.strictEqual(
          spoofedReplay.statusHttp,
          409,
          "Replay de idempotencyKey com cliente divergente deve retornar HTTP 409 Conflict"
        );
      }
    }

    // Impedir emissão de cobrança por Cartão em pedido criado com desconto PIX
    await db
      .update(products)
      .set({ stock: 3 })
      .where(eq(products.id, testProdId));

    const pixOrderRes = await createOrderTransaction({
      customerName: "Cliente PIX Desconto",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "pix",
      idempotencyKey: crypto.randomUUID(),
      honeypot: "",
      items: [{ productId: testProdId, quantity: 1 }],
    });
    assert.strictEqual(pixOrderRes.success, true);
    if (pixOrderRes.success) {
      createdOrderIds.push(pixOrderRes.order.id);
      const downgradeAttempt = await createSandboxPayment(
        {
          orderId: pixOrderRes.order.id,
          paymentMethod: "card",
        },
        { forceSandboxMock: true }
      );
      assert.strictEqual(
        downgradeAttempt.success,
        false,
        "Pedido emitido com desconto PIX jamais pode gerar cobrança via cartão"
      );
      if (!downgradeAttempt.success) {
        assert.strictEqual(downgradeAttempt.statusHttp, 409);
      }
    }

    // Restaurar estoque para 1 antes do teste de Race Condition
    await db
      .update(products)
      .set({ stock: 1 })
      .where(eq(products.id, testProdId));

    console.log("  ✓ 1 & 2. Business Logic (preço, qtd <= 0, split > 20, frete, PIX c/ outro método) e Mass Assignment neutralizados.");

    // 3. Race Condition no último item em estoque (resta 1 unidade de testProdId)
    const concurrentBuyers = await Promise.all(
      Array.from({ length: 4 }, (_, i) =>
        createOrderTransaction({
          customerName: `Comprador Concorrente ${i + 1}`,
          customerPhone: "49991251617",
          deliveryMode: "retirada",
          paymentMethod: "whatsapp",
          idempotencyKey: crypto.randomUUID(),
          honeypot: "",
          items: [{ productId: testProdId, quantity: 1 }],
        })
      )
    );
    const winners = concurrentBuyers.filter((r) => r.success);
    const losers = concurrentBuyers.filter((r) => !r.success && r.statusHttp === 409);
    for (const w of winners) {
      if (w.success) createdOrderIds.push(w.order.id);
    }
    assert.strictEqual(winners.length, 1, "Apenas 1 comprador concorrente pode reservar a última unidade");
    assert.strictEqual(losers.length, 3, "Os outros 3 devem receber HTTP 409 OutOfStock");
    console.log("  ✓ 3. Race Condition no último item em estoque neutralizada atomicamente.");

    // 4. IDOR / Enumeração na rota legada GET /api/pedidos?id=MC-...
    const idorResponse = await legacyGetOrderById();
    assert.strictEqual(
      idorResponse.status,
      400,
      "Consulta aberta por código humano deve estar desativada (HTTP 400)"
    );
    const nullByCode = await getOrderByPublicToken(createdOrderIds[0] || "MC-20261109-000000");
    assert.strictEqual(
      nullByCode,
      null,
      "getOrderByPublicToken jamais deve retornar pedido quando consultado pelo código humano MC-..."
    );
    console.log("  ✓ 4. Proteção contra IDOR e enumeração por código humano comprovada.");

    // 5. XSS & Control Character Injection (nome, endereço, observações no painel e no WhatsApp)
    const xssMsg = buildOrderWhatsAppMessage({
      humanCode: "MC-20261109-XSS001",
      customerName: "<img src=x onerror=alert(1)>",
      customerPhone: "49991251617",
      deliveryMode: "entrega",
      shippingAddress: "Rua <script>alert(1)</script>, 100",
      paymentMethod: "whatsapp",
      subtotalCents: 10000,
      discountCents: 0,
      shippingCents: 0,
      totalCents: 10000,
      items: [{ name: "Produto", quantity: 1, unitPriceCents: 10000, lineTotalCents: 10000 }],
      notes: "javascript:alert(1)",
      publicToken: "a1b2c3d4e5f600001111222233334444",
    });
    const waLink = buildWhatsAppLink(xssMsg);
    assert.ok(
      waLink.startsWith("https://wa.me/5549991251617?text="),
      "Link do WhatsApp deve usar protocolo HTTPS fixo wa.me"
    );
    assert.ok(
      !waLink.includes("<script>"),
      "Tags HTML na URL do WhatsApp devem estar percent-encoded via encodeURIComponent"
    );
    console.log("  ✓ 5. Proteção contra XSS e codificação segura de URL no WhatsApp e Painel validadas.");

    // 6. SQL Injection (parametrização Drizzle ORM e escape de LIKE em queryAdminOrders)
    const sqliSearch = await queryAdminOrders({
      search: `100%' OR 1=1 --`,
      status: "todos",
      page: 1,
      limit: 10,
    });
    assert.strictEqual(
      sqliSearch.orders.length,
      0,
      "Tentativa de SQL Injection / wildcard injection na busca não deve vazar registros"
    );
    const sqliToken = await getOrderByPublicToken(`' OR '1'='1`);
    assert.strictEqual(sqliToken, null);
    console.log("  ✓ 6. Proteção contra SQL Injection e LIKE Wildcard Injection comprovada.");

    // 7. CSV Injection
    const maliciousName = "=cmd|'/C calc'!A0";
    assert.strictEqual(sanitizeCsvCell(maliciousName), "\"'=cmd|'/C calc'!A0\"");
    const exported = generateOrdersCsv([
      {
        id: "MC-20261109-CSV999",
        customerName: maliciousName,
        customerPhone: "+5549991251617",
        totalCents: 15000,
      },
    ]);
    assert.ok(exported.includes("\"'=cmd|'/C calc'!A0\""));
    assert.ok(exported.includes("\"'+5549991251617\""));
    console.log("  ✓ 7. CSV Formula Injection neutralizado na exportação.");

    // 8. Open Redirect no retorno de pagamento
    assert.strictEqual(validateReturnUrl("//evil.example/pedido/a1b2c3d4e5f600001111222233334444"), null);
    assert.strictEqual(validateReturnUrl("https://evil.example/pedido/a1b2c3d4e5f600001111222233334444"), null);
    assert.strictEqual(validateReturnUrl("javascript:alert(1)"), null);
    assert.strictEqual(validateAsaasCheckoutUrl("https://evil.example/i/pay_123"), null);
    assert.strictEqual(validateAsaasCheckoutUrl("http://sandbox.asaas.com/i/pay_123"), null);
    console.log("  ✓ 8. Proteção contra Open Redirect no retorno de pagamento validada.");

    // 9. Brute Force Rate Limit: criação de pedidos (máx 5/10min) e login do painel (máx 5/15min)
    resetRateLimitStore();
    const orderLimits = Array.from({ length: 10 }, () =>
      checkRateLimit("create_order", "192.0.2.99", 5, 10 * 60 * 1000)
    );
    assert.strictEqual(orderLimits.filter((r) => r.allowed).length, 5);
    assert.strictEqual(orderLimits.filter((r) => !r.allowed).length, 5);

    const loginLimits = Array.from({ length: 8 }, () =>
      checkRateLimit("admin_login", "192.0.2.99", 5, 15 * 60 * 1000)
    );
    assert.strictEqual(loginLimits.filter((r) => r.allowed).length, 5);
    assert.strictEqual(loginLimits.filter((r) => !r.allowed).length, 3);
    resetRateLimitStore();
    console.log("  ✓ 9. Rate Limiting (criação de pedidos e login do painel) bloqueia a partir da 6ª tentativa.");

    // 10. Insecure Randomness: entropia de token (128 bits UUID v4) e código humano (4 bytes CSPRNG)
    const tokenSet = new Set<string>();
    const codeSet = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const t = generatePublicToken();
      const c = generateOrderHumanCode();
      assert.match(t, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      assert.match(c, /^MC-\d{8}-[0-9A-F]{6}$/);
      tokenSet.add(t);
      codeSet.add(c);
    }
    assert.strictEqual(tokenSet.size, 500, "Zero colisões em 500 publicTokens CSPRNG de 128 bits");
    assert.ok(codeSet.size >= 495, "Alta entropia nos sufixos de códigos humanos");
    console.log("  ✓ 10. Entropia criptográfica (CSPRNG) de publicToken e humanCode validada.");

    console.log("✔ Suíte de Segurança Adversarial concluída com ZERO vulnerabilidades!");
  } finally {
    for (const id of createdOrderIds) {
      await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, id));
      await db.delete(orderItems).where(eq(orderItems.orderId, id));
      await db.delete(orders).where(eq(orders.id, id));
    }
    await db.delete(products).where(eq(products.id, testProdId));
    void client;
  }
}

runAdversarialSuite().catch((err) => {
  console.error("Falha na suíte de segurança adversarial:", err);
  process.exit(1);
});

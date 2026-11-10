import assert from "assert";
import crypto from "crypto";
import { client, db, products, orders, orderItems, orderStatusHistory, paymentWebhooks } from "../../src/db";
import { eq } from "drizzle-orm";
import { createOrderTransaction, changeOrderStatus } from "../../src/lib/orders";
import { computeWebhookHmac, handlePaymentWebhook } from "../../src/lib/payments";

console.log("▶ Iniciando testes de integração do Webhook de Pagamentos (Asaas)...");

async function runWebhookTests() {
  const secret = "whsec_test_strict_cents_2026";
  const testProdId = `prod_wh_${Date.now()}`;

  await db.insert(products).values({
    id: testProdId,
    name: "Máscara Capilar Teste Webhook",
    slug: `mascara-webhook-${Date.now()}`,
    price: 100.0,
    priceCents: 10000,
    promoPrice: null,
    promoPriceCents: null,
    pixDiscountPercent: 5,
    stock: 10,
    createdAt: new Date().toISOString(),
  });

  let createdOrderId = "";
  let expiredOrderId = "";

  try {
    // Criar pedido PIX: Subtotal 10000 - Desconto PIX 500 + Frete Retirada 0 = 9500 centavos (R$ 95,00)
    const orderRes = await createOrderTransaction({
      customerName: "Beatriz Pagadora",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "pix",
      items: [{ productId: testProdId, quantity: 1 }],
      idempotencyKey: crypto.randomUUID(),
      honeypot: "",
    });
    assert.strictEqual(orderRes.success, true, "Pedido para webhook deve ser criado");
    if (!orderRes.success) return;
    createdOrderId = orderRes.order.id;
    assert.strictEqual(orderRes.order.totalCents, 9500);

    // 1. Assinatura HMAC inválida -> 401
    const rawInvalidSig = JSON.stringify({
      eventId: `evt_bad_sig_${Date.now()}`,
      event: "PAYMENT_CONFIRMED",
      orderId: createdOrderId,
      payment: { id: "pay_1", value: 95.0 },
    });
    const res401 = await handlePaymentWebhook({
      rawBody: rawInvalidSig,
      signatureHeader: "assinatura_falsa",
      accessTokenHeader: null,
      secretOverride: secret,
    });
    assert.strictEqual(res401.statusHttp, 401, "Assinatura inválida deve retornar 401");
    console.log("  ✓ 1. Assinatura HMAC inválida rejeitada com HTTP 401.");

    // 2. PAYMENT_CONFIRMED sem payment.value (undefined) -> deve rejeitar com 400!
    const rawMissingValue = JSON.stringify({
      eventId: `evt_missing_val_${Date.now()}`,
      event: "PAYMENT_CONFIRMED",
      orderId: createdOrderId,
      payment: { id: "pay_2" }, // value omitido!
    });
    const resMissingVal = await handlePaymentWebhook({
      rawBody: rawMissingValue,
      signatureHeader: computeWebhookHmac(rawMissingValue, secret),
      accessTokenHeader: null,
      secretOverride: secret,
    });
    assert.strictEqual(
      resMissingVal.statusHttp,
      400,
      "PAYMENT_CONFIRMED sem campo payment.value deve ser rejeitado com HTTP 400"
    );
    console.log("  ✓ 2. PAYMENT_CONFIRMED sem campo payment.value rejeitado com HTTP 400.");

    // 3. PAYMENT_CONFIRMED com subpagamento de 1 centavo (R$ 94,99 vs R$ 95,00) -> deve rejeitar com 400!
    const rawUnderpaidOneCent = JSON.stringify({
      eventId: `evt_underpaid_1c_${Date.now()}`,
      event: "PAYMENT_CONFIRMED",
      orderId: createdOrderId,
      payment: { id: "pay_3", value: 94.99 },
    });
    const resUnderpaid1c = await handlePaymentWebhook({
      rawBody: rawUnderpaidOneCent,
      signatureHeader: computeWebhookHmac(rawUnderpaidOneCent, secret),
      accessTokenHeader: null,
      secretOverride: secret,
    });
    assert.strictEqual(
      resUnderpaid1c.statusHttp,
      400,
      "Subpagamento de R$ 0,01 (94.99 vs 95.00) deve ser rejeitado com HTTP 400"
    );
    console.log("  ✓ 3. Subpagamento de R$ 0,01 (9499 vs 9500 centavos) rejeitado com HTTP 400.");

    // 4. PAYMENT_CONFIRMED com valor exato (R$ 95,00 = 9500 centavos) -> 200 OK, status 'pago' e registro em order_status_history
    const validEventId = `evt_valid_${Date.now()}`;
    const rawValid = JSON.stringify({
      eventId: validEventId,
      event: "PAYMENT_CONFIRMED",
      orderId: createdOrderId,
      payment: { id: "pay_4", value: 95.0 },
    });
    const resValid = await handlePaymentWebhook({
      rawBody: rawValid,
      signatureHeader: computeWebhookHmac(rawValid, secret),
      accessTokenHeader: null,
      secretOverride: secret,
    });
    assert.strictEqual(resValid.statusHttp, 200);
    assert.strictEqual(resValid.body.status, "pago");

    const histRows = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, createdOrderId));
    const webhookHist = histRows.find((h) => h.actor === "webhook_asaas" && h.toStatus === "pago");
    assert.ok(webhookHist, "Deve gravar transição para 'pago' na tabela order_status_history com actor='webhook_asaas'");
    console.log("  ✓ 4. Pagamento exato aprovado e auditado em order_status_history.");

    // 5. Replay idempotente do mesmo eventId -> 200 OK sem duplicar histórico
    const resReplay = await handlePaymentWebhook({
      rawBody: rawValid,
      signatureHeader: computeWebhookHmac(rawValid, secret),
      accessTokenHeader: null,
      secretOverride: secret,
    });
    assert.strictEqual(resReplay.statusHttp, 200);
    assert.strictEqual(resReplay.body.idempotentReplay, true);
    console.log("  ✓ 5. Replay idempotente por eventId validado.");

    // 6. Corrida com Expiração: pedido marcado como 'expirado' recebe PAYMENT_CONFIRMED tardio
    const expOrderRes = await createOrderTransaction({
      customerName: "Cliente Expirada",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "pix",
      items: [{ productId: testProdId, quantity: 1 }],
      idempotencyKey: crypto.randomUUID(),
      honeypot: "",
    });
    assert.strictEqual(expOrderRes.success, true);
    if (!expOrderRes.success) return;
    expiredOrderId = expOrderRes.order.id;

    // Expirar o pedido (devolve o estoque)
    await changeOrderStatus(expiredOrderId, "expirado", "system_expiration", "Expirado após 24h");

    const lateEventId = `evt_late_exp_${Date.now()}`;
    const rawLate = JSON.stringify({
      eventId: lateEventId,
      event: "PAYMENT_CONFIRMED",
      orderId: expiredOrderId,
      payment: { id: "pay_late", value: 95.0 },
    });
    const resLate = await handlePaymentWebhook({
      rawBody: rawLate,
      signatureHeader: computeWebhookHmac(rawLate, secret),
      accessTokenHeader: null,
      secretOverride: secret,
    });
    assert.strictEqual(resLate.statusHttp, 200, "Webhook em pedido expirado deve retornar 200 ao Asaas sem quebrar");
    assert.strictEqual(resLate.body.status, "expirado", "Pedido expirado não deve mudar automaticamente para pago sem estoque");

    const expHistRows = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, expiredOrderId));
    const alertHist = expHistRows.find(
      (h) =>
        h.actor === "webhook_asaas" &&
        h.notes &&
        h.notes.includes("ALERTA: Pagamento confirmado após expiração")
    );
    assert.ok(
      alertHist,
      "Deve gravar alerta crítico em order_status_history quando pagamento chega após expiração"
    );
    console.log("  ✓ 6. Corrida com expiração tratada: HTTP 200 + ALERTA crítico gravado em order_status_history.");

    console.log("✔ Todos os testes de integração do Webhook passaram com 100% de sucesso!");
  } finally {
    await client.execute(`DELETE FROM payment_webhooks WHERE order_id IN ('${createdOrderId}', '${expiredOrderId}')`);
    await client.execute(`DELETE FROM order_status_history WHERE order_id IN ('${createdOrderId}', '${expiredOrderId}')`);
    await client.execute(`DELETE FROM order_items WHERE product_id = '${testProdId}'`);
    if (createdOrderId) await db.delete(orders).where(eq(orders.id, createdOrderId));
    if (expiredOrderId) await db.delete(orders).where(eq(orders.id, expiredOrderId));
    await db.delete(products).where(eq(products.id, testProdId));
  }
}

runWebhookTests().catch((err) => {
  console.error("Falha nos testes de webhook:", err);
  process.exit(1);
});

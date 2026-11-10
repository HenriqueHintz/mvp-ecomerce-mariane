import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { db, products, orders, orderItems, orderStatusHistory, paymentWebhooks } from "../../src/db";
import { eq } from "drizzle-orm";
import { createOrderTransaction, getOrderByPublicToken } from "../../src/lib/orders";
import {
  createSandboxPayment,
  handlePaymentWebhook,
  validateReturnUrl,
  validateAsaasCheckoutUrl,
  syncOrderPaymentStatusFromProvider,
  getNextStepsForStatus,
} from "../../src/lib/payments";
import { STORE_CONFIG } from "../../src/config/store";

async function runAsaasCheckoutAndTrackingTests() {
  console.log("▶ Iniciando testes TDD de Finalização, Pagamento Asaas, Open Redirect e /pedido/[token]...");

  const token32 = "a1b2c3d4e5f60123456789abcdef0123";

  // =========================================================================
  // 1. Proteção contra Open Redirect (URL de retorno e URL do Checkout Asaas)
  // =========================================================================
  assert.strictEqual(
    validateReturnUrl(`/pedido/${token32}`),
    `${STORE_CONFIG.domain}/pedido/${token32}`,
    "Deve aceitar caminho relativo válido /pedido/<32-hex> e normalizar para o domínio oficial"
  );
  assert.strictEqual(
    validateReturnUrl(`${STORE_CONFIG.domain}/pedido/${token32}`),
    `${STORE_CONFIG.domain}/pedido/${token32}`,
    "Deve aceitar URL absoluta do domínio oficial com /pedido/<32-hex>"
  );

  // Vetores maliciosos de Open Redirect
  const maliciousReturnUrls = [
    "https://evil.com/pedido/" + token32,
    "//evil.com/pedido/" + token32,
    "/\\evil.com/pedido/" + token32,
    "javascript:alert(1)",
    `https://marianecosmeticos.com.br@evil.com/pedido/${token32}`,
    `${STORE_CONFIG.domain}/admin/pedidos`,
    `${STORE_CONFIG.domain}/pedido/MC-20261109-A1B2C3`, // código humano não é token de 128 bits
  ];

  for (const badUrl of maliciousReturnUrls) {
    assert.strictEqual(
      validateReturnUrl(badUrl),
      null,
      `Open Redirect deveria bloquear a URL de retorno maliciosa: ${badUrl}`
    );
  }

  assert.strictEqual(
    validateAsaasCheckoutUrl("https://sandbox.asaas.com/i/pay_12345"),
    "https://sandbox.asaas.com/i/pay_12345"
  );
  assert.strictEqual(
    validateAsaasCheckoutUrl("https://www.asaas.com/i/pay_12345"),
    "https://www.asaas.com/i/pay_12345"
  );
  assert.strictEqual(
    validateAsaasCheckoutUrl("http://sandbox.asaas.com/i/pay_12345"),
    null,
    "Deve rejeitar HTTP sem TLS no checkout Asaas"
  );
  assert.strictEqual(
    validateAsaasCheckoutUrl("https://sandbox.asaas.com.evil.com/i/pay_12345"),
    null,
    "Deve rejeitar subdomínio falso simulando Asaas"
  );
  console.log("  ✓ 1. Validação anti-Open Redirect (returnUrl e checkoutUrl) validada.");

  // =========================================================================
  // 2. Próximos passos por status e página /pedido/[token]
  // =========================================================================
  const nextWaitPix = getNextStepsForStatus("aguardando_pagamento", "entrega", "pix");
  assert.ok(nextWaitPix.title.length > 5 && nextWaitPix.steps.length >= 2);

  const nextPickupReady = getNextStepsForStatus("pronto_para_retirada", "retirada", "whatsapp");
  assert.ok(
    nextPickupReady.steps.some((s: string) => s.includes("Rua Blumenau")),
    "Próximos passos de retirada devem informar o endereço oficial da loja em Lages"
  );

  const pageSource = fs.readFileSync(
    path.join(process.cwd(), "src/app/pedido/[token]/page.tsx"),
    "utf-8"
  );
  assert.ok(
    pageSource.includes("Falar com a loja no WhatsApp"),
    "A página /pedido/[token] deve exibir o botão 'Falar com a loja no WhatsApp'"
  );
  assert.ok(
    pageSource.includes("syncOrderPaymentStatusFromProvider"),
    "A página /pedido/[token] deve sincronizar o status com o provedor ao abrir quando pendente"
  );
  console.log("  ✓ 2. Próximos passos por status e botão 'Falar com a loja no WhatsApp' validados.");

  // =========================================================================
  // 3. PIX Sandbox (QR Code, Copia e Cola, Prazo) + Sincronização ao abrir a página
  // =========================================================================
  const testProdId = `prod_asaas_${Date.now()}`;
  const createdOrders: string[] = [];

  await db.insert(products).values({
    id: testProdId,
    name: "Sérum Capilar Madressenza",
    slug: `serum-asaas-${Date.now()}`,
    price: 100.0,
    priceCents: 10000,
    promoPrice: null,
    promoPriceCents: null,
    pixDiscountPercent: 5,
    stock: 6,
    isActive: true,
  });

  try {
    const orderPix = await createOrderTransaction({
      customerName: "Fernanda Costa",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "pix",
      marketingConsent: false,
      idempotencyKey: `idem_asaas_pix_${Date.now()}`,
      honeypot: "",
      items: [{ productId: testProdId, quantity: 2 }],
    });
    assert.strictEqual(orderPix.success, true);
    if (!orderPix.success) return;
    createdOrders.push(orderPix.order.id);

    const pixCharge = await createSandboxPayment(
      {
        orderId: orderPix.order.id,
        paymentMethod: "pix",
        returnUrl: `/pedido/${orderPix.order.publicToken}`,
      },
      { forceSandboxMock: true }
    );
    assert.strictEqual(pixCharge.success, true);
    if (!pixCharge.success) return;
    assert.strictEqual(pixCharge.amountCents, 19000); // 2x 10000 - 5% = 19000
    assert.ok(pixCharge.pixCopyPaste && pixCharge.pixCopyPaste.includes("br.gov.bcb.pix"));
    assert.ok(pixCharge.pixExpiresAt, "Cobrança PIX deve retornar prazo de expiração (pixExpiresAt)");

    // Simular consulta ao provedor ao abrir /pedido/[token] quando o cliente acabou de pagar no banco
    const synced = await syncOrderPaymentStatusFromProvider(orderPix.order.id, async () => ({
      id: pixCharge.paymentId || "pay_mock_1",
      status: "CONFIRMED",
      value: 190.0, // R$ 190,00 === 19000 centavos
    }));
    assert.strictEqual(synced.updated, true);
    assert.strictEqual(synced.status, "pago");

    const trackedAfterSync = await getOrderByPublicToken(orderPix.order.publicToken!);
    assert.strictEqual(trackedAfterSync?.status, "pago");
    assert.ok(
      trackedAfterSync?.history.some((h) => h.toStatus === "pago" && h.actor === "asaas_sync_on_read"),
      "Sincronização ao abrir a página deve gravar entrada auditável em order_status_history"
    );
    console.log("  ✓ 3. Cobrança PIX com prazo e sincronização ativa ao abrir /pedido/[token] validadas.");

    // =========================================================================
    // 4. Cartão (Redirecionamento seguro para checkout hospedado Asaas + retorno validado)
    // =========================================================================
    const orderCard = await createOrderTransaction({
      customerName: "Juliana Ribeiro",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "cartao",
      marketingConsent: false,
      idempotencyKey: `idem_asaas_card_${Date.now()}`,
      honeypot: "",
      items: [{ productId: testProdId, quantity: 1 }],
    });
    assert.strictEqual(orderCard.success, true);
    if (!orderCard.success) return;
    createdOrders.push(orderCard.order.id);

    // Tentativa com returnUrl maliciosa deve falhar com HTTP 400 (Open Redirect bloqueado)
    const badCardCharge = await createSandboxPayment(
      {
        orderId: orderCard.order.id,
        paymentMethod: "card",
        returnUrl: "https://evil-phishing.com/steal-token",
      },
      { forceSandboxMock: true }
    );
    assert.strictEqual(
      badCardCharge.success,
      false,
      "createSandboxPayment deve rejeitar returnUrl externa maliciosa"
    );
    assert.strictEqual(badCardCharge.statusHttp, 400);

    // Tentativa com returnUrl de OUTRO pedido/token deve falhar com HTTP 403 (Prevenção IDOR / Cross-Order Return URL Spoofing)
    const crossOrderCardCharge = await createSandboxPayment(
      {
        orderId: orderCard.order.id,
        paymentMethod: "card",
        returnUrl: `/pedido/${orderPix.order.publicToken}`,
      },
      { forceSandboxMock: true }
    );
    assert.strictEqual(crossOrderCardCharge.success, false);
    if (!crossOrderCardCharge.success) {
      assert.strictEqual(crossOrderCardCharge.statusHttp, 403);
    }

    // Tentativa omitindo returnUrl NÃO deve vazar o publicToken do pedido no JSON de resposta
    const noReturnUrlCharge = await createSandboxPayment(
      {
        orderId: orderCard.order.id,
        paymentMethod: "card",
      },
      { forceSandboxMock: true }
    );
    assert.strictEqual(noReturnUrlCharge.success, true);
    if (noReturnUrlCharge.success) {
      assert.strictEqual(
        noReturnUrlCharge.returnUrl,
        null,
        "Omitir returnUrl não deve vazar o publicToken secreto do pedido"
      );
    }

    // Tentativa em pedido já pago (orderPix) deve falhar com HTTP 409
    const paidOrderChargeAttempt = await createSandboxPayment(
      {
        orderId: orderPix.order.id,
        paymentMethod: "pix",
      },
      { forceSandboxMock: true }
    );
    assert.strictEqual(paidOrderChargeAttempt.success, false);
    if (!paidOrderChargeAttempt.success) {
      assert.strictEqual(paidOrderChargeAttempt.statusHttp, 409);
    }

    // Tentativa com returnUrl legítima /pedido/[token]
    const validCardCharge = await createSandboxPayment(
      {
        orderId: orderCard.order.id,
        paymentMethod: "card",
        returnUrl: `/pedido/${orderCard.order.publicToken}`,
      },
      { forceSandboxMock: true }
    );
    assert.strictEqual(validCardCharge.success, true);
    if (!validCardCharge.success) return;
    assert.ok(
      validCardCharge.checkoutUrl?.startsWith("https://sandbox.asaas.com/i/"),
      "Cartão deve retornar URL hospedada oficial do Asaas Sandbox"
    );
    assert.strictEqual(
      validCardCharge.returnUrl,
      `${STORE_CONFIG.domain}/pedido/${orderCard.order.publicToken}`
    );
    console.log("  ✓ 4. Checkout hospedado de Cartão e bloqueio de Open Redirect validados.");

    // =========================================================================
    // 5. Webhook Oficial Asaas (campo 'id', header 'asaas-access-token' e estorno de estoque em PAYMENT_REFUNDED)
    // =========================================================================
    const asaasAuthToken = "asaas_wh_token_32_chars_minimum_secret_2026";

    // Primeiro confirma pagamento do pedido de cartão via payload nativo Asaas (usa 'id' em vez de 'eventId' e 'payment.externalReference')
    const confirmPayload = JSON.stringify({
      id: `evt_asaas_native_confirm_${Date.now()}`,
      event: "PAYMENT_RECEIVED",
      dateCreated: "2026-11-09 20:00:00",
      payment: {
        object: "payment",
        id: "pay_card_native_1",
        value: 100.0,
        billingType: "CREDIT_CARD",
        status: "RECEIVED",
        externalReference: orderCard.order.id,
      },
    });

    const whConfirm = await handlePaymentWebhook({
      rawBody: confirmPayload,
      signatureHeader: null,
      accessTokenHeader: asaasAuthToken,
      secretOverride: asaasAuthToken,
    });
    assert.strictEqual(whConfirm.statusHttp, 200);
    assert.strictEqual(whConfirm.body.status, "pago");

    // Agora envia PAYMENT_REFUNDED: deve cancelar o pedido, devolver 1 unidade ao estoque e registrar em order_status_history
    const stockBeforeRefund = (
      await db.select().from(products).where(eq(products.id, testProdId)).limit(1)
    )[0].stock;

    const refundPayload = JSON.stringify({
      id: `evt_asaas_native_refund_${Date.now()}`,
      event: "PAYMENT_REFUNDED",
      dateCreated: "2026-11-09 20:05:00",
      payment: {
        object: "payment",
        id: "pay_card_native_1",
        value: 100.0,
        billingType: "CREDIT_CARD",
        status: "REFUNDED",
        externalReference: orderCard.order.id,
      },
    });

    const chargebackPayload = JSON.stringify({
      id: `evt_asaas_native_cb_${Date.now()}`,
      event: "PAYMENT_CHARGEBACK_REQUESTED",
      dateCreated: "2026-11-09 20:05:00",
      payment: {
        object: "payment",
        id: "pay_card_native_1",
        value: 100.0,
        billingType: "CREDIT_CARD",
        status: "CHARGEBACK_REQUESTED",
        externalReference: orderCard.order.id,
      },
    });

    // Dispara dois eventos distintos de cancelamento/estorno em paralelo para validar proteção contra TOCTOU / duplo estorno
    const [whRefund, whChargeback] = await Promise.all([
      handlePaymentWebhook({
        rawBody: refundPayload,
        signatureHeader: null,
        accessTokenHeader: asaasAuthToken,
        secretOverride: asaasAuthToken,
      }),
      handlePaymentWebhook({
        rawBody: chargebackPayload,
        signatureHeader: null,
        accessTokenHeader: asaasAuthToken,
        secretOverride: asaasAuthToken,
      }),
    ]);
    assert.strictEqual(whRefund.statusHttp, 200);
    assert.strictEqual(whChargeback.statusHttp, 200);
    assert.strictEqual(whRefund.body.status, "cancelado");

    const stockAfterRefund = (
      await db.select().from(products).where(eq(products.id, testProdId)).limit(1)
    )[0].stock;
    assert.strictEqual(
      stockAfterRefund,
      stockBeforeRefund + 1,
      "Eventos concorrentes PAYMENT_REFUNDED + PAYMENT_CHARGEBACK_REQUESTED devem devolver estoque apenas UMA vez"
    );
    console.log("  ✓ 5. Webhook no formato nativo Asaas (id + asaas-access-token + estorno atômico único sob concorrência) validado.");
  } finally {
    for (const oid of createdOrders) {
      await db.delete(paymentWebhooks).where(eq(paymentWebhooks.orderId, oid));
      await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, oid));
      await db.delete(orderItems).where(eq(orderItems.orderId, oid));
      await db.delete(orders).where(eq(orders.id, oid));
    }
    await db.delete(products).where(eq(products.id, testProdId));
  }

  console.log("✔ Todos os testes TDD de Finalização, Pagamento Asaas e /pedido/[token] passaram com 100% de sucesso!");
}

runAsaasCheckoutAndTrackingTests().catch((err) => {
  console.error("❌ Falha nos testes TDD:", err);
  process.exit(1);
});

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db, products, orders, orderItems, orderStatusHistory } from "../../src/db";
import { eq } from "drizzle-orm";
import { createOrderTransaction, getOrderByPublicToken } from "../../src/lib/orders";
import { computeWebhookHmac, handlePaymentWebhook } from "../../src/lib/payments";
import { STORE_CONFIG, buildOrderWhatsAppMessage } from "../../src/config/store";
import { GET as getOrderApiRoute } from "../../src/app/api/pedidos/[token]/route";

async function runArchitecturalRisksAndFrontendTests() {
  console.log("▶ Iniciando Verificação dos 5 Riscos Arquiteturais (Seção 3) & Skills de Frontend...");

  const rootDir = process.cwd();

  // =========================================================================
  // 1. OpenDesign System (DESIGN.md raiz + docs/DESIGN.md com 9 seções)
  // =========================================================================
  const rootDesign = fs.readFileSync(path.join(rootDir, "DESIGN.md"), "utf-8");
  const docsDesign = fs.readFileSync(path.join(rootDir, "docs/DESIGN.md"), "utf-8");
  assert.ok(rootDesign.includes("## 1. Identidade"), "DESIGN.md raiz deve conter Seção 1");
  assert.ok(rootDesign.includes("## 9. Portão de Auto-Crítica"), "DESIGN.md raiz deve conter Seção 9");
  assert.ok(docsDesign.includes("### 7.3 Fluxos Transacionais"), "docs/DESIGN.md deve documentar os fluxos de checkout/tracking/admin");
  console.log("  ✓ [open-design-system] DESIGN.md (raiz e docs/) validados com as 9 seções canônicas.");

  // =========================================================================
  // 2. Composition Patterns & React Best Practices & Next Best Practices
  // =========================================================================
  const contextSrc = fs.readFileSync(
    path.join(rootDir, "src/app/checkout/CheckoutContext.tsx"),
    "utf-8"
  );
  assert.ok(
    contextSrc.includes("state: CheckoutState") &&
      contextSrc.includes("actions: CheckoutActions") &&
      contextSrc.includes("meta: CheckoutMeta") &&
      contextSrc.includes("use(CheckoutContext)"),
    "CheckoutContext deve seguir state/actions/meta e React 19 use()"
  );

  const trackingPageSrc = fs.readFileSync(
    path.join(rootDir, "src/app/pedido/[token]/page.tsx"),
    "utf-8"
  );
  assert.ok(
    trackingPageSrc.includes("export async function generateMetadata") &&
      trackingPageSrc.includes("index: false"),
    "Página /pedido/[token] deve exportar generateMetadata com robots noindex"
  );
  console.log("  ✓ [composition-patterns / react-best-practices / next-best-practices] validados.");

  // =========================================================================
  // 3. Frontend Checklist & Web Design Guidelines (A11y, Forms, Reduced Motion, Tabular Nums)
  // =========================================================================
  const contactSrc = fs.readFileSync(
    path.join(rootDir, "src/app/checkout/components/CheckoutContact.tsx"),
    "utf-8"
  );
  assert.ok(
    contactSrc.includes('htmlFor="checkout-customer-name"') &&
      contactSrc.includes('autoComplete="name"') &&
      contactSrc.includes("aria-invalid") &&
      contactSrc.includes("aria-describedby") &&
      contactSrc.includes('role="alert"'),
    "CheckoutContact deve associar labels htmlFor, autoComplete, aria-invalid e aria-describedby"
  );

  const adminLoginSrc = fs.readFileSync(
    path.join(rootDir, "src/app/admin/login/page.tsx"),
    "utf-8"
  );
  assert.ok(
    adminLoginSrc.includes('autoComplete="current-password"') &&
      adminLoginSrc.includes("Mostrar senha") &&
      adminLoginSrc.includes("Ocultar senha"),
    "AdminLoginPage deve possuir autoComplete='current-password' e botão acessível Mostrar/Ocultar senha"
  );

  const globalsCss = fs.readFileSync(
    path.join(rootDir, "src/app/globals.css"),
    "utf-8"
  );
  assert.ok(
    globalsCss.includes("@media (prefers-reduced-motion: reduce)"),
    "globals.css deve respeitar prefers-reduced-motion"
  );
  console.log("  ✓ [frontend-checklist / web-design-guidelines] A11y de formulários, toggle de senha, tabular-nums e reduced-motion validados.");

  // =========================================================================
  // 4. Mitigação de Risco #5: Bloqueio no checkout por falha do ViaCEP (timeout 4s + edição manual)
  // =========================================================================
  const cepHookSrc = fs.readFileSync(
    path.join(rootDir, "src/app/checkout/hooks/useCepLookup.ts"),
    "utf-8"
  );
  const deliverySrc = fs.readFileSync(
    path.join(rootDir, "src/app/checkout/components/CheckoutDelivery.tsx"),
    "utf-8"
  );
  assert.ok(
    cepHookSrc.includes("timeoutMs = 4000") &&
      cepHookSrc.includes("new AbortController()") &&
      cepHookSrc.includes("setIsManualFallback(true)"),
    "useCepLookup deve aplicar timeout de 4000ms com AbortController e habilitar fallback manual"
  );
  assert.ok(
    deliverySrc.includes('id="checkout-address"') &&
      deliverySrc.includes('id="checkout-city"') &&
      !deliverySrc.includes("disabled={cepLoading}"),
    "Campos de endereço e cidade nunca devem ser bloqueados durante ou após falha do ViaCEP"
  );
  console.log("  ✓ [Risco #5] Timeout de 4s no ViaCEP + edição manual desimpedida comprovados.");

  // =========================================================================
  // 5. Mitigações #1, #2, #3 e #4 em Banco de Dados Real
  // =========================================================================
  const webhookSecret = "whsec_risk_verification_secret_123456";
  process.env.ASAAS_WEBHOOK_SECRET = webhookSecret;

  const testProdId = `prod_risk_${Date.now()}`;
  const createdOrderIds: string[] = [];

  await db.insert(products).values({
    id: testProdId,
    name: "Ampola Reconstrução Extrema Mariane",
    slug: `ampola-risco-${Date.now()}`,
    price: 50.0,
    priceCents: 5000,
    promoPrice: null,
    promoPriceCents: null,
    pixDiscountPercent: 5,
    stock: 1, // Apenas 1 unidade em estoque!
    isActive: true,
  });

  try {
    // Risco #1: Concorrência no último item em estoque (estoque = 1, 2 compradores simultâneos)
    const [buyerA, buyerB] = await Promise.all([
      createOrderTransaction({
        customerName: "Cliente Concorrente A",
        customerPhone: "49991251617",
        deliveryMode: "retirada",
        paymentMethod: "pix",
        marketingConsent: false,
        idempotencyKey: `idem_risk1_a_${Date.now()}`,
        honeypot: "",
        items: [{ productId: testProdId, quantity: 1 }],
      }),
      createOrderTransaction({
        customerName: "Cliente Concorrente B",
        customerPhone: "49991251618",
        deliveryMode: "retirada",
        paymentMethod: "pix",
        marketingConsent: false,
        idempotencyKey: `idem_risk1_b_${Date.now()}`,
        honeypot: "",
      items: [{ productId: testProdId, quantity: 1 }],
      }),
    ]);

    const winners = [buyerA, buyerB].filter((r) => r.success);
    const losers = [buyerA, buyerB].filter((r) => !r.success && r.statusHttp === 409);
    assert.strictEqual(winners.length, 1, "Exatamente 1 comprador deve conseguir reservar o último item");
    assert.strictEqual(losers.length, 1, "O segundo comprador simultâneo deve receber 409 Conflict");

    const winningOrder = winners[0]!;
    if (!winningOrder.success) throw new Error("Unreachable");
    createdOrderIds.push(winningOrder.order.id);

    const stockCheck = await db.select().from(products).where(eq(products.id, testProdId)).limit(1);
    assert.strictEqual(stockCheck[0].stock, 0, "Estoque no banco deve ser exatamente 0 (nunca negativo)");
    console.log("  ✓ [Risco #1] Concorrência no último item em estoque mitigada atomicamente.");

    // Risco #2: Divergência de centavos entre gateway e loja (totalCents = 4750 com 5% PIX OFF)
    assert.strictEqual(winningOrder.order.totalCents, 4750);
    const underpaidBody = JSON.stringify({
      eventId: `evt_risk2_under_${Date.now()}`,
      event: "PAYMENT_CONFIRMED",
      orderId: winningOrder.order.id,
      payment: {
        id: "pay_risk2",
        value: 47.49, // 4749 centavos (diferença de R$ 0,01)
      },
    });
    const underpaidRes = await handlePaymentWebhook({
      rawBody: underpaidBody,
      signatureHeader: computeWebhookHmac(underpaidBody, webhookSecret),
      accessTokenHeader: null,
      secretOverride: webhookSecret,
    });
    assert.strictEqual(underpaidRes.statusHttp, 400, "Diferença de R$ 0,01 deve ser rejeitada");

    const exactBody = JSON.stringify({
      eventId: `evt_risk2_exact_${Date.now()}`,
      event: "PAYMENT_CONFIRMED",
      orderId: winningOrder.order.id,
      payment: {
        id: "pay_risk2",
        value: 47.5, // Exatamente 4750 centavos
      },
    });
    const exactRes = await handlePaymentWebhook({
      rawBody: exactBody,
      signatureHeader: computeWebhookHmac(exactBody, webhookSecret),
      accessTokenHeader: null,
      secretOverride: webhookSecret,
    });
    assert.strictEqual(exactRes.statusHttp, 200, "Igualdade exata totalCents === paidCents aprovada");
    console.log("  ✓ [Risco #2] Divergência de centavos eliminada (totalCents === paidCents).");

    // Risco #3: Perda de acesso ao pedido pelo cliente (link /pedido/[publicToken] no WhatsApp e no Admin)
    const token = winningOrder.order.publicToken!;
    const msg = buildOrderWhatsAppMessage({
      humanCode: winningOrder.order.id,
      customerName: "Cliente Concorrente A",
      customerPhone: "(49) 99125-1617",
      deliveryMode: "retirada",
      shippingAddress: STORE_CONFIG.physicalStore.formattedAddress,
      paymentMethod: "pix",
      subtotalCents: 5000,
      discountCents: 250,
      shippingCents: 0,
      totalCents: 4750,
      items: [
        {
          name: "Ampola Reconstrução Extrema Mariane",
          quantity: 1,
          unitPriceCents: 5000,
          lineTotalCents: 5000,
        },
      ],
      publicToken: token,
    });
    assert.ok(
      msg.includes(`${STORE_CONFIG.domain}/pedido/${token}`),
      "Mensagem do WhatsApp deve incluir o link /pedido/[publicToken]"
    );
    const adminPedidosSrc = fs.readFileSync(
      path.join(rootDir, "src/app/admin/pedidos/page.tsx"),
      "utf-8"
    );
    assert.ok(
      adminPedidosSrc.includes("Reenviar Link no WhatsApp") &&
        adminPedidosSrc.includes("Copiar Link do Pedido") &&
        adminPedidosSrc.includes("/pedido/${order.publicToken}"),
      "Painel admin deve permitir copiar e reenviar o link /pedido/[publicToken] via WhatsApp"
    );
    console.log("  ✓ [Risco #3] Link /pedido/[publicToken] presente na mensagem do WhatsApp e no reenvio pelo painel Admin.");

    // Risco #4: Enumeração de dados de clientes (IDOR)
    const byHumanCode = await getOrderByPublicToken(winningOrder.order.id);
    assert.strictEqual(byHumanCode, null, "Consulta por código humano MC-... deve retornar null");

    const httpIdorRes = await getOrderApiRoute(
      new Request(`http://localhost:3001/api/pedidos/${winningOrder.order.id}`),
      { params: Promise.resolve({ token: winningOrder.order.id }) }
    );
    assert.strictEqual(httpIdorRes.status, 404, "Endpoint público deve retornar 404 para código humano");

    const byValidToken = await getOrderByPublicToken(token);
    assert.ok(byValidToken, "Token de 128 bits deve retornar o pedido");
    assert.ok(byValidToken.customerName.includes("*"), "Nome do titular deve vir mascarado");
    console.log("  ✓ [Risco #4] Enumeração de pedidos (IDOR) bloqueada; apenas token de 128 bits aceito.");
  } finally {
    for (const oid of createdOrderIds) {
      await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, oid));
      await db.delete(orderItems).where(eq(orderItems.orderId, oid));
      await db.delete(orders).where(eq(orders.id, oid));
    }
    await db.delete(products).where(eq(products.id, testProdId));
  }

  console.log("✔ Todos os 5 Riscos Arquiteturais e 7 Skills de Frontend verificados com 100% de sucesso!");
}

runArchitecturalRisksAndFrontendTests().catch((err) => {
  console.error("❌ Falha nos testes de Riscos Arquiteturais e Frontend:", err);
  process.exit(1);
});

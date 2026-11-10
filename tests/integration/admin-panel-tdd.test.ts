import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { db, orders, orderItems, orderStatusHistory, products } from "../../src/db";
import { eq } from "drizzle-orm";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  verifyAdminPassword,
  verifyAdminSessionToken,
  sanitizeCsvCell,
  generateOrdersCsv,
} from "../../src/lib/admin-auth";
import { queryAdminOrders } from "../../src/lib/admin-orders";

async function runAdminPanelTddTests() {
  console.log("▶ Iniciando testes TDD do Painel da Loja (Item K: /admin/login e /admin/pedidos)...");

  // 1. Autenticação, Cookie Assinado e Expiração
  process.env.ADMIN_PASSWORD = "test_admin_secret_password_2026";
  assert.strictEqual(verifyAdminPassword("test_admin_secret_password_2026"), true);
  assert.strictEqual(verifyAdminPassword("senha_errada"), false);

  const validToken = createAdminSessionToken();
  assert.strictEqual(verifyAdminSessionToken(validToken), true);
  assert.strictEqual(verifyAdminSessionToken(`${validToken}tampered`), false);

  // 2. Sanitização CSV contra Formula Injection (=, +, -, @ inclusive com espaço inicial)
  assert.strictEqual(sanitizeCsvCell("=1+1"), `"'=1+1"`);
  assert.strictEqual(sanitizeCsvCell("+SUM(A1:A2)"), `"'+SUM(A1:A2)"`);
  assert.strictEqual(sanitizeCsvCell("-2+3"), `"'-2+3"`);
  assert.strictEqual(sanitizeCsvCell("@IMPORTXML()"), `"'@IMPORTXML()"`);
  assert.strictEqual(
    sanitizeCsvCell("  =CMD|' /C calc'!A0"),
    `"'  =CMD|' /C calc'!A0"`,
    "Deve escapar fórmulas mesmo quando precedidas por espaços em branco"
  );

  const csvOut = generateOrdersCsv([
    {
      id: "MC-20261109-CSV001",
      createdAt: "2026-11-09T12:00:00.000Z",
      customerName: "=Cliente Malicioso",
      customerPhone: "+5549991251617",
      deliveryMode: "retirada",
      paymentMethod: "pix",
      status: "pago",
      totalCents: 12590,
      notes: "@nota",
    },
  ]);
  assert.ok(csvOut.includes(`"'=Cliente Malicioso"`));
  assert.ok(csvOut.includes(`"'+5549991251617"`));
  assert.ok(csvOut.includes(`"'@nota"`));
  assert.ok(csvOut.includes(`"125.90"`));
  console.log("  ✓ 1 & 2. Autenticação HMAC e Sanitização CSV (= + - @) validadas.");

  // 3. Consulta Paginada com Filtro por Status e Busca por Código ou Telefone (com ou sem máscara)
  const existingProd = (await db.select({ id: products.id }).from(products).limit(1))[0];
  const validProductId = existingProd?.id || "prod-1";
  const testIds = [
    `MC-ADM-TDD-1-${Date.now()}`,
    `MC-ADM-TDD-2-${Date.now()}`,
    `MC-ADM-TDD-3-${Date.now()}`,
  ];

  try {
    for (let i = 0; i < testIds.length; i++) {
      const id = testIds[i];
      const status = i === 2 ? "pago" : "aguardando_confirmacao";
      await db.insert(orders).values({
        id,
        publicToken: `deadbeef00000000000000000000000${i}`,
        idempotencyKey: `idem_adm_tdd_${id}`,
        customerName: `Cliente Painel ${i + 1}`,
        customerPhone: `4998877665${i}`,
        customerEmail: null,
        channel: "online",
        status,
        total: 100 + i * 10,
        subtotalCents: (100 + i * 10) * 100,
        shippingCents: 0,
        discountCents: 0,
        totalCents: (100 + i * 10) * 100,
        deliveryMode: i % 2 === 0 ? "retirada" : "entrega",
        paymentMethod: "whatsapp",
        shippingAddress: "Rua Blumenau, Nº 623, Lages – SC",
        notes: `Observação do pedido ${i + 1}`,
        marketingConsent: 0,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date(Date.now() + i * 1000).toISOString(),
      });

      await db.insert(orderItems).values({
        id: `item_${id}_1`,
        orderId: id,
        productId: validProductId,
        productName: `Produto Teste ${i + 1}`,
        quantity: 1,
        unitPrice: 100 + i * 10,
        unitPriceCents: (100 + i * 10) * 100,
        lineTotalCents: (100 + i * 10) * 100,
      });

      await db.insert(orderStatusHistory).values({
        id: `hist_${id}_1`,
        orderId: id,
        fromStatus: null,
        toStatus: status,
        actor: "customer",
        notes: "Criado no teste TDD",
        createdAt: new Date(Date.now() + i * 1000).toISOString(),
      });
    }

    // Busca paginada página 1 com limit 2 filtrando pelo prefixo MC-ADM-TDD-
    const page1 = await queryAdminOrders({
      search: "MC-ADM-TDD-",
      status: "todos",
      page: 1,
      limit: 2,
    });
    assert.strictEqual(page1.orders.length, 2, "Página 1 com limit=2 deve retornar 2 pedidos");
    assert.strictEqual(page1.pagination.total, 3, "Total de pedidos filtrados deve ser 3");
    assert.strictEqual(page1.pagination.totalPages, 2, "Total de páginas deve ser 2");
    assert.strictEqual(page1.pagination.hasNextPage, true);
    assert.strictEqual(page1.pagination.hasPrevPage, false);

    // Página 2 com limit 2 deve retornar 1 pedido
    const page2 = await queryAdminOrders({
      search: "MC-ADM-TDD-",
      status: "todos",
      page: 2,
      limit: 2,
    });
    assert.strictEqual(page2.orders.length, 1, "Página 2 com limit=2 deve retornar 1 pedido");
    assert.strictEqual(page2.pagination.hasNextPage, false);
    assert.strictEqual(page2.pagination.hasPrevPage, true);

    // Filtro por status 'pago' + busca
    const paidOnly = await queryAdminOrders({
      search: "MC-ADM-TDD-",
      status: "pago",
      page: 1,
      limit: 10,
    });
    assert.strictEqual(paidOnly.orders.length, 1);
    assert.strictEqual(paidOnly.orders[0].id, testIds[2]);
    assert.strictEqual(paidOnly.orders[0].items.length, 1);
    assert.strictEqual(paidOnly.orders[0].history.length, 1);

    // Busca por telefone formatado "(49) 98877-6650" deve encontrar "49988776650"
    const byFormattedPhone = await queryAdminOrders({
      search: "(49) 98877-6650",
      status: "todos",
      page: 1,
      limit: 10,
    });
    assert.ok(
      byFormattedPhone.orders.some((o) => o.id === testIds[0]),
      "Busca por telefone com máscara (49) 98877-6650 deve localizar o pedido gravado com dígitos 49988776650"
    );
    console.log("  ✓ 3. Paginação real (page/limit/totalPages), filtro por status e busca por código/telefone validados.");

    // 4. Verificação da UI Mobile-First de /admin/pedidos (detalhe com itens, histórico, paginação e WhatsApp)
    const adminPedidosUi = fs.readFileSync(
      path.join(process.cwd(), "src/app/admin/pedidos/page.tsx"),
      "utf-8"
    );
    assert.ok(
      adminPedidosUi.includes("order.history") &&
        (adminPedidosUi.includes("Histórico") || adminPedidosUi.includes("Linha do Tempo")),
      "/admin/pedidos deve exibir o histórico de status (order.history) no detalhe do pedido"
    );
    assert.ok(
      adminPedidosUi.includes("totalPages") || adminPedidosUi.includes("pagination"),
      "/admin/pedidos deve conter controles de paginação"
    );
    assert.ok(
      adminPedidosUi.includes("ALLOWED_STATUS_TRANSITIONS"),
      "/admin/pedidos deve exibir apenas as ações de status permitidas pela máquina de estados"
    );
    assert.ok(
      adminPedidosUi.includes("wa.me/"),
      "/admin/pedidos deve conter botão para abrir o WhatsApp do cliente"
    );
    console.log("  ✓ 4. Interface de /admin/pedidos (paginação, detalhe com itens + histórico, transições permitidas e WhatsApp) validada.");
  } finally {
    for (const id of testIds) {
      await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, id));
      await db.delete(orderItems).where(eq(orderItems.orderId, id));
      await db.delete(orders).where(eq(orders.id, id));
    }
  }

  console.log("✔ Todos os testes TDD do Painel da Loja passaram com 100% de sucesso!");
}

runAdminPanelTddTests().catch((err) => {
  console.error("❌ Falha nos testes TDD do Painel da Loja:", err);
  process.exit(1);
});

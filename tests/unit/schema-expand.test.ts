import { client, db, products, orders, orderItems, orderStatusHistory } from "../../src/db";
import { eq } from "drizzle-orm";

console.log("▶ Iniciando testes de validação do schema expandido...");

async function testSchema() {
  // 1. Verificar produtos com priceCents
  const sampleProducts = await db.select().from(products).limit(5);
  if (sampleProducts.length === 0) {
    throw new Error("Nenhum produto encontrado no banco para validação.");
  }

  for (const prod of sampleProducts) {
    if (prod.priceCents == null || typeof prod.priceCents !== "number") {
      throw new Error(`Produto ${prod.id} (${prod.name}) não tem priceCents preenchido!`);
    }
    const expectedCents = Math.round(prod.price * 100);
    if (prod.priceCents !== expectedCents) {
      throw new Error(`Divergência de centavos no produto ${prod.id}: esperado ${expectedCents}, obtido ${prod.priceCents}`);
    }
  }
  console.log(`  ✓ ${sampleProducts.length} produtos validados com priceCents em conformidade.`);

  // 2. Verificar pedidos com publicToken
  const sampleOrders = await db.select().from(orders).limit(5);
  for (const order of sampleOrders) {
    if (!order.publicToken) {
      throw new Error(`Pedido ${order.id} não possui publicToken!`);
    }
  }
  console.log(`  ✓ ${sampleOrders.length} pedidos validados com publicToken.`);

  // 3. Testar inserção e consulta em order_status_history
  const testOrderId = sampleOrders[0]?.id || "test-order-placeholder";
  const testHistoryId = `test_hist_${Date.now()}`;
  await db.insert(orderStatusHistory).values({
    id: testHistoryId,
    orderId: testOrderId,
    fromStatus: null,
    toStatus: "aguardando_confirmacao",
    actor: "system_test",
    notes: "Registro de teste do schema",
    createdAt: new Date().toISOString(),
  });

  const historyRecord = await db
    .select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.id, testHistoryId))
    .limit(1);

  if (historyRecord.length === 0 || historyRecord[0].toStatus !== "aguardando_confirmacao") {
    throw new Error("Falha ao gravar ou consultar registro em order_status_history!");
  }

  // Limpar registro de teste
  await db.delete(orderStatusHistory).where(eq(orderStatusHistory.id, testHistoryId));
  console.log("  ✓ Tabela order_status_history gravando e consultando perfeitamente.");

  // 4. Verificar índices criados no SQLite
  const indexes = await client.execute(`SELECT name FROM sqlite_master WHERE type = 'index'`);
  const indexNames = indexes.rows.map((r) => r.name as string);

  const expectedIndexes = [
    "idx_orders_public_token",
    "idx_orders_idempotency_key",
    "idx_orders_status_created",
    "idx_order_items_order_id",
    "idx_order_status_history_order_id",
    "idx_order_status_history_order_created",
  ];

  for (const exp of expectedIndexes) {
    if (!indexNames.includes(exp)) {
      throw new Error(`Índice esperado não encontrado no banco: ${exp}`);
    }
  }
  console.log("  ✓ Todos os 6 índices de alta performance verificados com sucesso.");

  console.log("✔ Testes do schema expandido concluídos com 100% de sucesso!");
}

testSchema().catch((err) => {
  console.error("Falha no teste do schema:", err);
  process.exit(1);
});

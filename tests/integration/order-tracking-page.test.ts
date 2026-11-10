import assert from "assert";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { client, db, products, orders, orderItems, orderStatusHistory } from "../../src/db";
import { eq } from "drizzle-orm";
import { createOrderTransaction, getOrderByPublicToken } from "../../src/lib/orders";

console.log("▶ Iniciando testes da Página /pedido/[token], Expiração Lazy e Política LGPD Art. 9º...");

async function runTrackingAndLgpdTests() {
  // 1. Verificar existência dos módulos de interface de /pedido/[token]
  const pagePath = path.resolve(process.cwd(), "src/app/pedido/[token]/page.tsx");
  const timelinePath = path.resolve(
    process.cwd(),
    "src/app/pedido/[token]/components/OrderStatusTimeline.tsx"
  );
  const pixActionPath = path.resolve(
    process.cwd(),
    "src/app/pedido/[token]/components/PixPaymentAction.tsx"
  );
  const summaryCardPath = path.resolve(
    process.cwd(),
    "src/app/pedido/[token]/components/OrderSummaryCard.tsx"
  );

  assert.strictEqual(fs.existsSync(pagePath), true, "src/app/pedido/[token]/page.tsx deve existir");
  assert.strictEqual(fs.existsSync(timelinePath), true, "OrderStatusTimeline.tsx deve existir");
  assert.strictEqual(fs.existsSync(pixActionPath), true, "PixPaymentAction.tsx deve existir");
  assert.strictEqual(fs.existsSync(summaryCardPath), true, "OrderSummaryCard.tsx deve existir");
  console.log("  ✓ 1. Arquivos modulares de /pedido/[token] presentes.");

  // 2. Testar Expiração Preguiçosa (Lazy Expiration) ao consultar pedido vencido via getOrderByPublicToken
  const testProdId = `prod_lazy_${Date.now()}`;
  await db.insert(products).values({
    id: testProdId,
    name: "Óleo Capilar Teste Lazy Expiration",
    slug: `oleo-lazy-${Date.now()}`,
    price: 80.0,
    priceCents: 8000,
    stock: 4,
    createdAt: new Date().toISOString(),
  });

  let orderId = "";
  try {
    const res = await createOrderTransaction({
      customerName: "Mariana Silveira",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "pix",
      items: [{ productId: testProdId, quantity: 2 }],
      idempotencyKey: crypto.randomUUID(),
      honeypot: "",
    });
    assert.strictEqual(res.success, true);
    if (!res.success) return;
    orderId = res.order.id;

    // Estoque caiu de 4 para 2
    const prodBefore = await db.select().from(products).where(eq(products.id, testProdId)).limit(1);
    assert.strictEqual(prodBefore[0].stock, 2);

    // Simular passagem de 25 horas retrocedendo expiresAt no banco
    const pastIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await db.update(orders).set({ expiresAt: pastIso }).where(eq(orders.id, orderId));

    // Consultar pelo publicToken (como /pedido/[token] faz)
    assert.ok(res.order.publicToken, "publicToken deve existir");
    const tracked = await getOrderByPublicToken(res.order.publicToken);
    assert.ok(tracked, "Pedido deve ser retornado");
    assert.strictEqual(
      tracked.status,
      "expirado",
      "Pedido vencido (>24h) deve transicionar automaticamente para 'expirado' na leitura"
    );

    // Estoque deve ter sido devolvido para 4!
    const prodAfter = await db.select().from(products).where(eq(products.id, testProdId)).limit(1);
    assert.strictEqual(
      prodAfter[0].stock,
      4,
      "Estoque reservado (2 un.) deve retornar automaticamente ao catálogo após Lazy Expiration"
    );
    console.log("  ✓ 2. Expiração Preguiçosa (Lazy Expiration) + devolução atômica de estoque comprovadas.");

    // 3. Verificar conformidade da página /politica-de-privacidade com os 7 elementos do Art. 9º da LGPD
    const privacyPath = path.resolve(
      process.cwd(),
      "src/app/politica-de-privacidade/page.tsx"
    );
    const privacySrc = fs.readFileSync(privacyPath, "utf8");
    const requiredCitations = [
      "Art. 7º, V",
      "Art. 7º, I",
      "Art. 9º",
      "Art. 18",
      "5 anos",
      "Asaas",
      "ViaCEP",
      "WhatsApp",
      "5549991251617",
    ];
    for (const term of requiredCitations) {
      assert.ok(
        privacySrc.includes(term),
        `Política de Privacidade deve mencionar explicitamente '${term}' (Art. 9º LGPD)`
      );
    }
    console.log("  ✓ 3. Política de Privacidade contém todos os elementos normativos do Art. 9º da LGPD.");

    console.log("✔ Todos os testes de /pedido/[token] e Política LGPD passaram com 100% de sucesso!");
  } finally {
    if (orderId) {
      await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId));
      await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
      await db.delete(orders).where(eq(orders.id, orderId));
    }
    await db.delete(products).where(eq(products.id, testProdId));
    void client;
  }
}

runTrackingAndLgpdTests().catch((err) => {
  console.error("Falha nos testes de /pedido/[token] e LGPD:", err);
  process.exit(1);
});

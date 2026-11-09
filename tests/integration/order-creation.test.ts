import { client, db, products, orders, orderItems } from "../../src/db";
import { eq } from "drizzle-orm";
import { createOrderTransaction, getOrderByPublicToken } from "../../src/lib/orders";

console.log("▶ Iniciando testes de integração da criação de pedidos...");

async function runIntegrationTests() {
  // 1. Setup: Criar produto de teste com estoque conhecido
  const testProdId = `prod_test_${Date.now()}`;
  await db.insert(products).values({
    id: testProdId,
    name: "Produto Teste Transacional",
    slug: `produto-teste-${Date.now()}`,
    price: 100.0,
    priceCents: 10000,
    promoPrice: 90.0,
    promoPriceCents: 9000,
    pixDiscountPercent: 5,
    stock: 5,
    createdAt: new Date().toISOString(),
  });

  console.log(`  + Produto de teste criado com estoque = 5: ${testProdId}`);

  try {
    // 2. Teste 1: Criação com Sucesso e Congelamento de Centavos
    const idempotencyKey1 = `idem_${Date.now()}_1`;
    const res1 = await createOrderTransaction({
      customerName: "Camila Teste",
      customerPhone: "49991251617",
      customerEmail: "camila@teste.com",
      deliveryMode: "retirada",
      paymentMethod: "pix",
      items: [{ productId: testProdId, quantity: 2 }],
      idempotencyKey: idempotencyKey1,
      honeypot: "",
    });

    if (!res1.success) {
      throw new Error(`Criação de pedido falhou: ${res1.errors?.join(", ")}`);
    }

    const order1 = res1.order;
    if (!order1.id.startsWith("MC-")) {
      throw new Error(`ID do pedido deve começar com MC-: ${order1.id}`);
    }
    if (!order1.publicToken || order1.publicToken.length < 32) {
      throw new Error(`publicToken inválido: ${order1.publicToken}`);
    }
    // Subtotal: 9000 * 2 = 18000 cents
    // PIX 5%: 900 cents
    // Frete retirada: 0
    // Total: 17100 cents
    if (order1.subtotalCents !== 18000) throw new Error(`Subtotal incorreto: ${order1.subtotalCents}`);
    if (order1.discountCents !== 900) throw new Error(`Desconto PIX incorreto: ${order1.discountCents}`);
    if (order1.totalCents !== 17100) throw new Error(`Total incorreto: ${order1.totalCents}`);

    // Verificar estoque debitado: 5 - 2 = 3
    const prodAfter1 = await db.select().from(products).where(eq(products.id, testProdId)).limit(1);
    if (prodAfter1[0].stock !== 3) {
      throw new Error(`Estoque esperado 3, obtido ${prodAfter1[0].stock}`);
    }
    console.log("  ✓ Pedido 1 criado com sucesso e estoque debitado para 3.");

    // 3. Teste 2: Idempotência com mesma idempotencyKey
    const resIdem = await createOrderTransaction({
      customerName: "Camila Teste",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "pix",
      items: [{ productId: testProdId, quantity: 2 }],
      idempotencyKey: idempotencyKey1, // Mesma chave!
      honeypot: "",
    });

    if (!resIdem.success) {
      throw new Error("Replay idempotente falhou!");
    }
    if (resIdem.order.id !== order1.id) {
      throw new Error("Idempotência deve devolver o mesmo ID de pedido");
    }

    // Estoque NÃO pode ter sido debitado novamente! Deve continuar 3
    const prodAfterIdem = await db.select().from(products).where(eq(products.id, testProdId)).limit(1);
    if (prodAfterIdem[0].stock !== 3) {
      throw new Error(`Estoque foi debitado indevidamente no replay! Estoque atual: ${prodAfterIdem[0].stock}`);
    }
    console.log("  ✓ Idempotência comprovada: mesmo pedido retornado e estoque inalterado.");

    // 4. Teste 3: Estoque Insuficiente com Rollback Transacional
    const resOutOfStock = await createOrderTransaction({
      customerName: "Lucas Comprador",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "whatsapp",
      items: [{ productId: testProdId, quantity: 10 }], // Pedindo 10, só tem 3
      idempotencyKey: `idem_${Date.now()}_outofstock`,
      honeypot: "",
    });

    if (resOutOfStock.success) {
      throw new Error("Deveria ter falhado por estoque insuficiente!");
    }
    if (resOutOfStock.statusHttp !== 409) {
      throw new Error(`Status HTTP deveria ser 409 Conflict, obtido ${resOutOfStock.statusHttp}`);
    }

    // Estoque deve continuar 3
    const prodAfterOos = await db.select().from(products).where(eq(products.id, testProdId)).limit(1);
    if (prodAfterOos[0].stock !== 3) {
      throw new Error(`Estoque foi alterado após falha! Atual: ${prodAfterOos[0].stock}`);
    }
    console.log("  ✓ Estoque insuficiente rejeitado com 409 e estoque preservado.");

    // 5. Teste 4: Concorrência no último item em estoque
    // Ajustar estoque para 1
    await db.update(products).set({ stock: 1 }).where(eq(products.id, testProdId));

    const pA = createOrderTransaction({
      customerName: "Cliente Concorrente A",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "whatsapp",
      items: [{ productId: testProdId, quantity: 1 }],
      idempotencyKey: `idem_${Date.now()}_concurrent_A`,
      honeypot: "",
    });

    const pB = createOrderTransaction({
      customerName: "Cliente Concorrente B",
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "whatsapp",
      items: [{ productId: testProdId, quantity: 1 }],
      idempotencyKey: `idem_${Date.now()}_concurrent_B`,
      honeypot: "",
    });

    const [rA, rB] = await Promise.all([pA, pB]);
    const successCount = (rA.success ? 1 : 0) + (rB.success ? 1 : 0);
    const failureCount = (!rA.success ? 1 : 0) + (!rB.success ? 1 : 0);

    if (successCount !== 1 || failureCount !== 1) {
      throw new Error(`Concorrência falhou: sucessos=${successCount}, falhas=${failureCount}`);
    }

    // Estoque deve ser exatamente 0 agora
    const prodAfterRace = await db.select().from(products).where(eq(products.id, testProdId)).limit(1);
    if (prodAfterRace[0].stock !== 0) {
      throw new Error(`Estoque final após corrida deveria ser 0, obtido ${prodAfterRace[0].stock}`);
    }
    console.log("  ✓ Concorrência no último item testada: exatamente 1 compra passou e 1 foi rejeitada.");

    // 6. Teste 5: Consulta Segura via publicToken
    const queriedOrder = await getOrderByPublicToken(order1.publicToken);
    if (!queriedOrder) {
      throw new Error("getOrderByPublicToken não localizou o pedido pelo token público!");
    }
    if (queriedOrder.id !== order1.id) {
      throw new Error("ID do pedido consultado diverge");
    }
    if (!queriedOrder.items || queriedOrder.items.length !== 1) {
      throw new Error("Itens do pedido não foram retornados na consulta por token");
    }
    console.log("  ✓ Consulta segura por publicToken 128-bit funcionando perfeitamente.");

    console.log("✔ Todos os testes de integração de pedidos passaram com 100% de sucesso!");
  } finally {
    // Limpeza do produto de teste e pedidos associados
    await client.execute(`DELETE FROM order_items WHERE product_id = '${testProdId}'`);
    await client.execute(`DELETE FROM products WHERE id = '${testProdId}'`);
  }
}

runIntegrationTests().catch((err) => {
  console.error("Falha nos testes de integração de pedidos:", err);
  process.exit(1);
});

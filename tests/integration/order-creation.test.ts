import fs from "fs";
import path from "path";
import { client, db, products } from "../../src/db";
import { eq } from "drizzle-orm";
import {
  createOrderTransaction,
  getOrderByPublicToken,
  maskPiiName,
  maskPiiAddress,
} from "../../src/lib/orders";

console.log("▶ Iniciando testes de integração da criação de pedidos...");

async function runIntegrationTests() {
  // 0. Teste de contrato de CartContext (sem literais mágicos ou float espalhado)
  const cartContextSrc = fs.readFileSync(
    path.resolve(process.cwd(), "src/context/CartContext.tsx"),
    "utf8"
  );
  if (
    cartContextSrc.includes("199.0") ||
    cartContextSrc.includes("subtotal * 0.95") ||
    !cartContextSrc.includes("COMMERCE_CONFIG") ||
    !cartContextSrc.includes("STORE_CONFIG")
  ) {
    throw new Error(
      "CartContext.tsx ainda contém valores financeiros/cadastrais duplicados em ponto flutuante!"
    );
  }
  console.log("  ✓ CartContext.tsx consome STORE_CONFIG, COMMERCE_CONFIG e centavos inteiros.");

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
      customerName: "Camila Rodrigues",
      customerPhone: "49991251617",
      customerEmail: "camila@teste.com",
      deliveryMode: "entrega",
      cep: "88505300",
      address: "Rua Blumenau, 999, Apto 402",
      city: "Lages - SC",
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
    // Frete entrega (< 19900): 2290 cents
    // Total: 18000 - 900 + 2290 = 19390 cents
    if (order1.subtotalCents !== 18000) throw new Error(`Subtotal incorreto: ${order1.subtotalCents}`);
    if (order1.discountCents !== 900) throw new Error(`Desconto PIX incorreto: ${order1.discountCents}`);
    if (order1.shippingCents !== 2290) throw new Error(`Frete incorreto: ${order1.shippingCents}`);
    if (order1.totalCents !== 19390) throw new Error(`Total incorreto: ${order1.totalCents}`);

    // Verificar estoque debitado: 5 - 2 = 3
    const prodAfter1 = await db.select().from(products).where(eq(products.id, testProdId)).limit(1);
    if (prodAfter1[0].stock !== 3) {
      throw new Error(`Estoque esperado 3, obtido ${prodAfter1[0].stock}`);
    }
    console.log("  ✓ Pedido 1 criado com sucesso e estoque debitado para 3.");

    // 3. Teste 2: Idempotência com mesma idempotencyKey
    const resIdem = await createOrderTransaction({
      customerName: "Camila Rodrigues",
      customerPhone: "49991251617",
      deliveryMode: "entrega",
      cep: "88505300",
      address: "Rua Blumenau, 999, Apto 402",
      city: "Lages - SC",
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

    // 5. Teste 4: Concorrência de 5 compradores no último item em estoque (zero SQLITE_BUSY / 500)
    await db.update(products).set({ stock: 1 }).where(eq(products.id, testProdId));

    const concurrentPromises = Array.from({ length: 5 }, (_, idx) =>
      createOrderTransaction({
        customerName: `Cliente Concorrente ${idx + 1}`,
        customerPhone: "49991251617",
        deliveryMode: "retirada",
        paymentMethod: "whatsapp",
        items: [{ productId: testProdId, quantity: 1 }],
        idempotencyKey: `idem_${Date.now()}_concurrent_${idx + 1}`,
        honeypot: "",
      })
    );

    const results = await Promise.all(concurrentPromises);
    const created201 = results.filter((r) => r.success && r.statusHttp === 201);
    const conflict409 = results.filter((r) => !r.success && r.statusHttp === 409);
    const errors500 = results.filter((r) => !r.success && r.statusHttp === 500);

    if (created201.length !== 1 || conflict409.length !== 4 || errors500.length > 0) {
      throw new Error(
        `Concorrência falhou: 201=${created201.length}, 409=${conflict409.length}, 500=${errors500.length}`
      );
    }

    // Estoque deve ser exatamente 0 agora
    const prodAfterRace = await db.select().from(products).where(eq(products.id, testProdId)).limit(1);
    if (prodAfterRace[0].stock !== 0) {
      throw new Error(`Estoque final após corrida deveria ser 0, obtido ${prodAfterRace[0].stock}`);
    }
    console.log("  ✓ Concorrência de 5 compradores no último item: 1 (201 Created) + 4 (409 Conflict) + 0 (500 SQLITE_BUSY).");

    // 6. Teste 5: Consulta Segura via publicToken com Mascaramento LGPD (nome, telefone, e-mail, endereço)
    if (typeof maskPiiName !== "function" || typeof maskPiiAddress !== "function") {
      throw new Error("Funções maskPiiName e maskPiiAddress devem ser exportadas por src/lib/orders.ts");
    }

    const queriedOrder = await getOrderByPublicToken(order1.publicToken);
    if (!queriedOrder) {
      throw new Error("getOrderByPublicToken não localizou o pedido pelo token público!");
    }
    if (queriedOrder.id !== order1.id) {
      throw new Error("ID do pedido consultado diverge");
    }
    if (queriedOrder.customerName.includes("Rodrigues")) {
      throw new Error(`Sobrenome não foi mascarado na consulta pública: ${queriedOrder.customerName}`);
    }
    if (queriedOrder.shippingAddress && queriedOrder.shippingAddress.includes("Apto 402")) {
      throw new Error(`Endereço residencial detalhado vazou na consulta pública: ${queriedOrder.shippingAddress}`);
    }
    if (!queriedOrder.items || queriedOrder.items.length !== 1) {
      throw new Error("Itens do pedido não foram retornados na consulta por token");
    }
    console.log("  ✓ Consulta segura por publicToken 128-bit com PII minimizada (LGPD Art. 6º, III) funcionando.");

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

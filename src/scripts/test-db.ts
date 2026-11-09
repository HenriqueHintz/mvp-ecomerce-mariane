import { db, products, brands, categories } from "../db";

async function test() {
  const pCount = await db.select().from(products);
  const bCount = await db.select().from(brands);
  const cCount = await db.select().from(categories);
  console.log("=== DIAGNÓSTICO DO BANCO ===");
  console.log("Marcas no banco:", bCount.length);
  console.log("Categorias no banco:", cCount.length);
  console.log("Produtos no banco:", pCount.length);
  if (pCount.length > 0) {
    console.log("Amostra 1:", pCount[0].name, "| R$", pCount[0].promoPrice);
    console.log("Amostra 2:", pCount[1].name, "| R$", pCount[1].promoPrice);
  }
}

test().catch(console.error);


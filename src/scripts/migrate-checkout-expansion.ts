import { client } from "../db";

async function runMigration() {
  console.log("▶ Iniciando migração de expansão do banco de dados (Expand Phase)...");

  // Helper para adicionar coluna se não existir
  async function addColumnIfNotExists(table: string, column: string, columnDef: string) {
    const tableInfo = await client.execute(`PRAGMA table_info(${table})`);
    const exists = tableInfo.rows.some((row) => row.name === column);
    if (!exists) {
      console.log(`  + Adicionando coluna ${table}.${column}...`);
      await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnDef}`);
    } else {
      console.log(`  ✓ Coluna ${table}.${column} já existe.`);
    }
  }

  // 1. Tabela products
  await addColumnIfNotExists("products", "price_cents", "INTEGER");
  await addColumnIfNotExists("products", "promo_price_cents", "INTEGER");

  // 2. Tabela orders
  await addColumnIfNotExists("orders", "public_token", "TEXT");
  await addColumnIfNotExists("orders", "idempotency_key", "TEXT");
  await addColumnIfNotExists("orders", "subtotal_cents", "INTEGER");
  await addColumnIfNotExists("orders", "shipping_cents", "INTEGER");
  await addColumnIfNotExists("orders", "discount_cents", "INTEGER");
  await addColumnIfNotExists("orders", "total_cents", "INTEGER");
  await addColumnIfNotExists("orders", "delivery_mode", "TEXT DEFAULT 'entrega'");
  await addColumnIfNotExists("orders", "marketing_consent", "INTEGER DEFAULT 0");
  await addColumnIfNotExists("orders", "expires_at", "TEXT");

  // 3. Tabela order_items
  await addColumnIfNotExists("order_items", "unit_price_cents", "INTEGER");
  await addColumnIfNotExists("order_items", "line_total_cents", "INTEGER");

  // 4. Nova tabela order_status_history
  console.log("  + Verificando tabela order_status_history...");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      actor TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 5. Índices de Alta Performance
  console.log("  + Criando índices de alta performance...");
  await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_public_token ON orders(public_token);`);
  await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_order_status_history_order_created ON order_status_history(order_id, created_at);`);

  // 6. Backfill de Dados Legados
  console.log("  + Executando backfill em produtos legados...");
  await client.execute(`
    UPDATE products
    SET price_cents = CAST(ROUND(price * 100) AS INTEGER),
        promo_price_cents = CASE WHEN promo_price IS NOT NULL AND promo_price > 0 THEN CAST(ROUND(promo_price * 100) AS INTEGER) ELSE NULL END
    WHERE price_cents IS NULL;
  `);

  console.log("  + Executando backfill em pedidos legados...");
  await client.execute(`
    UPDATE orders
    SET public_token = lower(hex(randomblob(16)))
    WHERE public_token IS NULL;
  `);

  await client.execute(`
    UPDATE orders
    SET total_cents = CAST(ROUND(total * 100) AS INTEGER),
        subtotal_cents = CAST(ROUND(total * 100) AS INTEGER),
        shipping_cents = 0,
        discount_cents = 0
    WHERE total_cents IS NULL;
  `);

  console.log("  + Executando backfill em itens de pedido legados...");
  await client.execute(`
    UPDATE order_items
    SET unit_price_cents = CAST(ROUND(unit_price * 100) AS INTEGER),
        line_total_cents = CAST(ROUND(unit_price * quantity * 100) AS INTEGER)
    WHERE unit_price_cents IS NULL;
  `);

  console.log("✔ Migração de expansão concluída com 100% de sucesso!");
}

runMigration().catch((err) => {
  console.error("Erro fatal na migração:", err);
  process.exit(1);
});

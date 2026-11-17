import { client } from "../db";

async function migrateCoupons() {
  console.log("▶ Aplicando migração aditiva: coupons, rate_limits e colunas em orders...");

  async function addColumnIfNotExists(
    table: string,
    column: string,
    columnDef: string
  ) {
    const tableInfo = await client.execute(`PRAGMA table_info(${table})`);
    const exists = tableInfo.rows.some((row) => row.name === column);
    if (!exists) {
      console.log(`  + Adicionando coluna ${table}.${column}...`);
      await client.execute(
        `ALTER TABLE ${table} ADD COLUMN ${column} ${columnDef}`
      );
    } else {
      console.log(`  ✓ Coluna ${table}.${column} já existe.`);
    }
  }

  // 1. Nova tabela coupons
  await client.execute(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      value INTEGER NOT NULL,
      min_subtotal_cents INTEGER NOT NULL DEFAULT 0,
      starts_at INTEGER,
      expires_at INTEGER,
      max_uses INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT
    );
  `);

  await client.execute(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);`
  );

  // 2. Nova tabela rate_limits (para rate-limit persistido de cupons)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      window_start INTEGER NOT NULL
    );
  `);

  // 3. Novas colunas em orders
  await addColumnIfNotExists("orders", "coupon_code", "TEXT");
  await addColumnIfNotExists(
    "orders",
    "coupon_discount_cents",
    "INTEGER DEFAULT 0"
  );

  // 4. Seed inicial do cupom oficial BEMVINDA10 (10% OFF acima de R$ 100,00)
  await client.execute({
    sql: `
      INSERT INTO coupons (
        id, code, type, value, min_subtotal_cents, starts_at, expires_at, max_uses, used_count, active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        type = excluded.type,
        value = excluded.value,
        min_subtotal_cents = excluded.min_subtotal_cents,
        active = 1
    `,
    args: [
      "coupon_bemvinda10",
      "BEMVINDA10",
      "percent",
      10,
      10000,
      null,
      null,
      null,
      0,
      1,
      new Date().toISOString(),
    ],
  });

  console.log("✔ Migração de cupons e seed BEMVINDA10 concluídos com sucesso!");
}

migrateCoupons().catch((err) => {
  console.error("✖ Erro ao migrar coupons:", err);
  process.exit(1);
});

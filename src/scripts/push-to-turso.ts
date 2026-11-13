/**
 * Copia o banco local (`local.sqlite`) — schema + dados — para o banco Turso
 * definido em TURSO_DATABASE_URL / TURSO_AUTH_TOKEN.
 *
 * Uso (PowerShell):
 *   $env:TURSO_DATABASE_URL="libsql://..."; $env:TURSO_AUTH_TOKEN="..."; npm run db:push-turso
 *
 * Copia só os dados do catálogo (marcas, categorias, produtos, imagens); as tabelas
 * de pedidos são criadas vazias. Use `--com-pedidos` para copiar tudo.
 *
 * Recusa rodar se o banco remoto já tiver tabelas, a menos que receba `--force`
 * (nesse caso as tabelas remotas são apagadas e recriadas).
 */
import { createClient, type InValue } from "@libsql/client";
import path from "path";

const remoteUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const force = process.argv.includes("--force");
// Por padrão copia só o catálogo; pedidos locais são de teste e não vão para produção.
const withOrders = process.argv.includes("--com-pedidos");
const CATALOG_TABLES = new Set(["brands", "categories", "products", "product_images"]);

if (!remoteUrl) {
  console.error("✖ Defina TURSO_DATABASE_URL (e TURSO_AUTH_TOKEN) antes de rodar.");
  process.exit(1);
}

const local = createClient({ url: `file:${path.resolve(process.cwd(), "local.sqlite")}` });
const remote = createClient({ url: remoteUrl, authToken });

type TableInfo = { name: string; sql: string };

async function listTables(): Promise<TableInfo[]> {
  const rs = await local.execute(
    "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%' AND sql IS NOT NULL"
  );
  return rs.rows.map((r) => ({ name: String(r.name), sql: String(r.sql) }));
}

/** Ordena as tabelas para que as referenciadas por FK sejam criadas/populadas antes. */
async function sortByDependencies(tables: TableInfo[]): Promise<TableInfo[]> {
  const names = new Set(tables.map((t) => t.name));
  const deps = new Map<string, Set<string>>();
  for (const t of tables) {
    const fk = await local.execute(`PRAGMA foreign_key_list("${t.name}")`);
    const parents = new Set(
      fk.rows.map((r) => String(r.table)).filter((p) => p !== t.name && names.has(p))
    );
    deps.set(t.name, parents);
  }
  const sorted: TableInfo[] = [];
  const done = new Set<string>();
  while (sorted.length < tables.length) {
    const next = tables.find(
      (t) => !done.has(t.name) && [...(deps.get(t.name) ?? [])].every((p) => done.has(p))
    );
    if (!next) throw new Error("Dependência circular entre tabelas.");
    sorted.push(next);
    done.add(next.name);
  }
  return sorted;
}

async function main() {
  const tables = await sortByDependencies(await listTables());

  const existing = await remote.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%'"
  );
  if (existing.rows.length > 0 && !force) {
    console.error(
      `✖ O banco remoto já tem ${existing.rows.length} tabela(s). Rode com --force para apagar e recriar.`
    );
    process.exit(1);
  }
  if (force) {
    for (const t of [...tables].reverse()) {
      await remote.execute(`DROP TABLE IF EXISTS "${t.name}"`);
    }
  }

  for (const t of tables) {
    await remote.execute(t.sql);
  }

  const indexes = await local.execute(
    "SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL"
  );
  for (const idx of indexes.rows) {
    await remote.execute(String(idx.sql));
  }

  for (const t of tables) {
    if (!withOrders && !CATALOG_TABLES.has(t.name)) {
      console.log(`  ${t.name}: tabela criada vazia (use --com-pedidos para copiar)`);
      continue;
    }
    const rows = await local.execute(`SELECT * FROM "${t.name}"`);
    if (rows.rows.length === 0) {
      console.log(`  ${t.name}: 0 linhas`);
      continue;
    }
    const cols = rows.columns;
    const placeholders = cols.map(() => "?").join(", ");
    const insertSql = `INSERT INTO "${t.name}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`;
    const BATCH = 200;
    for (let i = 0; i < rows.rows.length; i += BATCH) {
      const chunk = rows.rows.slice(i, i + BATCH).map((r) => ({
        sql: insertSql,
        args: cols.map((c) => r[c] as InValue),
      }));
      await remote.batch(chunk, "write");
    }
    console.log(`  ${t.name}: ${rows.rows.length} linhas`);
  }

  console.log("✔ Banco local copiado para o Turso.");
}

main().catch((err) => {
  console.error("✖ Falha ao copiar o banco:", err);
  process.exit(1);
});

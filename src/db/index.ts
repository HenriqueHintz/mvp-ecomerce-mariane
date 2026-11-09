import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";

// Caminho do arquivo SQLite local
const dbPath = path.resolve(process.cwd(), "local.sqlite");

// Cliente LibSQL puro (WASM/Native sem dependência de MSVC no Windows)
export const client = createClient({
  url: `file:${dbPath}`,
});

// PRAGMAs vitais para concorrência (WAL), integridade referencial e prevenção de SQLITE_BUSY
(async () => {
  try {
    await client.execute("PRAGMA journal_mode = WAL;");
    await client.execute("PRAGMA busy_timeout = 5000;");
    await client.execute("PRAGMA foreign_keys = ON;");
    await client.execute("PRAGMA synchronous = NORMAL;");
  } catch (err) {
    console.warn("Aviso ao aplicar PRAGMAs no SQLite:", err);
  }
})();

export const db = drizzle(client, { schema });

export * from "./schema";

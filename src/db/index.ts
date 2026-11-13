import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";

// Em produção (Vercel) o sistema de arquivos é somente leitura e o `local.sqlite`
// não é enviado no deploy: usamos um banco LibSQL hospedado (Turso) via variáveis
// de ambiente. Sem elas, cai no arquivo SQLite local (desenvolvimento e testes).
const remoteUrl = process.env.TURSO_DATABASE_URL;
const isRemote = Boolean(remoteUrl);

export const client = isRemote
  ? createClient({
      url: remoteUrl as string,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  : createClient({
      url: `file:${path.resolve(process.cwd(), "local.sqlite")}`,
    });

// PRAGMAs de arquivo local (WAL, busy_timeout) não se aplicam ao banco remoto.
(async () => {
  try {
    if (!isRemote) {
      await client.execute("PRAGMA journal_mode = WAL;");
      await client.execute("PRAGMA busy_timeout = 5000;");
      await client.execute("PRAGMA synchronous = NORMAL;");
    }
    await client.execute("PRAGMA foreign_keys = ON;");
  } catch (err) {
    console.warn("Aviso ao aplicar PRAGMAs no SQLite:", err);
  }
})();

export const db = drizzle(client, { schema });

export * from "./schema";

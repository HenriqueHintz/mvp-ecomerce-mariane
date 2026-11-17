import { client } from "../db";

async function migrateEmailVerifications() {
  console.log("▶ Aplicando migração aditiva: email_verifications...");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      sent_count INTEGER NOT NULL DEFAULT 1,
      last_sent_at TEXT NOT NULL,
      verified_at TEXT,
      ip_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(
    `CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications (email);`
  );
  await client.execute(
    `CREATE INDEX IF NOT EXISTS idx_email_verifications_created_at ON email_verifications (created_at);`
  );

  console.log("✔ Tabela email_verifications e índices aplicados com sucesso.");
}

migrateEmailVerifications().catch((err) => {
  console.error("✖ Erro ao migrar email_verifications:", err);
  process.exit(1);
});

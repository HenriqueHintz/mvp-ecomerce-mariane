-- Migration 0002 (UP): Email OTP Verifications (Expand Phase)
-- Aditiva e idempotente para execução segura em SQLite local e Turso preview/produção

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

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications (email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_created_at ON email_verifications (created_at);

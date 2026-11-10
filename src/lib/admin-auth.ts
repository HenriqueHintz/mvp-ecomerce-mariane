import crypto from "crypto";
import { STORE_CONFIG } from "@/config/store";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

function getEffectiveAdminSecret(overrideSecret?: string): string {
  return (overrideSecret ?? process.env.ADMIN_PASSWORD ?? "").trim();
}

export function verifyAdminPassword(
  inputPassword: string,
  overrideSecret?: string
): boolean {
  const secret = getEffectiveAdminSecret(overrideSecret);
  if (!secret || !inputPassword) return false;

  const inputHash = crypto.createHash("sha256").update(inputPassword, "utf8").digest();
  const secretHash = crypto.createHash("sha256").update(secret, "utf8").digest();
  return crypto.timingSafeEqual(inputHash, secretHash) && inputPassword.length === secret.length;
}

export function createAdminSessionToken(
  overrideSecret?: string,
  nowMs: number = Date.now()
): string {
  const secret = getEffectiveAdminSecret(overrideSecret);
  if (!secret) {
    throw new Error("ADMIN_PASSWORD não configurada no ambiente.");
  }
  const expiresAt = nowMs + ADMIN_SESSION_TTL_MS;
  const payload = `admin:${expiresAt}`;
  const sig = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return `${expiresAt}.${sig}`;
}

export function verifyAdminSessionToken(
  token: string | undefined | null,
  overrideSecret?: string,
  nowMs: number = Date.now()
): boolean {
  if (!token || typeof token !== "string") return false;
  const secret = getEffectiveAdminSecret(overrideSecret);
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [expiresStr, providedSig] = parts;
  const expiresAt = Number(expiresStr);
  if (!Number.isFinite(expiresAt) || expiresAt <= nowMs) {
    return false;
  }

  const payload = `admin:${expiresAt}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  const provHash = crypto.createHash("sha256").update(providedSig, "utf8").digest();
  const expHash = crypto.createHash("sha256").update(expectedSig, "utf8").digest();
  return crypto.timingSafeEqual(provHash, expHash) && providedSig.length === expectedSig.length;
}

/**
 * Validação de Origin/Host contra CSRF em mutações administrativas (defesa em profundidade além de SameSite).
 */
export function verifyAdminCsrfOrigin(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return false;
  }
  const origin = request.headers.get("origin");
  if (!origin) return true; // Requisições same-origin sem header Origin ou chamadas diretas de servidor
  try {
    const parsedOrigin = new URL(origin).origin;
    const reqUrl = new URL(request.url);
    const canonicalOrigin = new URL(STORE_CONFIG.domain).origin;
    return (
      parsedOrigin === reqUrl.origin ||
      parsedOrigin === canonicalOrigin ||
      (process.env.NODE_ENV !== "production" &&
        parsedOrigin === "http://localhost:3001")
    );
  } catch {
    return false;
  }
}

const DANGEROUS_CSV_PREFIXES = ["=", "+", "-", "@", "|", "\t", "\r", "\n"];

export function sanitizeCsvCell(value: unknown): string {
  const str = value == null ? "" : String(value);
  const trimmedLeading = str.trimStart();
  const needsPrefix =
    DANGEROUS_CSV_PREFIXES.some((prefix) => str.startsWith(prefix)) ||
    DANGEROUS_CSV_PREFIXES.some((prefix) => trimmedLeading.startsWith(prefix));
  const normalized = str.replace(/[\r\n]+/g, " ");
  const safeStr = needsPrefix ? `'${normalized}` : normalized;
  const escaped = safeStr.replace(/"/g, '""');
  return `"${escaped}"`;
}

export interface CsvOrderRow {
  id: string;
  createdAt?: string | null;
  customerName: string;
  customerPhone: string;
  deliveryMode?: string | null;
  paymentMethod?: string | null;
  status?: string | null;
  totalCents?: number | null;
  total?: number | null;
  notes?: string | null;
}

export function generateOrdersCsv(rows: CsvOrderRow[]): string {
  const headers = [
    "Codigo",
    "Data",
    "Cliente",
    "Telefone",
    "Modalidade",
    "Pagamento",
    "Status",
    "Total_BRL",
    "Observacoes",
  ];

  const lines = [headers.map((h) => sanitizeCsvCell(h)).join(",")];

  for (const row of rows) {
    const totalReais =
      row.totalCents != null
        ? (row.totalCents / 100).toFixed(2)
        : row.total != null
        ? Number(row.total).toFixed(2)
        : "0.00";

    const cells = [
      row.id,
      row.createdAt || "",
      row.customerName,
      row.customerPhone,
      row.deliveryMode || "entrega",
      row.paymentMethod || "whatsapp",
      row.status || "",
      totalReais,
      row.notes || "",
    ];
    lines.push(cells.map((c) => sanitizeCsvCell(c)).join(","));
  }

  return lines.join("\r\n");
}

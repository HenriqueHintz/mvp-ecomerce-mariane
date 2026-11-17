import crypto from "crypto";
import { z } from "zod";
import { and, desc, eq, gte, lt, isNull, sql } from "drizzle-orm";
import { db, emailVerifications } from "@/db";
import { maskPiiEmail, withSqliteWriteLock } from "@/lib/orders";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

export const EMAIL_VERIFICATION_COOKIE_NAME = "checkout_email_verified";
export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutos
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 segundos
export const HOUR_WINDOW_MS = 60 * 60 * 1000; // 1 hora
export const MAX_SENDS_PER_EMAIL_PER_HOUR = 5;
export const MAX_SENDS_PER_IP_PER_HOUR = 20;
export const MAX_ATTEMPTS_PER_CODE = 5;
export const VERIFIED_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos
export const VERIFIED_COOKIE_MAX_AGE_SECONDS = Math.floor(
  VERIFIED_TOKEN_TTL_MS / 1000
);
const CLEANUP_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 horas
const EPOCH_ISO = new Date(0).toISOString();

export const sendCodeRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail")
    .email("Informe um endereço de e-mail válido")
    .max(160, "E-mail muito longo")
    .transform((v) => v.toLowerCase()),
  honeypot: z
    .string()
    .max(0, "Acesso automatizado detectado")
    .optional()
    .default(""),
});

export const verifyCodeRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail")
    .email("Informe um endereço de e-mail válido")
    .max(160)
    .transform((v) => v.toLowerCase()),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "O código deve conter exatamente 6 dígitos numéricos."),
});

export function normalizeVerificationEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getCheckoutSecret(): string {
  const configured = (process.env.CHECKOUT_SECRET || "").trim();
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error("CHECKOUT_SECRET não configurada no ambiente de produção.");
  }

  // Fallback exclusivo para dev/test local sem variáveis configuradas
  return "mariane-dev-checkout-otp-secret";
}

function hashCode(normalizedEmail: string, code: string, secret: string): string {
  return crypto
    .createHash("sha256")
    .update(`${normalizedEmail}:${code}:${secret}`, "utf8")
    .digest("hex");
}

export function hashIpAddress(ip: string): string {
  const secret = getCheckoutSecret();
  return crypto
    .createHash("sha256")
    .update(`${ip.trim()}:${secret}`, "utf8")
    .digest("hex");
}

function safeEqualHexOrStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function buildVerificationEmailContent(code: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Seu código de verificação: ${code} — Mariane Cosméticos`;
  const logoUrl = `${SITE_URL}/logo-nav.png`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background-color:#FAF5FB;font-family:Inter,Arial,sans-serif;color:#1A0918;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:16px;border:1px solid #EDE2EF;overflow:hidden;">
    <tr>
      <td style="padding:28px 28px 16px;text-align:center;border-bottom:1px solid #F3EBF5;">
        <img src="${logoUrl}" alt="Mariane Cosméticos" width="160" style="max-width:160px;height:auto;display:inline-block;" />
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#2D182B;">
          Olá! Utilize o código abaixo para confirmar seu e-mail e finalizar seu pedido na <strong>Mariane Cosméticos</strong>:
        </p>
        <div style="margin:24px 0;padding:18px 20px;background-color:#FAF5FB;border:1px solid #D9B8DE;border-radius:12px;text-align:center;">
          <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#75066A;font-family:'Courier New',monospace;">${code}</span>
        </div>
        <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#4D0046;font-weight:600;">
          Validade: 10 minutos (uso único).
        </p>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#6E5A6C;">
          Se não foi você quem solicitou este código, ignore este e-mail com segurança.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "Mariane Cosméticos — Confirmação de E-mail",
    "",
    `Seu código de verificação: ${code}`,
    "Validade: 10 minutos (uso único).",
    "",
    "Se não foi você quem solicitou este código, ignore este e-mail.",
  ].join("\n");

  return { subject, html, text };
}

export function createVerifiedEmailToken(
  email: string,
  nowMs: number = Date.now()
): string {
  const secret = getCheckoutSecret();
  const payload = {
    email: normalizeVerificationEmail(email),
    exp: nowMs + VERIFIED_TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload, "utf8")
    .digest("base64url");
  return `${encodedPayload}.${sig}`;
}

export function verifyVerifiedEmailToken(
  token: string | undefined | null,
  expectedEmail: string,
  nowMs: number = Date.now()
): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [encodedPayload, providedSig] = parts;
  if (!encodedPayload || !providedSig) return false;

  let secret: string;
  try {
    secret = getCheckoutSecret();
  } catch {
    return false;
  }

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload, "utf8")
    .digest("base64url");

  if (!safeEqualHexOrStr(providedSig, expectedSig)) return false;

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as { email?: unknown; exp?: unknown };

    if (
      typeof parsed.email !== "string" ||
      typeof parsed.exp !== "number" ||
      !Number.isFinite(parsed.exp)
    ) {
      return false;
    }

    if (parsed.exp <= nowMs) return false;
    return parsed.email === normalizeVerificationEmail(expectedEmail);
  } catch {
    return false;
  }
}

export function extractCookieFromRequest(
  request: Request,
  cookieName: string
): string | null {
  const rawCookie = request.headers.get("cookie");
  if (!rawCookie) return null;

  for (const part of rawCookie.split(";")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    if (key === cookieName) {
      try {
        return decodeURIComponent(part.slice(eqIdx + 1).trim());
      } catch {
        return part.slice(eqIdx + 1).trim();
      }
    }
  }
  return null;
}

export type SendVerificationOutcome =
  | {
      ok: true;
      email: string;
      code: string;
    }
  | {
      ok: false;
      statusHttp: 429 | 502;
      title: string;
      detail: string;
      retryAfterSeconds?: number;
    };

export async function sendVerificationCode(params: {
  email: string;
  ip: string;
  nowMs?: number;
}): Promise<SendVerificationOutcome> {
  const nowMs = params.nowMs ?? Date.now();
  const normalizedEmail = normalizeVerificationEmail(params.email);
  const ipHash = hashIpAddress(params.ip);
  const secret = getCheckoutSecret();
  const nowIso = new Date(nowMs).toISOString();
  const oneHourAgoIso = new Date(nowMs - HOUR_WINDOW_MS).toISOString();
  const cleanupCutoffIso = new Date(nowMs - CLEANUP_RETENTION_MS).toISOString();

  const dbGate = await withSqliteWriteLock(async () => {
    // Limpeza LGPD oportunista: remove verificações com mais de 24h
    await db
      .delete(emailVerifications)
      .where(lt(emailVerifications.createdAt, cleanupCutoffIso));

    const recentEmailRows = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, normalizedEmail),
          gte(emailVerifications.createdAt, oneHourAgoIso)
        )
      )
      .orderBy(desc(emailVerifications.lastSentAt));

    if (recentEmailRows.length > 0) {
      const latestSentMs = Date.parse(recentEmailRows[0].lastSentAt);
      const elapsedMs = nowMs - latestSentMs;
      if (elapsedMs < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.max(
          1,
          Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000)
        );
        return {
          ok: false as const,
          statusHttp: 429 as const,
          retryAfterSeconds: retryAfter,
          title: "Aguarde antes de reenviar",
          detail: `Aguarde ${retryAfter} segundos antes de solicitar um novo código.`,
        };
      }

      if (recentEmailRows.length >= MAX_SENDS_PER_EMAIL_PER_HOUR) {
        const oldestMs = Date.parse(
          recentEmailRows[recentEmailRows.length - 1].createdAt
        );
        const retryAfter = Math.max(
          1,
          Math.ceil((oldestMs + HOUR_WINDOW_MS - nowMs) / 1000)
        );
        return {
          ok: false as const,
          statusHttp: 429 as const,
          retryAfterSeconds: retryAfter,
          title: "Limite de envios por e-mail",
          detail: `Você atingiu o limite de envios para este e-mail. Aguarde ${retryAfter} segundos para tentar novamente.`,
        };
      }
    }

    const recentIpRows = await db
      .select({ createdAt: emailVerifications.createdAt })
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.ipHash, ipHash),
          gte(emailVerifications.createdAt, oneHourAgoIso)
        )
      )
      .orderBy(desc(emailVerifications.createdAt));

    if (recentIpRows.length >= MAX_SENDS_PER_IP_PER_HOUR) {
      const oldestIpMs = Date.parse(
        recentIpRows[recentIpRows.length - 1].createdAt
      );
      const retryAfter = Math.max(
        1,
        Math.ceil((oldestIpMs + HOUR_WINDOW_MS - nowMs) / 1000)
      );
      return {
        ok: false as const,
        statusHttp: 429 as const,
        retryAfterSeconds: retryAfter,
        title: "Muitas solicitações",
        detail: `Muitas solicitações de verificação a partir da sua conexão. Aguarde ${retryAfter} segundos.`,
      };
    }

    // Invalida código anterior pendente deste e-mail antes de emitir o novo
    await db
      .update(emailVerifications)
      .set({
        expiresAt: EPOCH_ISO,
        attempts: MAX_ATTEMPTS_PER_CODE,
      })
      .where(
        and(
          eq(emailVerifications.email, normalizedEmail),
          isNull(emailVerifications.verifiedAt)
        )
      );

    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    const codeHash = hashCode(normalizedEmail, code, secret);
    const id = crypto.randomUUID();
    const expiresAt = new Date(nowMs + OTP_TTL_MS).toISOString();

    await db.insert(emailVerifications).values({
      id,
      email: normalizedEmail,
      codeHash,
      expiresAt,
      attempts: 0,
      sentCount: recentEmailRows.length + 1,
      lastSentAt: nowIso,
      verifiedAt: null,
      ipHash,
      createdAt: nowIso,
    });

    return { ok: true as const, code };
  });

  if (!dbGate.ok) {
    return dbGate;
  }

  const content = buildVerificationEmailContent(dbGate.code);
  const delivery = await sendEmail({
    to: normalizedEmail,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  if (!delivery.success) {
    console.warn(
      `[otp] Falha no disparo para ${maskPiiEmail(normalizedEmail)}: ${delivery.error}`
    );
    return {
      ok: false,
      statusHttp: 502,
      title: "Falha ao enviar e-mail",
      detail:
        "Não foi possível enviar o código de verificação no momento. Tente novamente em instantes.",
    };
  }

  return {
    ok: true,
    email: normalizedEmail,
    code: dbGate.code,
  };
}

export type VerifyCodeOutcome =
  | {
      ok: true;
      email: string;
      token: string;
    }
  | {
      ok: false;
      statusHttp: 400 | 429;
      title: string;
      detail: string;
      attemptsRemaining?: number;
      code?: "EXPIRED" | "LOCKED" | "INVALID" | "NOT_FOUND";
    };

export async function verifyEmailCode(params: {
  email: string;
  code: string;
  nowMs?: number;
}): Promise<VerifyCodeOutcome> {
  const nowMs = params.nowMs ?? Date.now();
  const normalizedEmail = normalizeVerificationEmail(params.email);
  const cleanCode = params.code.trim();
  const secret = getCheckoutSecret();
  const candidateHash = hashCode(normalizedEmail, cleanCode, secret);

  return withSqliteWriteLock(async () => {
    const rows = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.email, normalizedEmail))
      .orderBy(desc(emailVerifications.createdAt), sql`rowid DESC`)
      .limit(1);

    if (rows.length === 0) {
      return {
        ok: false,
        statusHttp: 400,
        code: "NOT_FOUND",
        title: "Código não encontrado",
        detail: "Nenhum código ativo encontrado para este e-mail. Solicite um novo envio.",
      };
    }

    const latest = rows[0];

    if (latest.verifiedAt) {
      return {
        ok: false,
        statusHttp: 400,
        code: "INVALID",
        title: "Código já utilizado",
        detail: "Este código já foi utilizado. Caso precise alterar o e-mail, solicite um novo código.",
      };
    }

    if (latest.attempts >= MAX_ATTEMPTS_PER_CODE) {
      return {
        ok: false,
        statusHttp: 429,
        code: "LOCKED",
        attemptsRemaining: 0,
        title: "Código bloqueado",
        detail: "Número máximo de tentativas atingido. Solicite um novo código.",
      };
    }

    if (Date.parse(latest.expiresAt) <= nowMs) {
      return {
        ok: false,
        statusHttp: 400,
        code: "EXPIRED",
        title: "Código expirado",
        detail: "Seu código de verificação expirou. Solicite um novo código.",
      };
    }

    if (!safeEqualHexOrStr(candidateHash, latest.codeHash)) {
      const newAttempts = latest.attempts + 1;
      const lockedNow = newAttempts >= MAX_ATTEMPTS_PER_CODE;
      await db
        .update(emailVerifications)
        .set({
          attempts: newAttempts,
          ...(lockedNow ? { expiresAt: EPOCH_ISO } : {}),
        })
        .where(eq(emailVerifications.id, latest.id));

      const remaining = Math.max(0, MAX_ATTEMPTS_PER_CODE - newAttempts);
      if (lockedNow) {
        return {
          ok: false,
          statusHttp: 429,
          code: "LOCKED",
          attemptsRemaining: 0,
          title: "Código bloqueado",
          detail:
            "Código incorreto. Limite de 5 tentativas atingido; solicite um novo código.",
        };
      }

      return {
        ok: false,
        statusHttp: 400,
        code: "INVALID",
        attemptsRemaining: remaining,
        title: "Código incorreto",
        detail: `Código incorreto. Você ainda tem ${remaining} tentativa${remaining === 1 ? "" : "s"}.`,
      };
    }

    await db
      .update(emailVerifications)
      .set({ verifiedAt: new Date(nowMs).toISOString() })
      .where(eq(emailVerifications.id, latest.id));

    const token = createVerifiedEmailToken(normalizedEmail, nowMs);
    return {
      ok: true,
      email: normalizedEmail,
      token,
    };
  });
}

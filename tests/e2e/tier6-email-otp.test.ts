import { describe, test, expect } from "./framework";
import { db, emailVerifications, products, orders, orderItems } from "@/db";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

function parseSetCookieHeader(setCookie: string | null): {
  nameValue: string;
  cookiePair: string;
  raw: string;
} {
  const raw = setCookie || "";
  const firstPart = raw.split(";")[0]?.trim() || "";
  return { nameValue: firstPart, cookiePair: firstPart, raw };
}

describe("Tier 2 & Tier 4 - Verificação de E-mail por OTP no Checkout (Prompt 1)", () => {
  const testPrefix = `otp.teste.${Date.now()}`;
  const cleanEmails: string[] = [];

  const trackEmail = (email: string) => {
    const normalized = email.trim().toLowerCase();
    cleanEmails.push(normalized);
    return normalized;
  };

  async function cleanup() {
    for (const em of cleanEmails) {
      await db.delete(emailVerifications).where(eq(emailVerifications.email, em));
    }
    cleanEmails.length = 0;
  }

  test(
    "2.6.1 [Email OTP] Envio de código retorna resposta genérica, grava codeHash sem código em texto, e omite segredos dos logs",
    async () => {
      const email = trackEmail(`${testPrefix}.envio@Exemplo.Com.BR`);
      const originalNodeEnv = process.env.NODE_ENV;
      const originalConsoleInfo = console.info;
      const originalConsoleLog = console.log;
      const logs: string[] = [];

      console.info = (...args: unknown[]) => logs.push(args.map(String).join(" "));
      console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));

      try {
        // Sem NODE_ENV=test, resposta nunca devolve testCode
        (process.env as Record<string, string | undefined>).NODE_ENV = "development";
        const { POST: sendCodePost } = await import(
          "@/app/api/checkout/email/enviar-codigo/route"
        );

        const reqDev = new Request("http://localhost:3001/api/checkout/email/enviar-codigo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "198.51.100.10",
          },
          body: JSON.stringify({ email, honeypot: "" }),
        });

        const resDev = await sendCodePost(reqDev);
        expect(resDev.status).toBe(200);
        const dataDev = (await resDev.json()) as Record<string, unknown>;
        expect(dataDev.message).toBe("Se o e-mail for válido, enviamos um código.");
        expect(dataDev.testCode).toBeUndefined(
          "Fora de NODE_ENV=test o endpoint nunca pode retornar o código"
        );

        // Verifica que há registro no banco sem o código em texto puro e e-mail normalizado
        const rows = await db
          .select()
          .from(emailVerifications)
          .where(eq(emailVerifications.email, email));
        expect(rows.length).toBe(1);
        expect(rows[0].email).toBe(email);
        expect(rows[0].codeHash.length).toBe(64, "codeHash deve ser hex SHA-256");

        // Logs jamais contêm e-mail completo
        const joinedLogs = logs.join("\n").toLowerCase();
        expect(joinedLogs.includes(email)).toBe(
          false,
          "E-mail completo nunca deve aparecer nos logs"
        );
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
        console.info = originalConsoleInfo;
        console.log = originalConsoleLog;
        await cleanup();
      }
    },
    { tier: 2, milestone: "M4", authoritativeSource: "Prompt 1 - Email OTP" }
  );

  test(
    "2.6.2 [Email OTP] Reenvio antes de 60s retorna 429 com Retry-After em pt-BR",
    async () => {
      const email = trackEmail(`${testPrefix}.cooldown@exemplo.com.br`);
      const { POST: sendCodePost } = await import(
        "@/app/api/checkout/email/enviar-codigo/route"
      );

      try {
        const res1 = await sendCodePost(
          new Request("http://localhost:3001/api/checkout/email/enviar-codigo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": "198.51.100.11",
            },
            body: JSON.stringify({ email, honeypot: "" }),
          })
        );
        expect(res1.status).toBe(200);

        const res2 = await sendCodePost(
          new Request("http://localhost:3001/api/checkout/email/enviar-codigo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": "198.51.100.11",
            },
            body: JSON.stringify({ email, honeypot: "" }),
          })
        );
        expect(res2.status).toBe(429, "Reenvio antes de 60s deve retornar HTTP 429");
        const retryAfter = res2.headers.get("retry-after");
        expect(Number(retryAfter) > 0).toBe(true, "Header Retry-After deve ser > 0");
        const problem = (await res2.json()) as { status: number; detail: string };
        expect(problem.status).toBe(429);
        expect(problem.detail.toLowerCase()).toContain("aguarde");
      } finally {
        await cleanup();
      }
    },
    { tier: 2, milestone: "M4", authoritativeSource: "Prompt 1 - Email OTP Rate Limit" }
  );

  test(
    "2.6.3 [Email OTP] Código errado 5x bloqueia permanentemente o código atual até novo envio",
    async () => {
      const email = trackEmail(`${testPrefix}.bruteforce@exemplo.com.br`);
      const originalNodeEnv = process.env.NODE_ENV;
      (process.env as Record<string, string | undefined>).NODE_ENV = "test";

      try {
        const { POST: sendCodePost } = await import(
          "@/app/api/checkout/email/enviar-codigo/route"
        );
        const { POST: verifyCodePost } = await import(
          "@/app/api/checkout/email/verificar-codigo/route"
        );

        const sendRes = await sendCodePost(
          new Request("http://localhost:3001/api/checkout/email/enviar-codigo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": "198.51.100.12",
            },
            body: JSON.stringify({ email, honeypot: "" }),
          })
        );
        expect(sendRes.status).toBe(200);
        const sendData = (await sendRes.json()) as { testCode?: string };
        const realCode = sendData.testCode || "";
        expect(/^\d{6}$/.test(realCode)).toBe(true, "testCode deve ter 6 dígitos em NODE_ENV=test");

        const wrongCode = realCode === "000000" ? "999999" : "000000";

        for (let attempt = 1; attempt <= 5; attempt++) {
          const res = await verifyCodePost(
            new Request("http://localhost:3001/api/checkout/email/verificar-codigo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, code: wrongCode }),
            })
          );
          expect(res.status === 400 || res.status === 429).toBe(true);
        }

        // 6ª tentativa com o código REAL deve falhar porque o código foi invalidado
        const blockedRes = await verifyCodePost(
          new Request("http://localhost:3001/api/checkout/email/verificar-codigo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code: realCode }),
          })
        );
        expect(blockedRes.status).toBe(429, "Código invalidado após 5 erros deve bloquear mesmo código certo");
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
        await cleanup();
      }
    },
    { tier: 2, milestone: "M4", authoritativeSource: "Prompt 1 - Email OTP Lockout" }
  );

  test(
    "2.6.4 [Email OTP] Código expirado retorna erro claro e não emite cookie",
    async () => {
      const email = trackEmail(`${testPrefix}.expirado@exemplo.com.br`);
      const originalNodeEnv = process.env.NODE_ENV;
      (process.env as Record<string, string | undefined>).NODE_ENV = "test";

      try {
        const { POST: sendCodePost } = await import(
          "@/app/api/checkout/email/enviar-codigo/route"
        );
        const { POST: verifyCodePost } = await import(
          "@/app/api/checkout/email/verificar-codigo/route"
        );

        const sendRes = await sendCodePost(
          new Request("http://localhost:3001/api/checkout/email/enviar-codigo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": "198.51.100.13",
            },
            body: JSON.stringify({ email, honeypot: "" }),
          })
        );
        const { testCode } = (await sendRes.json()) as { testCode: string };

        // Expira manualmente no banco
        await db
          .update(emailVerifications)
          .set({ expiresAt: new Date(Date.now() - 60_000).toISOString() })
          .where(eq(emailVerifications.email, email));

        const verifyRes = await verifyCodePost(
          new Request("http://localhost:3001/api/checkout/email/verificar-codigo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code: testCode }),
          })
        );
        expect(verifyRes.status).toBe(400);
        expect(verifyRes.headers.get("set-cookie")).toBe(null);
        const problem = (await verifyRes.json()) as { detail: string };
        expect(problem.detail.toLowerCase()).toContain("expirou");
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
        await cleanup();
      }
    },
    { tier: 2, milestone: "M4", authoritativeSource: "Prompt 1 - Email OTP Expiration" }
  );

  test(
    "2.6.5 [Email OTP] Novo envio invalida código anterior e estoura limite de 5/h por e-mail e 20/h por IP no banco",
    async () => {
      const email = trackEmail(`${testPrefix}.limits@exemplo.com.br`);
      const originalNodeEnv = process.env.NODE_ENV;
      (process.env as Record<string, string | undefined>).NODE_ENV = "test";

      try {
        const {
          sendVerificationCode,
          verifyEmailCode,
          hashIpAddress,
        } = await import("@/lib/email-verification");

        const baseNow = Date.now();
        // 1º envio
        const s1 = await sendVerificationCode({
          email,
          ip: "198.51.100.21",
          nowMs: baseNow,
        });
        expect(s1.ok).toBe(true);
        if (!s1.ok) return;

        // 2º envio após 65s -> invalida código 1
        const s2 = await sendVerificationCode({
          email,
          ip: "198.51.100.21",
          nowMs: baseNow + 65_000,
        });
        expect(s2.ok).toBe(true);
        if (!s2.ok) return;

        const oldCheck = await verifyEmailCode({
          email,
          code: s1.code,
          nowMs: baseNow + 66_000,
        });
        expect(oldCheck.ok).toBe(false, "Código anterior deve estar invalidado após novo envio");

        // Envios 3, 4 e 5 espaçados de 65s dentro de 1h
        for (let k = 2; k < 5; k++) {
          const sk = await sendVerificationCode({
            email,
            ip: "198.51.100.21",
            nowMs: baseNow + k * 65_000 + 65_000,
          });
          expect(sk.ok).toBe(true);
        }

        // 6º envio na mesma hora -> 429
        const s6 = await sendVerificationCode({
          email,
          ip: "198.51.100.21",
          nowMs: baseNow + 5 * 65_000 + 65_000,
        });
        expect(s6.ok).toBe(false);
        if (!s6.ok) {
          expect(s6.statusHttp).toBe(429);
          expect(Number(s6.retryAfterSeconds) > 0).toBe(true);
        }

        // Limite de 20 envios por IP (hash) na hora com e-mails distintos
        const sharedIp = "198.51.100.99";
        const sharedIpHash = hashIpAddress(sharedIp);
        const nowIso = new Date(baseNow).toISOString();
        const insertedIds: string[] = [];
        try {
          for (let i = 0; i < 20; i++) {
            const id = crypto.randomUUID();
            insertedIds.push(id);
            await db.insert(emailVerifications).values({
              id,
              email: `${testPrefix}.ip${i}@exemplo.com.br`,
              codeHash: "a".repeat(64),
              expiresAt: new Date(baseNow + 600_000).toISOString(),
              attempts: 0,
              sentCount: 1,
              lastSentAt: nowIso,
              verifiedAt: null,
              ipHash: sharedIpHash,
              createdAt: nowIso,
            });
          }

          const ipBlocked = await sendVerificationCode({
            email: `${testPrefix}.ip21@exemplo.com.br`,
            ip: sharedIp,
            nowMs: baseNow + 5_000,
          });
          expect(ipBlocked.ok).toBe(false);
          if (!ipBlocked.ok) {
            expect(ipBlocked.statusHttp).toBe(429);
          }
        } finally {
          for (const id of insertedIds) {
            await db.delete(emailVerifications).where(eq(emailVerifications.id, id));
          }
        }
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
        await cleanup();
      }
    },
    { tier: 2, milestone: "M4", authoritativeSource: "Prompt 1 - DB Rate Limits & Invalidation" }
  );

  test(
    "4.9 [Email OTP End-to-End] Código certo -> Cookie HttpOnly/Secure/SameSite=Lax -> /api/pedidos 403 sem/outro cookie, 201 com cookie válido e invalida token",
    async () => {
      const email = trackEmail(`${testPrefix}.fluxo@exemplo.com.br`);
      const originalNodeEnv = process.env.NODE_ENV;
      const originalConsoleInfo = console.info;
      const originalConsoleLog = console.log;
      const logs: string[] = [];
      console.info = (...args: unknown[]) => logs.push(args.map(String).join(" "));
      console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));
      (process.env as Record<string, string | undefined>).NODE_ENV = "test";

      const createdOrderIds: string[] = [];

      try {
        const { POST: sendCodePost } = await import(
          "@/app/api/checkout/email/enviar-codigo/route"
        );
        const { POST: verifyCodePost } = await import(
          "@/app/api/checkout/email/verificar-codigo/route"
        );
        const { POST: postPedidosRoute } = await import("@/app/api/pedidos/route");

        const sampleProds = await db
          .select()
          .from(products)
          .where(sql`${products.stock} >= 2`)
          .limit(1);
        expect(sampleProds.length).toBe(1);
        const prod = sampleProds[0];

        // 1. Enviar código
        const sendRes = await sendCodePost(
          new Request("http://localhost:3001/api/checkout/email/enviar-codigo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": "198.51.100.14",
            },
            body: JSON.stringify({ email, honeypot: "" }),
          })
        );
        expect(sendRes.status).toBe(200);
        const { testCode } = (await sendRes.json()) as { testCode: string };

        // 2. Verificar código certo -> emite cookie
        const verifyRes = await verifyCodePost(
          new Request("http://localhost:3001/api/checkout/email/verificar-codigo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code: testCode }),
          })
        );
        expect(verifyRes.status).toBe(200);
        const setCookie = verifyRes.headers.get("set-cookie");
        expect(Boolean(setCookie)).toBe(true, "Set-Cookie deve ser emitido após código válido");
        expect(setCookie!).toContain("HttpOnly");
        expect(setCookie!).toContain("Secure");
        expect(setCookie!.toLowerCase()).toContain("samesite=lax");
        expect(setCookie!).toContain("Path=/");

        const { cookiePair } = parseSetCookieHeader(setCookie);

        const basePayload = {
          customerName: "Mariana Verificada",
          customerPhone: "(49) 99125-1617",
          customerEmail: email,
          deliveryMode: "retirada" as const,
          paymentMethod: "whatsapp" as const,
          marketingConsent: false,
          honeypot: "",
          items: [{ productId: prod.id, quantity: 1 }],
        };

        // 3. POST /api/pedidos SEM cookie -> 403
        const noCookieRes = await postPedidosRoute(
          new Request("http://localhost:3001/api/pedidos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": "198.51.100.15",
            },
            body: JSON.stringify({ ...basePayload, idempotencyKey: crypto.randomUUID() }),
          })
        );
        expect(noCookieRes.status).toBe(403);
        const noCookieErr = (await noCookieRes.json()) as { detail: string };
        expect(noCookieErr.detail).toContain("Confirme seu e-mail para finalizar o pedido");

        // 4. POST /api/pedidos COM cookie de OUTRO e-mail -> 403
        const mismatchRes = await postPedidosRoute(
          new Request("http://localhost:3001/api/pedidos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cookie": cookiePair,
              "x-forwarded-for": "198.51.100.16",
            },
            body: JSON.stringify({
              ...basePayload,
              customerEmail: "outro.email@exemplo.com.br",
              idempotencyKey: crypto.randomUUID(),
            }),
          })
        );
        expect(mismatchRes.status).toBe(403);

        // 5. POST /api/pedidos COM cookie válido -> 201 e cookie invalidado
        const okRes = await postPedidosRoute(
          new Request("http://localhost:3001/api/pedidos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cookie": cookiePair,
              "x-forwarded-for": "198.51.100.17",
            },
            body: JSON.stringify({ ...basePayload, idempotencyKey: crypto.randomUUID() }),
          })
        );
        expect(okRes.status).toBe(201);
        const okData = (await okRes.json()) as { success: boolean; order: { id: string } };
        expect(okData.success).toBe(true);
        createdOrderIds.push(okData.order.id);

        const clearCookieHeader = okRes.headers.get("set-cookie") || "";
        expect(clearCookieHeader).toContain("Max-Age=0");

        // Repor estoque de volta ao normal após teste E2E
        await db
          .update(products)
          .set({ stock: sql`${products.stock} + 1` })
          .where(eq(products.id, prod.id));

        // Logs jamais expuseram o e-mail em texto puro
        expect(logs.join("\n").toLowerCase().includes(email)).toBe(false);
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
        console.info = originalConsoleInfo;
        console.log = originalConsoleLog;
        for (const oid of createdOrderIds) {
          await db.delete(orderItems).where(eq(orderItems.orderId, oid));
          await db.delete(orders).where(eq(orders.id, oid));
        }
        await cleanup();
      }
    },
    { tier: 4, milestone: "M4", authoritativeSource: "Prompt 1 - Email OTP E2E" }
  );
});

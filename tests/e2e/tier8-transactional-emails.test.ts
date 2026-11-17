import crypto from "node:crypto";
import { describe, test, expect } from "./framework";
import { db, products, orders, orderItems, paymentWebhooks } from "@/db";
import { eq, sql } from "drizzle-orm";
import {
  EMAIL_VERIFICATION_COOKIE_NAME,
  createVerifiedEmailToken,
} from "@/lib/email-verification";
import { ORDER_STATUS_LABELS } from "@/lib/order-state-machine";

interface CapturedBrevoCall {
  url: string;
  toEmail: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

describe("Tier 4 - E-mails Transacionais de Pedido (Prompt 3)", () => {
  test(
    "4.11 [Transactional Email] Pedido criado chama Brevo uma vez; webhook repetido não reenvia; mudança de status notifica corretamente",
    async () => {
      const originalFetch = globalThis.fetch;
      const originalBrevoKey = process.env.BREVO_API_KEY;
      const originalEmailFrom = process.env.EMAIL_FROM;
      const originalWebhookToken = process.env.ASAAS_WEBHOOK_TOKEN;

      const calls: CapturedBrevoCall[] = [];
      process.env.BREVO_API_KEY = "test_brevo_key_mock";
      process.env.EMAIL_FROM = "noreply@marianecosmeticos.com.br";
      process.env.ASAAS_WEBHOOK_TOKEN = "whsec_email_e2e_test";

      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("api.brevo.com/v3/smtp/email")) {
          const parsed = JSON.parse(String(init?.body || "{}")) as {
            to?: Array<{ email: string }>;
            subject?: string;
            htmlContent?: string;
            textContent?: string;
          };
          calls.push({
            url,
            toEmail: parsed.to?.[0]?.email || "",
            subject: parsed.subject || "",
            htmlContent: parsed.htmlContent || "",
            textContent: parsed.textContent || "",
          });
          return new Response(
            JSON.stringify({ messageId: `<msg-${calls.length}@brevo.test>` }),
            { status: 201, headers: { "Content-Type": "application/json" } }
          );
        }
        return originalFetch(input, init);
      }) as typeof fetch;

      const createdOrderIds: string[] = [];
      const createdEventIds: string[] = [];

      try {
        const { POST: postPedidosRoute } = await import("@/app/api/pedidos/route");
        const { POST: postWebhookRoute } = await import(
          "@/app/api/webhooks/pagamento/route"
        );
        const { changeOrderStatus } = await import("@/lib/orders");
        const { sendOrderStatusChangedEmail } = await import("@/lib/order-emails");

        const sampleProds = await db
          .select()
          .from(products)
          .where(sql`${products.stock} >= 3`)
          .limit(1);
        expect(sampleProds.length).toBe(1);
        const prod = sampleProds[0];

        const email = `transacional.${Date.now()}@exemplo.com.br`;
        const cookiePair = `${EMAIL_VERIFICATION_COOKIE_NAME}=${createVerifiedEmailToken(
          email
        )}`;

        // 1. POST /api/pedidos (PIX) -> chama Brevo exatamente 1 vez
        const orderRes = await postPedidosRoute(
          new Request("http://localhost:3001/api/pedidos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cookie": cookiePair,
              "x-forwarded-for": "198.51.100.81",
            },
            body: JSON.stringify({
              customerName: "Clarice Lispector",
              customerPhone: "(49) 99125-1617",
              customerEmail: email,
              deliveryMode: "retirada",
              paymentMethod: "pix",
              marketingConsent: false,
              idempotencyKey: crypto.randomUUID(),
              honeypot: "",
              items: [{ productId: prod.id, quantity: 1 }],
            }),
          })
        );
        expect(orderRes.status).toBe(201);
        const orderJson = (await orderRes.json()) as {
          order: { id: string; publicToken: string; total: number };
        };
        const orderId = orderJson.order.id;
        createdOrderIds.push(orderId);

        expect(calls.length).toBe(1, "Criação de pedido deve disparar 1 e-mail");
        expect(calls[0].toEmail).toBe(email);
        expect(calls[0].subject).toContain(orderId);
        expect(calls[0].htmlContent).toContain(`/pedido/${orderJson.order.publicToken}`);
        expect(calls[0].htmlContent).toContain("Acompanhar pedido");
        expect(calls[0].htmlContent).toContain("Rua Blumenau, Nº 623");
        expect(calls[0].htmlContent).toContain("(49) 99125-1617");
        expect(calls[0].textContent).toContain(orderId);

        // 2. Webhook PAYMENT_CONFIRMED -> dispara e-mail de pagamento confirmado (calls = 2)
        const evt1 = `evt_wh_email_1_${Date.now()}`;
        const evt2 = `evt_wh_email_2_${Date.now()}`;
        createdEventIds.push(evt1, evt2);

        const makeWebhookReq = (eventId: string, event: string) =>
          postWebhookRoute(
            new Request("http://localhost:3001/api/webhooks/pagamento", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "asaas-access-token": "whsec_email_e2e_test",
              },
              body: JSON.stringify({
                id: eventId,
                event,
                payment: {
                  id: `pay_${eventId}`,
                  externalReference: orderId,
                  value: orderJson.order.total,
                  billingType: "PIX",
                },
              }),
            })
          );

        const wh1 = await makeWebhookReq(evt1, "PAYMENT_CONFIRMED");
        expect(wh1.status).toBe(200);
        expect(calls.length).toBe(
          2,
          "1º webhook de pagamento confirmado deve disparar 1 e-mail"
        );
        expect(calls[1].subject).toContain("Pagamento confirmado");

        // Replay do mesmo eventId -> NÃO reenvia
        const whReplay = await makeWebhookReq(evt1, "PAYMENT_CONFIRMED");
        expect(whReplay.status).toBe(200);
        expect(calls.length).toBe(2, "Replay idempotente de webhook não deve reenviar e-mail");

        // 2º evento distinto de confirmação (PAYMENT_RECEIVED) no mesmo pedido já pago -> NÃO reenvia
        const whSecondEvt = await makeWebhookReq(evt2, "PAYMENT_RECEIVED");
        expect(whSecondEvt.status).toBe(200);
        expect(calls.length).toBe(
          2,
          "Segundo evento de pagamento no mesmo pedido já pago não deve reenviar e-mail"
        );

        // 3. Mudança de status (pago -> em_separacao -> pronto_para_retirada -> entregue)
        const sep = await changeOrderStatus(orderId, "em_separacao", "admin");
        await sendOrderStatusChangedEmail({ orderId, newStatus: sep.status });
        expect(calls.length).toBe(2, "em_separacao não notifica cliente");

        const ready = await changeOrderStatus(
          orderId,
          "pronto_para_retirada",
          "admin"
        );
        await sendOrderStatusChangedEmail({ orderId, newStatus: ready.status });
        expect(calls.length).toBe(3, "pronto_para_retirada deve enviar e-mail");
        expect(calls[2].htmlContent).toContain(
          ORDER_STATUS_LABELS.pronto_para_retirada
        );

        const delivered = await changeOrderStatus(orderId, "entregue", "admin");
        await sendOrderStatusChangedEmail({
          orderId,
          newStatus: delivered.status,
        });
        expect(calls.length).toBe(4, "entregue deve enviar e-mail");
        expect(calls[3].htmlContent).toContain(ORDER_STATUS_LABELS.entregue);

        // Repor 1 unidade do estoque
        await db
          .update(products)
          .set({ stock: sql`${products.stock} + 1` })
          .where(eq(products.id, prod.id));
      } finally {
        globalThis.fetch = originalFetch;
        if (originalBrevoKey === undefined) delete process.env.BREVO_API_KEY;
        else process.env.BREVO_API_KEY = originalBrevoKey;
        if (originalEmailFrom === undefined) delete process.env.EMAIL_FROM;
        else process.env.EMAIL_FROM = originalEmailFrom;
        if (originalWebhookToken === undefined)
          delete process.env.ASAAS_WEBHOOK_TOKEN;
        else process.env.ASAAS_WEBHOOK_TOKEN = originalWebhookToken;

        for (const ev of createdEventIds) {
          await db.delete(paymentWebhooks).where(eq(paymentWebhooks.eventId, ev));
        }
        for (const oid of createdOrderIds) {
          await db.delete(orderItems).where(eq(orderItems.orderId, oid));
          await db.delete(orders).where(eq(orders.id, oid));
        }
      }
    },
    { tier: 4, milestone: "E2E", authoritativeSource: "Prompt 3 - Transactional Order Emails" }
  );

  test(
    "4.12 [Transactional Email Resilience] Erro no provedor de e-mail (mock fetch 500/rejeição) não quebra pedido nem webhook e mascara e-mail no log",
    async () => {
      const originalFetch = globalThis.fetch;
      const originalBrevoKey = process.env.BREVO_API_KEY;
      const originalEmailFrom = process.env.EMAIL_FROM;
      const originalWebhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
      const originalConsoleError = console.error;
      const errorLogs: string[] = [];

      process.env.BREVO_API_KEY = "test_brevo_key_fail";
      process.env.EMAIL_FROM = "noreply@marianecosmeticos.com.br";
      process.env.ASAAS_WEBHOOK_TOKEN = "whsec_email_fail_test";
      console.error = (...args: unknown[]) =>
        errorLogs.push(args.map(String).join(" "));

      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("api.brevo.com/v3/smtp/email")) {
          return new Response("Brevo Temporary Outage", { status: 500 });
        }
        return originalFetch(input, init);
      }) as typeof fetch;

      const createdOrderIds: string[] = [];
      const createdEventIds: string[] = [];

      try {
        const { POST: postPedidosRoute } = await import("@/app/api/pedidos/route");
        const { POST: postWebhookRoute } = await import(
          "@/app/api/webhooks/pagamento/route"
        );

        const sampleProds = await db
          .select()
          .from(products)
          .where(sql`${products.stock} >= 2`)
          .limit(1);
        expect(sampleProds.length).toBe(1);
        const prod = sampleProds[0];

        const secretEmail = `cliente.erro.brevo.${Date.now()}@exemplo.com.br`;
        const cookiePair = `${EMAIL_VERIFICATION_COOKIE_NAME}=${createVerifiedEmailToken(
          secretEmail
        )}`;

        // Criação do pedido continua HTTP 201 mesmo com provedor Brevo retornando HTTP 500
        const orderRes = await postPedidosRoute(
          new Request("http://localhost:3001/api/pedidos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cookie": cookiePair,
              "x-forwarded-for": "198.51.100.82",
            },
            body: JSON.stringify({
              customerName: "Cecília Meireles",
              customerPhone: "(49) 99125-1617",
              customerEmail: secretEmail,
              deliveryMode: "retirada",
              paymentMethod: "pix",
              marketingConsent: false,
              idempotencyKey: crypto.randomUUID(),
              honeypot: "",
              items: [{ productId: prod.id, quantity: 1 }],
            }),
          })
        );
        expect(orderRes.status).toBe(
          201,
          "Erro do provedor de e-mail nunca pode quebrar criação de pedido"
        );
        const orderJson = (await orderRes.json()) as {
          order: { id: string; total: number };
        };
        createdOrderIds.push(orderJson.order.id);

        // Mock de rejeição de rede no fetch também não quebra o webhook
        globalThis.fetch = (async () => {
          throw new Error("ECONNRESET");
        }) as unknown as typeof fetch;

        const evtId = `evt_wh_fail_${Date.now()}`;
        createdEventIds.push(evtId);
        const whRes = await postWebhookRoute(
          new Request("http://localhost:3001/api/webhooks/pagamento", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "asaas-access-token": "whsec_email_fail_test",
            },
            body: JSON.stringify({
              id: evtId,
              event: "PAYMENT_CONFIRMED",
              payment: {
                id: `pay_${evtId}`,
                externalReference: orderJson.order.id,
                value: orderJson.order.total,
                billingType: "PIX",
              },
            }),
          })
        );
        expect(
          whRes.status,
          "Erro de rede no provedor de e-mail nunca pode quebrar o webhook"
        ).toBe(200);

        // Nenhum log de erro expõe o endereço completo do cliente
        expect(errorLogs.join("\n").toLowerCase().includes(secretEmail)).toBe(
          false,
          "E-mail completo nunca pode aparecer nos logs mesmo em falha"
        );

        await db
          .update(products)
          .set({ stock: sql`${products.stock} + 1` })
          .where(eq(products.id, prod.id));
      } finally {
        globalThis.fetch = originalFetch;
        console.error = originalConsoleError;
        if (originalBrevoKey === undefined) delete process.env.BREVO_API_KEY;
        else process.env.BREVO_API_KEY = originalBrevoKey;
        if (originalEmailFrom === undefined) delete process.env.EMAIL_FROM;
        else process.env.EMAIL_FROM = originalEmailFrom;
        if (originalWebhookToken === undefined)
          delete process.env.ASAAS_WEBHOOK_TOKEN;
        else process.env.ASAAS_WEBHOOK_TOKEN = originalWebhookToken;

        for (const ev of createdEventIds) {
          await db.delete(paymentWebhooks).where(eq(paymentWebhooks.eventId, ev));
        }
        for (const oid of createdOrderIds) {
          await db.delete(orderItems).where(eq(orderItems.orderId, oid));
          await db.delete(orders).where(eq(orders.id, oid));
        }
      }
    },
    { tier: 4, milestone: "E2E", authoritativeSource: "Prompt 3 - Provider Failure Resilience" }
  );
});

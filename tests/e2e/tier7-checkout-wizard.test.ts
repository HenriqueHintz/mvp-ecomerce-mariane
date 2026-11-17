import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { describe, test, expect } from "./framework";
import { db, emailVerifications, products, orders, orderItems } from "@/db";
import { eq, sql } from "drizzle-orm";
import {
  CHECKOUT_STEPS,
  INITIAL_WIZARD_STATE,
  canAccessStep,
  checkoutWizardReducer,
  composeFullDeliveryAddress,
  hydrateProgressFromSessionStorage,
  resolveAccessibleStep,
  serializeProgressForSessionStorage,
  validateDelivery,
  validateIdentification,
} from "@/app/checkout/checkout-machine";

describe("Tier 2 & Tier 4 - Fluxo Sequencial de Checkout em Etapas (Prompt 2)", () => {
  test(
    "2.7.1 [Wizard State] Bloqueia acesso direto a ?etapa=pagamento ou ?etapa=revisao sem concluir etapas anteriores",
    () => {
      let state = INITIAL_WIZARD_STATE;
      expect(canAccessStep(state, "identificacao")).toBe(true);
      expect(canAccessStep(state, "verificacao")).toBe(false);
      expect(canAccessStep(state, "entrega")).toBe(false);
      expect(canAccessStep(state, "pagamento")).toBe(false);
      expect(canAccessStep(state, "revisao")).toBe(false);
      expect(resolveAccessibleStep(state, "pagamento")).toBe("identificacao");

      // Conclui identificação -> libera verificação, mas ainda bloqueia entrega/pagamento
      state = checkoutWizardReducer(state, {
        type: "SET_FIELD",
        field: "name",
        value: "Mariana Silva",
      });
      state = checkoutWizardReducer(state, {
        type: "SET_FIELD",
        field: "phone",
        value: "(49) 99125-1617",
      });
      state = checkoutWizardReducer(state, {
        type: "SET_EMAIL",
        email: "mariana@exemplo.com.br",
      });
      state = checkoutWizardReducer(state, { type: "COMPLETE_IDENTIFICATION" });
      expect(state.currentStep).toBe("verificacao");
      expect(resolveAccessibleStep(state, "pagamento")).toBe("verificacao");

      // Conclui verificação -> libera entrega, mas bloqueia pagamento
      state = checkoutWizardReducer(state, {
        type: "COMPLETE_VERIFICATION",
        verifiedEmail: "mariana@exemplo.com.br",
      });
      expect(state.currentStep).toBe("entrega");
      expect(resolveAccessibleStep(state, "pagamento")).toBe("entrega");
    },
    { tier: 2, milestone: "M4", authoritativeSource: "Prompt 2 - Sequential Guard" }
  );

  test(
    "2.7.2 [Wizard State] Trocar e-mail após verificar exige nova verificação e trocar CEP/entrega exige revisar pagamento",
    () => {
      let state = INITIAL_WIZARD_STATE;
      state = checkoutWizardReducer(state, {
        type: "SET_FIELD",
        field: "name",
        value: "Mariana Silva",
      });
      state = checkoutWizardReducer(state, {
        type: "SET_FIELD",
        field: "phone",
        value: "(49) 99125-1617",
      });
      state = checkoutWizardReducer(state, {
        type: "SET_EMAIL",
        email: "mariana@exemplo.com.br",
      });
      state = checkoutWizardReducer(state, { type: "COMPLETE_IDENTIFICATION" });
      state = checkoutWizardReducer(state, {
        type: "COMPLETE_VERIFICATION",
        verifiedEmail: "mariana@exemplo.com.br",
      });
      state = checkoutWizardReducer(state, {
        type: "SET_CEP",
        cep: "88505-300",
      });
      state = checkoutWizardReducer(state, {
        type: "SET_FIELD",
        field: "address",
        value: "Rua Blumenau",
      });
      state = checkoutWizardReducer(state, { type: "COMPLETE_DELIVERY" });
      state = checkoutWizardReducer(state, { type: "COMPLETE_PAYMENT" });
      expect(state.currentStep).toBe("revisao");

      // 1. Trocar CEP invalida entrega, pagamento e revisão (exige confirmar entrega e revisar pagamento)
      state = checkoutWizardReducer(state, {
        type: "SET_CEP",
        cep: "88501-000",
      });
      expect(canAccessStep(state, "revisao")).toBe(false);
      expect(canAccessStep(state, "pagamento")).toBe(false);
      expect(state.completedSteps.includes("entrega")).toBe(false);

      // Avança novamente até revisão
      state = checkoutWizardReducer(state, { type: "COMPLETE_DELIVERY" });
      state = checkoutWizardReducer(state, { type: "COMPLETE_PAYMENT" });
      expect(state.currentStep).toBe("revisao");

      // 2. Trocar e-mail invalida verificação e etapas seguintes
      state = checkoutWizardReducer(state, {
        type: "SET_EMAIL",
        email: "novo@exemplo.com.br",
      });
      expect(state.verifiedEmail).toBe(null);
      expect(state.completedSteps.length).toBe(0);
      expect(resolveAccessibleStep(state, "entrega")).toBe("identificacao");

      // 3. Recuperação após 403 no servidor (INVALIDATE_EMAIL_VERIFICATION limpa verifiedEmail sem alterar o texto do e-mail)
      state = checkoutWizardReducer(state, {
        type: "COMPLETE_IDENTIFICATION",
      });
      state = checkoutWizardReducer(state, {
        type: "COMPLETE_VERIFICATION",
        verifiedEmail: "novo@exemplo.com.br",
      });
      expect(state.verifiedEmail).toBe("novo@exemplo.com.br");
      state = checkoutWizardReducer(state, {
        type: "INVALIDATE_EMAIL_VERIFICATION",
      });
      expect(state.verifiedEmail).toBe(null);
      expect(state.currentStep).toBe("identificacao");
      expect(canAccessStep(state, "entrega")).toBe(false);
    },
    { tier: 2, milestone: "M4", authoritativeSource: "Prompt 2 - Cascade Invalidation" }
  );

  test(
    "2.7.3 [Wizard Storage] Recarregar restaura etapa/dados de sessionStorage sem gravar em localStorage e validações Zod funcionam por etapa",
    () => {
      let state = INITIAL_WIZARD_STATE;
      state = checkoutWizardReducer(state, {
        type: "SET_FIELD",
        field: "name",
        value: "Camila Souza",
      });
      state = checkoutWizardReducer(state, {
        type: "SET_FIELD",
        field: "phone",
        value: "(49) 99888-7766",
      });
      state = checkoutWizardReducer(state, {
        type: "SET_EMAIL",
        email: "camila@exemplo.com.br",
      });
      expect(Object.keys(validateIdentification(state)).length).toBe(0);

      state = checkoutWizardReducer(state, { type: "COMPLETE_IDENTIFICATION" });
      state = checkoutWizardReducer(state, {
        type: "COMPLETE_VERIFICATION",
        verifiedEmail: "camila@exemplo.com.br",
      });

      const serialized = serializeProgressForSessionStorage(state);
      const restored = hydrateProgressFromSessionStorage(serialized);
      expect(Boolean(restored)).toBe(true);
      expect(restored?.currentStep).toBe("entrega");
      expect(restored?.verifiedEmail).toBe("camila@exemplo.com.br");
      expect(restored?.name).toBe("Camila Souza");

      // Endereço incompleto rejeitado na validação da etapa Entrega
      const deliveryErrors = validateDelivery({
        deliveryMode: "entrega",
        cep: "123",
        address: "Rua",
        city: "",
      });
      expect(Boolean(deliveryErrors.cep)).toBe(true);
      expect(Boolean(deliveryErrors.address)).toBe(true);
      expect(Boolean(deliveryErrors.city)).toBe(true);

      expect(
        composeFullDeliveryAddress("Rua Blumenau", "623", "Sala 2")
      ).toBe("Rua Blumenau, Nº 623 — Sala 2");

      const pageCode = fs.readFileSync(
        path.join(process.cwd(), "src", "app", "checkout", "page.tsx"),
        "utf-8"
      );
      expect(pageCode).toContain("sessionStorage");
      expect(pageCode.includes("localStorage")).toBe(false);
      expect(pageCode).toContain('router.replace("/carrinho")');
      expect(CHECKOUT_STEPS.length).toBe(5);
    },
    { tier: 2, milestone: "M4", authoritativeSource: "Prompt 2 - SessionStorage & Empty Redirect" }
  );

  test(
    "4.10 [Wizard Full Flows] Fluxos completos Entrega + PIX e Retirada + WhatsApp até /pedido/[token]",
    async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      (process.env as Record<string, string | undefined>).NODE_ENV = "test";
      const createdOrderIds: string[] = [];
      const createdEmails: string[] = [];

      try {
        const { POST: sendCodePost } = await import(
          "@/app/api/checkout/email/enviar-codigo/route"
        );
        const { POST: verifyCodePost } = await import(
          "@/app/api/checkout/email/verificar-codigo/route"
        );
        const { POST: postPedidosRoute } = await import("@/app/api/pedidos/route");
        const { GET: getPedidoByToken } = await import(
          "@/app/api/pedidos/[token]/route"
        );

        const sampleProds = await db
          .select()
          .from(products)
          .where(sql`${products.stock} >= 2`)
          .limit(1);
        expect(sampleProds.length).toBe(1);
        const prod = sampleProds[0];

        const scenarios = [
          {
            label: "Entrega + PIX",
            email: `wizard.entrega.pix.${Date.now()}@exemplo.com.br`,
            deliveryMode: "entrega" as const,
            cep: "88505-300",
            address: "Rua Blumenau, Nº 623 — Bairro São Cristóvão",
            city: "Lages - SC",
            paymentMethod: "pix" as const,
            ip: "198.51.100.71",
          },
          {
            label: "Retirada + WhatsApp",
            email: `wizard.retirada.wa.${Date.now()}@exemplo.com.br`,
            deliveryMode: "retirada" as const,
            paymentMethod: "whatsapp" as const,
            ip: "198.51.100.72",
          },
        ];

        for (const sc of scenarios) {
          createdEmails.push(sc.email);

          const sendRes = await sendCodePost(
            new Request("http://localhost:3001/api/checkout/email/enviar-codigo", {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-forwarded-for": sc.ip },
              body: JSON.stringify({ email: sc.email, honeypot: "" }),
            })
          );
          expect(sendRes.status).toBe(200);
          const { testCode } = (await sendRes.json()) as { testCode: string };

          const verifyRes = await verifyCodePost(
            new Request("http://localhost:3001/api/checkout/email/verificar-codigo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: sc.email, code: testCode }),
            })
          );
          expect(verifyRes.status).toBe(200);
          const cookiePair = (verifyRes.headers.get("set-cookie") || "")
            .split(";")[0]
            .trim();

          const orderRes = await postPedidosRoute(
            new Request("http://localhost:3001/api/pedidos", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Cookie": cookiePair,
                "x-forwarded-for": sc.ip,
              },
              body: JSON.stringify({
                customerName: `Cliente ${sc.label}`,
                customerPhone: "(49) 99125-1617",
                customerEmail: sc.email,
                deliveryMode: sc.deliveryMode,
                cep: sc.cep,
                address: sc.address,
                city: sc.city,
                paymentMethod: sc.paymentMethod,
                marketingConsent: false,
                idempotencyKey: crypto.randomUUID(),
                honeypot: "",
                items: [{ productId: prod.id, quantity: 1 }],
              }),
            })
          );
          expect(orderRes.status).toBe(201, `Cenário ${sc.label} deve criar pedido 201`);
          const orderJson = (await orderRes.json()) as {
            success: boolean;
            order: { id: string; publicToken: string };
          };
          createdOrderIds.push(orderJson.order.id);

          // Consulta rota pública /api/pedidos/[token] usada em /pedido/[token]
          const trackRes = await getPedidoByToken(
            new Request(`http://localhost:3001/api/pedidos/${orderJson.order.publicToken}`),
            { params: Promise.resolve({ token: orderJson.order.publicToken }) }
          );
          expect(trackRes.status).toBe(200);

          // Repor 1 unidade do estoque consumido
          await db
            .update(products)
            .set({ stock: sql`${products.stock} + 1` })
            .where(eq(products.id, prod.id));
        }
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
        for (const oid of createdOrderIds) {
          await db.delete(orderItems).where(eq(orderItems.orderId, oid));
          await db.delete(orders).where(eq(orders.id, oid));
        }
        for (const em of createdEmails) {
          await db.delete(emailVerifications).where(eq(emailVerifications.email, em));
        }
      }
    },
    { tier: 4, milestone: "E2E", authoritativeSource: "Prompt 2 - Entrega+PIX & Retirada+WhatsApp E2E" }
  );
});

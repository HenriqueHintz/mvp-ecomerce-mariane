import crypto from "crypto";
import { db, orders, orderItems, products, orderStatusHistory, paymentWebhooks } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { toCents, toReais } from "@/lib/pricing";
import { OrderStatus, canTransition } from "@/lib/order-state-machine";
import { STORE_CONFIG } from "@/config/store";
import { COMMERCE_CONFIG } from "@/config/commerce";
import { withSqliteWriteLock } from "@/lib/orders";
import {
  validateReturnUrl,
  validateAsaasCheckoutUrl,
  getNextStepsForStatus,
  isValidPublicToken,
} from "@/lib/payment-urls";

export {
  validateReturnUrl,
  validateAsaasCheckoutUrl,
  getNextStepsForStatus,
  isValidPublicToken,
};

export interface CreatePaymentRequest {
  orderId: string;
  paymentMethod?: "pix" | "card";
  returnUrl?: string;
}

/**
 * Payload oficial de Webhook de Cobranças do Asaas (API v3).
 * Documentação oficial: https://docs.asaas.com/docs/webhook-para-cobrancas
 * - O Asaas envia `id` (ex: "evt_000000000000") como identificador único do evento
 *   e o header HTTP `asaas-access-token: <authToken>`.
 * - Mantemos `eventId` e `orderId` opcionais na raiz para compatibilidade com a suíte E2E.
 */
export type AsaasWebhookEventType =
  | "PAYMENT_CREATED"
  | "PAYMENT_AWAITING_RISK_ANALYSIS"
  | "PAYMENT_APPROVED_BY_RISK_ANALYSIS"
  | "PAYMENT_REPROVED_BY_RISK_ANALYSIS"
  | "PAYMENT_UPDATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED"
  | "PAYMENT_ANTICIPATED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DELETED"
  | "PAYMENT_RESTORED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_PARTIALLY_REFUNDED"
  | "PAYMENT_REFUND_IN_PROGRESS"
  | "PAYMENT_RECEIVED_IN_CASH_UNDONE"
  | "PAYMENT_CHARGEBACK_REQUESTED"
  | "PAYMENT_CHARGEBACK_DISPUTE"
  | "PAYMENT_AWAITING_CHARGEBACK_REVERSAL"
  | "PAYMENT_FAILED";

export interface WebhookEventPayload {
  id?: string;
  eventId?: string;
  event: AsaasWebhookEventType;
  dateCreated?: string;
  orderId?: string;
  payment?: {
    object?: string;
    id?: string;
    customer?: string;
    externalReference?: string;
    value?: number;
    netValue?: number;
    billingType?: string;
    status?: string;
    dueDate?: string;
    invoiceUrl?: string;
  };
}

export function computeWebhookHmac(rawBody: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

/**
 * Comparação em tempo constante imune a vazamento de comprimento via SHA-256.
 */
function safeConstantTimeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB) && a.length === b.length;
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  accessTokenHeader: string | null,
  secret?: string
): boolean {
  const effectiveSecret = (
    secret ??
    process.env.ASAAS_WEBHOOK_TOKEN ??
    process.env.ASAAS_WEBHOOK_SECRET ??
    process.env.PAYMENT_WEBHOOK_SECRET ??
    ""
  ).trim();

  if (!effectiveSecret) {
    return false;
  }

  // 1. Verificar assinatura criptográfica HMAC-SHA256 (x-webhook-signature)
  if (signatureHeader) {
    const cleanSig = signatureHeader.replace(/^sha256=/i, "").trim();
    const expectedHmac = computeWebhookHmac(rawBody, effectiveSecret);
    if (safeConstantTimeCompare(cleanSig, expectedHmac)) {
      return true;
    }
  }

  // 2. Verificar token oficial de autenticação do Asaas (header `asaas-access-token`)
  if (accessTokenHeader) {
    if (safeConstantTimeCompare(accessTokenHeader.trim(), effectiveSecret)) {
      return true;
    }
  }

  return false;
}

export async function createSandboxPayment(
  input: CreatePaymentRequest,
  options?: { forceSandboxMock?: boolean }
) {
  const orderId = typeof input?.orderId === "string" ? input.orderId.trim() : "";
  if (!orderId) {
    return {
      success: false as const,
      statusHttp: 400,
      error: "O código do pedido (orderId) é obrigatório.",
    };
  }

  if (
    input.paymentMethod !== undefined &&
    input.paymentMethod !== "pix" &&
    input.paymentMethod !== "card"
  ) {
    return {
      success: false as const,
      statusHttp: 400,
      error: "Método de pagamento inválido. Use 'pix' ou 'card'.",
    };
  }

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (orderRows.length === 0) {
    return {
      success: false as const,
      statusHttp: 404,
      error: "Pedido não encontrado no banco de dados.",
    };
  }

  const order = orderRows[0];
  const currentStatus = order.status || "aguardando_pagamento";
  const isPending =
    currentStatus === "aguardando_pagamento" ||
    currentStatus === "aguardando pagamento" ||
    currentStatus === "aguardando_confirmacao";

  if (!isPending || (order.expiresAt && new Date(order.expiresAt) < new Date())) {
    return {
      success: false as const,
      statusHttp: 409,
      error: "Este pedido não está pendente de pagamento ou já expirou.",
    };
  }

  // Proteção de integridade de método de pagamento (impede obter desconto PIX de 5% e pagar com Cartão)
  const orderMethod = order.paymentMethod || "whatsapp";
  const hasPixDiscount = (order.discountCents ?? 0) > 0 || orderMethod === "pix";
  if (input.paymentMethod === "card" && hasPixDiscount) {
    return {
      success: false as const,
      statusHttp: 409,
      error:
        "Este pedido foi emitido com desconto exclusivo para PIX e não pode ser pago via cartão.",
    };
  }
  if (input.paymentMethod === "pix" && orderMethod === "cartao") {
    return {
      success: false as const,
      statusHttp: 409,
      error:
        "Este pedido foi emitido para pagamento via cartão de crédito.",
    };
  }

  // Validação estrita contra Open Redirect E vínculo de posse com order.publicToken (evita IDOR)
  let validatedReturnUrl: string | null = null;
  if (input.returnUrl !== undefined) {
    validatedReturnUrl = validateReturnUrl(input.returnUrl);
    if (!validatedReturnUrl) {
      return {
        success: false as const,
        statusHttp: 400,
        error: "URL de retorno inválida ou não autorizada (proteção contra Open Redirect).",
      };
    }

    if (
      isValidPublicToken(order.publicToken) &&
      validatedReturnUrl.toLowerCase() !==
        `${STORE_CONFIG.domain}/pedido/${order.publicToken}`.toLowerCase()
    ) {
      return {
        success: false as const,
        statusHttp: 403,
        error: "Token da URL de retorno não corresponde ao pedido solicitado.",
      };
    }
  }

  const effectiveMethod =
    input.paymentMethod || (orderMethod === "cartao" ? "card" : "pix");
  const billingType = effectiveMethod === "card" ? "CREDIT_CARD" : "PIX";
  const asaasApiKey = (process.env.ASAAS_API_KEY || "").trim();
  const sandboxMockEnabled =
    process.env.NODE_ENV !== "production" &&
    (options?.forceSandboxMock === true ||
      process.env.PAYMENT_SANDBOX_MODE === "mock" ||
      process.env.PAYMENT_SANDBOX_MODE === "true" ||
      process.env.PAYMENT_SANDBOX_ENABLED === "true");

  const totalCents =
    order.totalCents != null ? order.totalCents : toCents(order.total);
  const amountReais = toReais(totalCents);
  const pixExpiresAt =
    order.expiresAt ||
    new Date(
      Date.now() + COMMERCE_CONFIG.ORDER_EXPIRATION_HOURS * 60 * 60 * 1000
    ).toISOString();

  // Se nem o modo Sandbox de homologação nem uma chave Asaas ativa gerarem cobrança, retornar fallback transparente ("em breve" / WhatsApp)
  if (!sandboxMockEnabled) {
    return {
      success: true as const,
      statusHttp: 200,
      sandboxConfigured: false,
      provider: "asaas",
      orderId: order.id,
      orderStatus: order.status,
      billingType,
      amount: amountReais,
      amountCents: totalCents,
      returnUrl: validatedReturnUrl,
      message:
        "Checkout online automático em breve. Seu pedido foi salvo como 'aguardando pagamento' para conclusão segura via WhatsApp oficial.",
    };
  }

  // Modo Sandbox Determinístico (testes de contrato e homologação local sem chaves expostas)
  const paymentId = `pay_sandbox_${order.id.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const formattedAmount = amountReais.toFixed(2);
  const pixPayload =
    billingType === "PIX"
      ? `00020126580014br.gov.bcb.pix0136marianecosmeticos-sandbox-${order.id}5204000053039865406${formattedAmount}5802BR5918MARIANE COSMETICOS6005LAGES62070503***6304ABCD`
      : null;

  const pixQrCodeSvg =
    billingType === "PIX"
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#FFFFFF"/><rect x="10" y="10" width="30" height="30" fill="#18181B"/><rect x="80" y="10" width="30" height="30" fill="#18181B"/><rect x="10" y="80" width="30" height="30" fill="#18181B"/><rect x="48" y="48" width="24" height="24" fill="#75066A"/></svg>`
      : null;
  const pixQrCodeBase64 = pixQrCodeSvg
    ? Buffer.from(pixQrCodeSvg, "utf8").toString("base64")
    : null;

  const rawCheckoutUrl = `https://sandbox.asaas.com/i/${paymentId}`;
  const safeCheckoutUrl = validateAsaasCheckoutUrl(rawCheckoutUrl);

  return {
    success: true as const,
    statusHttp: 201,
    sandboxConfigured: true,
    provider: "asaas-sandbox",
    paymentId,
    orderId: order.id,
    orderStatus: "aguardando pagamento",
    billingType,
    amount: amountReais,
    amountCents: totalCents,
    pixCopyPaste: pixPayload,
    pixQrCodeBase64,
    pixExpiresAt: billingType === "PIX" ? pixExpiresAt : null,
    checkoutUrl: safeCheckoutUrl,
    returnUrl: validatedReturnUrl,
  };
}

export interface ProviderPaymentLookupResult {
  id: string;
  status: string;
  value: number;
}

/**
 * Consulta ativa ao provedor Asaas ao abrir a página `/pedido/[token]` quando o pedido
 * está aguardando pagamento. Se o provedor confirmar `CONFIRMED` ou `RECEIVED` com valor
 * idêntico em centavos inteiros, atualiza o status para `pago` de forma transacional
 * e condicional ao status atual, gravando no histórico.
 */
export async function syncOrderPaymentStatusFromProvider(
  orderId: string,
  customProviderFetcher?: (orderId: string) => Promise<ProviderPaymentLookupResult | null>
): Promise<{ updated: boolean; status: string }> {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (rows.length === 0) {
    return { updated: false, status: "nao_encontrado" };
  }

  const order = rows[0];
  const currentStatusRaw = order.status || "aguardando_pagamento";
  const normalizedStatus: OrderStatus =
    currentStatusRaw === "aguardando pagamento"
      ? "aguardando_pagamento"
      : (currentStatusRaw as OrderStatus);

  if (
    normalizedStatus !== "aguardando_pagamento" &&
    normalizedStatus !== "aguardando_confirmacao"
  ) {
    return { updated: false, status: currentStatusRaw };
  }

  let providerPayment: ProviderPaymentLookupResult | null = null;

  if (customProviderFetcher) {
    providerPayment = await customProviderFetcher(orderId);
  } else {
    const asaasApiKey = (process.env.ASAAS_API_KEY || "").trim();
    if (!asaasApiKey) {
      return { updated: false, status: currentStatusRaw };
    }

    const baseUrl =
      process.env.ASAAS_ENV === "production"
        ? "https://api.asaas.com/v3"
        : "https://sandbox.asaas.com/api/v3";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(
        `${baseUrl}/payments?externalReference=${encodeURIComponent(orderId)}&limit=1`,
        {
          headers: { access_token: asaasApiKey },
          signal: controller.signal,
          cache: "no-store",
        }
      );
      if (res.ok) {
        const json = (await res.json()) as {
          data?: Array<{ id?: string; status?: string; value?: number }>;
        };
        const first = json.data?.[0];
        if (
          first &&
          typeof first.id === "string" &&
          typeof first.status === "string" &&
          typeof first.value === "number"
        ) {
          providerPayment = {
            id: first.id,
            status: first.status,
            value: first.value,
          };
        }
      }
    } catch {
      return { updated: false, status: currentStatusRaw };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (!providerPayment) {
    return { updated: false, status: currentStatusRaw };
  }

  const verifiedPayment = providerPayment;

  return await withSqliteWriteLock(() =>
    db.transaction(async (tx) => {
      const freshRows = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (freshRows.length === 0) {
        return { updated: false, status: "nao_encontrado" };
      }

      const freshOrder = freshRows[0];
      const freshStatusRaw = freshOrder.status || "aguardando_pagamento";
      const freshNormalized: OrderStatus =
        freshStatusRaw === "aguardando pagamento"
          ? "aguardando_pagamento"
          : (freshStatusRaw as OrderStatus);

      if (
        freshNormalized !== "aguardando_pagamento" &&
        freshNormalized !== "aguardando_confirmacao"
      ) {
        return { updated: false, status: freshStatusRaw };
      }

      const expectedTotalCents =
        freshOrder.totalCents != null
          ? freshOrder.totalCents
          : toCents(freshOrder.total);
      const paidCents = toCents(verifiedPayment.value);

      if (
        (verifiedPayment.status === "CONFIRMED" ||
          verifiedPayment.status === "RECEIVED") &&
        paidCents === expectedTotalCents &&
        canTransition(freshNormalized, "pago")
      ) {
        const updateRes = await tx
          .update(orders)
          .set({ status: "pago" })
          .where(and(eq(orders.id, orderId), eq(orders.status, freshStatusRaw)));

        if (updateRes.rowsAffected === 0) {
          return { updated: false, status: freshStatusRaw };
        }

        await tx.insert(orderStatusHistory).values({
          id: `hist_${orderId}_sync_${crypto.randomUUID()}`,
          orderId,
          fromStatus: freshStatusRaw,
          toStatus: "pago",
          actor: "asaas_sync_on_read",
          notes: `Pagamento confirmado na consulta ao provedor (${verifiedPayment.id})`,
          createdAt: new Date().toISOString(),
        });

        return { updated: true, status: "pago" };
      }

      return { updated: false, status: freshStatusRaw };
    })
  );
}

export async function handlePaymentWebhook(params: {
  rawBody: string;
  signatureHeader: string | null;
  accessTokenHeader: string | null;
  secretOverride?: string;
}) {
  const isSignatureValid = verifyWebhookSignature(
    params.rawBody,
    params.signatureHeader,
    params.accessTokenHeader,
    params.secretOverride
  );

  if (!isSignatureValid) {
    return {
      statusHttp: 401,
      body: {
        success: false,
        error: "Assinatura ou token de webhook inválido.",
      },
    };
  }

  let parsed: WebhookEventPayload;
  try {
    parsed = JSON.parse(params.rawBody) as WebhookEventPayload;
  } catch {
    return {
      statusHttp: 400,
      body: {
        success: false,
        error: "JSON inválido no corpo do webhook.",
      },
    };
  }

  // Suporta tanto o campo oficial `id` do Asaas v3 quanto `eventId` legado
  const eventId = (parsed.id || parsed.eventId || "").trim();
  const eventType = parsed.event;
  const orderId = (
    parsed.orderId ||
    parsed.payment?.externalReference ||
    ""
  ).trim();

  if (!eventId || !eventType || !orderId) {
    return {
      statusHttp: 400,
      body: {
        success: false,
        error: "Campos obrigatórios ausentes (id/eventId, event, orderId/externalReference).",
      },
    };
  }

  return await withSqliteWriteLock(() =>
    db.transaction(async (tx) => {
      // 1. Verificar se o pedido existe dentro da transação
      const existingOrders = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (existingOrders.length === 0) {
        return {
          statusHttp: 404,
          body: {
            success: false,
            error: `Pedido ${orderId} não encontrado.`,
          },
        };
      }

      const currentOrder = existingOrders[0];
      const expectedTotalCents =
        currentOrder.totalCents != null
          ? currentOrder.totalCents
          : toCents(currentOrder.total);

      // 2. Validação financeira estrita em centavos inteiros para eventos de confirmação (zero tolerância flutuante)
      if (eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED") {
        const rawValue = parsed.payment?.value;
        if (typeof rawValue !== "number" || !Number.isFinite(rawValue) || rawValue <= 0) {
          return {
            statusHttp: 400,
            body: {
              success: false,
              error: "Valor do pagamento ausente ou inválido no payload do webhook.",
            },
          };
        }

        const paidCents = toCents(rawValue);
        if (paidCents !== expectedTotalCents) {
          return {
            statusHttp: 400,
            body: {
              success: false,
              error: "Valor do pagamento divergente do total do pedido.",
            },
          };
        }

        const hasPixDiscount =
          (currentOrder.discountCents ?? 0) > 0 ||
          currentOrder.paymentMethod === "pix";
        const billingType = parsed.payment?.billingType;
        if (
          hasPixDiscount &&
          typeof billingType === "string" &&
          billingType.trim() !== "" &&
          billingType.trim().toUpperCase() !== "PIX"
        ) {
          return {
            statusHttp: 400,
            body: {
              success: false,
              error:
                "Modalidade de pagamento divergente para pedido com desconto PIX.",
            },
          };
        }
      }

      // 3. Verificação estrita de idempotência no banco (tabela payment_webhooks)
      const existingEvent = await tx
        .select()
        .from(paymentWebhooks)
        .where(eq(paymentWebhooks.eventId, eventId))
        .limit(1);

      if (existingEvent.length > 0) {
        return {
          statusHttp: 200,
          body: {
            success: true,
            idempotentReplay: true,
            eventId,
            orderId,
            status: currentOrder.status,
          },
        };
      }

      const currentStatusRaw = currentOrder.status || "aguardando_pagamento";
      const normalizedCurrentStatus: OrderStatus =
        currentStatusRaw === "aguardando pagamento"
          ? "aguardando_pagamento"
          : (currentStatusRaw as OrderStatus);

      const processedAt = new Date().toISOString();

      // 4. Caso específico da Especificação (Seção G.3): Pedido já marcado como 'expirado' recebe confirmação tardia
      if (
        normalizedCurrentStatus === "expirado" &&
        (eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED")
      ) {
        await tx.insert(paymentWebhooks).values({
          eventId,
          orderId,
          provider: "asaas",
          status: "expirado",
          payload: JSON.stringify({
            event: eventType,
            paymentId: parsed.payment?.id || null,
            latePaymentOnExpired: true,
          }),
          processedAt,
        });

        await tx.insert(orderStatusHistory).values({
          id: `hist_${orderId}_wh_${crypto.randomUUID()}`,
          orderId,
          fromStatus: "expirado",
          toStatus: "expirado",
          actor: "webhook_asaas",
          notes:
            "ALERTA: Pagamento confirmado após expiração. Necessária ação manual da lojista para reativar ou estornar",
          createdAt: processedAt,
        });

        return {
          statusHttp: 200,
          body: {
            success: true,
            idempotentReplay: false,
            expiredOrderAlert: true,
            eventId,
            orderId,
            status: "expirado",
          },
        };
      }

      // 5. Determinar status alvo respeitando máquina de estados monotônica
      let newOrderStatus: string = currentStatusRaw;
      let shouldRestoreStock = false;

      if (eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED") {
        if (canTransition(normalizedCurrentStatus, "pago")) {
          newOrderStatus = "pago";
        }
      } else if (
        eventType === "PAYMENT_REFUNDED" ||
        eventType === "PAYMENT_CHARGEBACK_REQUESTED"
      ) {
        if (canTransition(normalizedCurrentStatus, "cancelado")) {
          newOrderStatus = "cancelado";
          shouldRestoreStock = true;
        }
      } else if (eventType === "PAYMENT_OVERDUE" || eventType === "PAYMENT_DELETED") {
        if (canTransition(normalizedCurrentStatus, "expirado")) {
          newOrderStatus = "expirado";
          shouldRestoreStock = true;
        }
      }

      // 6. Gravar evento processado na transação
      await tx.insert(paymentWebhooks).values({
        eventId,
        orderId,
        provider: "asaas",
        status: newOrderStatus,
        payload: JSON.stringify({
          event: eventType,
          paymentId: parsed.payment?.id || null,
        }),
        processedAt,
      });

      // 7. Atualização condicional de status e estorno único de estoque
      if (newOrderStatus !== currentStatusRaw) {
        const updateRes = await tx
          .update(orders)
          .set({ status: newOrderStatus })
          .where(and(eq(orders.id, orderId), eq(orders.status, currentStatusRaw)));

        if (updateRes.rowsAffected > 0) {
          if (shouldRestoreStock) {
            const itemsToRestore = await tx
              .select()
              .from(orderItems)
              .where(eq(orderItems.orderId, orderId));

            for (const item of itemsToRestore) {
              await tx
                .update(products)
                .set({ stock: sql`${products.stock} + ${item.quantity}` })
                .where(eq(products.id, item.productId));
            }
          }

          await tx.insert(orderStatusHistory).values({
            id: `hist_${orderId}_wh_${crypto.randomUUID()}`,
            orderId,
            fromStatus: currentStatusRaw,
            toStatus: newOrderStatus,
            actor: "webhook_asaas",
            notes: `Evento Asaas ${eventType} (${eventId}) processado com sucesso`,
            createdAt: processedAt,
          });
        }
      } else {
        await tx.insert(orderStatusHistory).values({
          id: `hist_${orderId}_wh_noop_${crypto.randomUUID()}`,
          orderId,
          fromStatus: currentStatusRaw,
          toStatus: currentStatusRaw,
          actor: "webhook_asaas",
          notes: `Evento Asaas ${eventType} (${eventId}) registrado sem mudança de estado`,
          createdAt: processedAt,
        });
      }

      return {
        statusHttp: 200,
        body: {
          success: true,
          idempotentReplay: false,
          eventId,
          orderId,
          status: newOrderStatus,
        },
      };
    })
  );
}

import crypto from "crypto";
import { db, orders, paymentWebhooks } from "@/db";
import { eq } from "drizzle-orm";

export interface CreatePaymentRequest {
  orderId: string;
  paymentMethod?: "pix" | "card";
}

export interface WebhookEventPayload {
  eventId: string;
  event:
    | "PAYMENT_RECEIVED"
    | "PAYMENT_CONFIRMED"
    | "PAYMENT_OVERDUE"
    | "PAYMENT_REFUNDED"
    | "PAYMENT_DELETED"
    | "PAYMENT_FAILED"
    | "PAYMENT_CREATED";
  orderId?: string;
  payment?: {
    id?: string;
    externalReference?: string;
    value?: number;
    billingType?: string;
    status?: string;
  };
}

export function computeWebhookHmac(rawBody: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  accessTokenHeader: string | null,
  secret?: string
): boolean {
  const effectiveSecret = (secret ?? process.env.PAYMENT_WEBHOOK_SECRET ?? "").trim();
  if (!effectiveSecret) {
    return false;
  }

  // 1. Verificar assinatura criptográfica HMAC-SHA256 (x-webhook-signature)
  if (signatureHeader) {
    const cleanSig = signatureHeader.replace(/^sha256=/i, "").trim();
    const expectedHmac = computeWebhookHmac(rawBody, effectiveSecret);
    const sigBuf = Buffer.from(cleanSig, "utf8");
    const expBuf = Buffer.from(expectedHmac, "utf8");
    if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
      return true;
    }
  }

  // 2. Verificar token de autenticação de webhook do Asaas (asaas-access-token) com timingSafeEqual
  if (accessTokenHeader) {
    const tokenBuf = Buffer.from(accessTokenHeader.trim(), "utf8");
    const secBuf = Buffer.from(effectiveSecret, "utf8");
    if (tokenBuf.length === secBuf.length && crypto.timingSafeEqual(tokenBuf, secBuf)) {
      return true;
    }
  }

  return false;
}

export async function createSandboxPayment(
  input: CreatePaymentRequest,
  options?: { forceSandboxMock?: boolean }
) {
  const orderId = (input.orderId || "").trim();
  if (!orderId) {
    return {
      success: false as const,
      statusHttp: 400,
      error: "O código do pedido (orderId) é obrigatório.",
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
  const billingType = input.paymentMethod === "card" ? "CREDIT_CARD" : "PIX";
  const asaasApiKey = (process.env.ASAAS_API_KEY || "").trim();
  const sandboxMockEnabled =
    options?.forceSandboxMock === true ||
    process.env.PAYMENT_SANDBOX_MODE === "mock" ||
    process.env.PAYMENT_SANDBOX_MODE === "true" ||
    process.env.PAYMENT_SANDBOX_ENABLED === "true";

  // Se credenciais de sandbox não estão ativas, retornar fallback transparente ("em breve" / WhatsApp) sem aprovar pagamento falso
  if (!asaasApiKey && !sandboxMockEnabled) {
    return {
      success: true as const,
      statusHttp: 200,
      sandboxConfigured: false,
      provider: "asaas",
      orderId: order.id,
      orderStatus: order.status,
      billingType,
      amount: order.total,
      message:
        "Checkout online automático em breve. Seu pedido foi salvo como 'aguardando pagamento' para conclusão segura via WhatsApp oficial.",
    };
  }

  // Modo Sandbox Determinístico (testes de contrato e homologação local sem chaves expostas)
  const paymentId = `pay_sandbox_${order.id.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const pixPayload =
    billingType === "PIX"
      ? `00020126580014br.gov.bcb.pix0136marianecosmeticos-sandbox-${order.id}5204000053039865406${order.total.toFixed(
          2
        )}5802BR5918MARIANE COSMETICOS6005LAGES62070503***6304ABCD`
      : null;

  return {
    success: true as const,
    statusHttp: 201,
    sandboxConfigured: true,
    provider: "asaas-sandbox",
    paymentId,
    orderId: order.id,
    orderStatus: "aguardando pagamento",
    billingType,
    amount: order.total,
    pixCopyPaste: pixPayload,
    checkoutUrl: `https://sandbox.asaas.com/i/${paymentId}`,
  };
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

  const eventId = (parsed.eventId || "").trim();
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
        error: "Campos obrigatórios ausentes (eventId, event, orderId).",
      },
    };
  }

  // Verificar se o pedido existe
  const existingOrders = await db
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

  // Validar valor pago em eventos de confirmação para impedir subpagamento adulterado
  if (
    (eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED") &&
    typeof parsed.payment?.value === "number"
  ) {
    if (
      !Number.isFinite(parsed.payment.value) ||
      parsed.payment.value < currentOrder.total - 0.05
    ) {
      return {
        statusHttp: 400,
        body: {
          success: false,
          error: "Valor do pagamento divergente do total do pedido.",
        },
      };
    }
  }

  // Verificação estrita de idempotência no banco (tabela payment_webhooks)
  const existingEvent = await db
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

  // Mapear evento para novo status do pedido respeitando máquina de estados monotônica
  const currentStatus = currentOrder.status || "aguardando pagamento";
  let candidateStatus = currentStatus;
  if (eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED") {
    candidateStatus = "pago";
  } else if (
    eventType === "PAYMENT_OVERDUE" ||
    eventType === "PAYMENT_FAILED" ||
    eventType === "PAYMENT_DELETED"
  ) {
    candidateStatus = "falhou";
  } else if (eventType === "PAYMENT_REFUNDED") {
    candidateStatus = "estornado";
  }

  let newOrderStatus = candidateStatus;
  if (currentStatus === "estornado") {
    newOrderStatus = "estornado";
  } else if (currentStatus === "pago" && candidateStatus !== "estornado") {
    // Impede que um evento atrasado de falha/vencimento rebaixe um pedido já pago
    newOrderStatus = "pago";
  }

  const processedAt = new Date().toISOString();

  // Gravar evento processado de forma atômica contra corrida concorrente (PRIMARY KEY event_id)
  try {
    await db.insert(paymentWebhooks).values({
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
  } catch {
    const refreshedOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    return {
      statusHttp: 200,
      body: {
        success: true,
        idempotentReplay: true,
        eventId,
        orderId,
        status: refreshedOrders[0]?.status ?? currentStatus,
      },
    };
  }

  if (newOrderStatus !== currentStatus) {
    await db
      .update(orders)
      .set({ status: newOrderStatus })
      .where(eq(orders.id, orderId));
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
}

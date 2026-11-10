import { NextResponse } from "next/server";
import { createSandboxPayment } from "@/lib/payments";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { createProblemDetailsResponse } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const clientIp = extractClientIp(request);
    const rateCheck = checkRateLimit("create_payment", clientIp, 15, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      const detail = `Limite de tentativas de pagamento excedido. Aguarde ${rateCheck.retryAfterSeconds} segundos.`;
      return createProblemDetailsResponse(429, "Limite de tentativas excedido", detail, {
        extra: { success: false, error: detail, retryAfterSeconds: rateCheck.retryAfterSeconds },
      });
    }

    const rawBody: unknown = await request.json();
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      const detail = "Payload de pagamento inválido.";
      return createProblemDetailsResponse(400, "Payload inválido", detail, {
        extra: { success: false, error: detail },
      });
    }

    const body = rawBody as Record<string, unknown>;
    if (body.orderId !== undefined && typeof body.orderId !== "string") {
      const detail = "O código do pedido (orderId) deve ser texto.";
      return createProblemDetailsResponse(400, "Parâmetro inválido", detail, {
        extra: { success: false, error: detail },
      });
    }
    if (body.returnUrl !== undefined && typeof body.returnUrl !== "string") {
      const detail = "A URL de retorno (returnUrl) deve ser texto.";
      return createProblemDetailsResponse(400, "Parâmetro inválido", detail, {
        extra: { success: false, error: detail },
      });
    }
    if (
      body.paymentMethod !== undefined &&
      body.paymentMethod !== "pix" &&
      body.paymentMethod !== "card"
    ) {
      const detail = "Método de pagamento inválido. Use 'pix' ou 'card'.";
      return createProblemDetailsResponse(400, "Método inválido", detail, {
        extra: { success: false, error: detail },
      });
    }

    const result = await createSandboxPayment({
      orderId: typeof body.orderId === "string" ? body.orderId : "",
      paymentMethod: body.paymentMethod,
      returnUrl: body.returnUrl,
    });

    if (!result.success) {
      return createProblemDetailsResponse(
        result.statusHttp,
        "Não foi possível iniciar o pagamento",
        result.error,
        {
          extra: { success: false, error: result.error },
        }
      );
    }

    return NextResponse.json(result, { status: result.statusHttp });
  } catch {
    const detail = "Erro ao iniciar criação de pagamento.";
    return createProblemDetailsResponse(500, "Erro interno de pagamento", detail, {
      extra: { success: false, error: detail },
    });
  }
}

import { NextResponse } from "next/server";
import { createOrderTransaction } from "@/lib/orders";
import { createProblemDetailsResponse } from "@/lib/api-errors";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate Limiting: máx 5 pedidos por IP a cada 10 minutos (Especificação Seção J.1)
    const clientIp = extractClientIp(request);
    const rateCheck = checkRateLimit("create_order", clientIp, 5, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return createProblemDetailsResponse(
        429,
        "Muitas requisições",
        `Limite de criação de pedidos excedido. Aguarde ${rateCheck.retryAfterSeconds} segundos antes de tentar novamente.`,
        {
          type: "https://marianecosmeticos.com.br/erros/limite-requisicoes",
          extra: { retryAfterSeconds: rateCheck.retryAfterSeconds },
        }
      );
    }

    const body: unknown = await request.json();
    const result = await createOrderTransaction(body);

    if (!result.success) {
      return createProblemDetailsResponse(
        result.statusHttp,
        result.title,
        result.errors.join(" "),
        {
          type: `https://marianecosmeticos.com.br/erros/${result.statusHttp}`,
          errors: result.errors,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        idempotent: result.idempotent,
        order: result.order,
      },
      { status: result.statusHttp }
    );
  } catch (error) {
    console.error("Erro não tratado ao registrar pedido:", error);
    return createProblemDetailsResponse(
      500,
      "Erro interno do servidor",
      "Não foi possível processar o pedido no momento. Tente novamente em instantes.",
      {
        type: "https://marianecosmeticos.com.br/erros/servidor",
      }
    );
  }
}

export async function GET() {
  // Acesso direto por código humano descontinuado por segurança (Prevenção contra IDOR / Enumeração)
  return createProblemDetailsResponse(
    400,
    "Consulta descontinuada",
    "A consulta de pedidos por código curto foi descontinuada. Utilize o endpoint seguro por token público: /api/pedidos/[publicToken].",
    {
      type: "https://marianecosmeticos.com.br/erros/endpoint-descontinuado",
    }
  );
}

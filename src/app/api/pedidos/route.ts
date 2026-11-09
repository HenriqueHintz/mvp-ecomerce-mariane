import { NextResponse } from "next/server";
import { createOrderTransaction } from "@/lib/orders";
import { createProblemDetailsResponse } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
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

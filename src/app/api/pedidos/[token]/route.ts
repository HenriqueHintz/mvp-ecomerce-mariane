import { NextResponse } from "next/server";
import { getOrderByPublicToken } from "@/lib/orders";
import { createProblemDetailsResponse } from "@/lib/api-errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || token.trim().length < 10) {
      return createProblemDetailsResponse(
        400,
        "Token público inválido",
        "O token do pedido informado é inválido.",
        {
          type: "https://marianecosmeticos.com.br/erros/token-invalido",
        }
      );
    }

    const order = await getOrderByPublicToken(token.trim());
    if (!order) {
      return createProblemDetailsResponse(
        404,
        "Pedido não encontrado",
        "Nenhum pedido localizado com o token público informado.",
        {
          type: "https://marianecosmeticos.com.br/erros/pedido-nao-encontrado",
        }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Erro ao consultar pedido por token público:", error);
    return createProblemDetailsResponse(
      500,
      "Erro interno do servidor",
      "Não foi possível consultar os dados do pedido no momento.",
      {
        type: "https://marianecosmeticos.com.br/erros/servidor",
      }
    );
  }
}

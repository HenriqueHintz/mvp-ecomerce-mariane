import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
  verifyAdminCsrfOrigin,
} from "@/lib/admin-auth";
import { changeOrderStatus } from "@/lib/orders";
import {
  OrderStatus,
  InvalidStatusTransitionError,
  ORDER_STATUS_LABELS,
} from "@/lib/order-state-machine";
import { createProblemDetailsResponse } from "@/lib/api-errors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminCsrfOrigin(request)) {
    return createProblemDetailsResponse(
      403,
      "Origem não autorizada",
      "Requisição cross-origin bloqueada por proteção CSRF."
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!verifyAdminSessionToken(token)) {
    return createProblemDetailsResponse(
      401,
      "Não autorizado",
      "Sessão administrativa inválida ou expirada."
    );
  }

  try {
    const { id } = await params;
    const rawBody: unknown = await request.json();
    const body =
      rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
        ? (rawBody as { status?: unknown; notes?: unknown })
        : {};
    const nextStatus = (
      typeof body.status === "string" ? body.status.trim() : ""
    ) as OrderStatus;
    const notes =
      typeof body.notes === "string" ? body.notes.trim().slice(0, 300) : undefined;

    if (!nextStatus || !(nextStatus in ORDER_STATUS_LABELS)) {
      return createProblemDetailsResponse(
        400,
        "Status inválido",
        "O novo status informado não pertence à máquina de estados oficial."
      );
    }

    const updated = await changeOrderStatus(
      id,
      nextStatus,
      "admin",
      notes || "Atualizado manualmente no painel da loja"
    );

    return NextResponse.json({
      success: true,
      status: updated.status,
    });
  } catch (error) {
    if (error instanceof InvalidStatusTransitionError) {
      return createProblemDetailsResponse(
        409,
        "Transição de status não permitida",
        error.message
      );
    }
    if (error instanceof Error && error.message.includes("não encontrado")) {
      return createProblemDetailsResponse(
        404,
        "Pedido não encontrado",
        "O pedido informado não foi localizado no banco de dados."
      );
    }
    console.error("Erro inesperado ao atualizar status do pedido:", error);
    return createProblemDetailsResponse(
      500,
      "Erro ao atualizar status",
      "Não foi possível atualizar o status do pedido no momento."
    );
  }
}

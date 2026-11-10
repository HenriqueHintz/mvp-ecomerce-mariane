import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-auth";
import { queryAdminOrders } from "@/lib/admin-orders";
import { createProblemDetailsResponse } from "@/lib/api-errors";

export async function GET(request: Request) {
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
    const url = new URL(request.url);
    const status = (url.searchParams.get("status") || "todos").trim();
    const search = (url.searchParams.get("q") || "").trim();
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "20");

    const result = await queryAdminOrders({
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        orders: result.orders,
        pagination: result.pagination,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao listar pedidos no painel admin:", error);
    return createProblemDetailsResponse(
      500,
      "Erro ao carregar pedidos",
      "Não foi possível consultar a lista de pedidos."
    );
  }
}

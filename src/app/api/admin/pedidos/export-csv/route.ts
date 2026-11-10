import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, orders } from "@/db";
import { desc } from "drizzle-orm";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
  generateOrdersCsv,
} from "@/lib/admin-auth";
import { createProblemDetailsResponse } from "@/lib/api-errors";

export async function GET() {
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
    const rows = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(500);

    const csvContent = generateOrdersCsv(rows);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "Content-Disposition": `attachment; filename="pedidos-mariane-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar CSV de pedidos:", error);
    return createProblemDetailsResponse(
      500,
      "Erro ao exportar CSV",
      "Não foi possível gerar o arquivo CSV de pedidos."
    );
  }
}

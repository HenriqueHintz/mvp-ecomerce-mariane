import { NextResponse } from "next/server";
import { createOrderTransaction } from "@/lib/orders";
import { sendOrderReceivedEmail } from "@/lib/order-emails";
import { createProblemDetailsResponse } from "@/lib/api-errors";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import {
  EMAIL_VERIFICATION_COOKIE_NAME,
  extractCookieFromRequest,
  verifyVerifiedEmailToken,
} from "@/lib/email-verification";
import { SITE_URL } from "@/lib/site";

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
          type: `${SITE_URL}/erros/limite-requisicoes`,
          extra: { retryAfterSeconds: rateCheck.retryAfterSeconds },
        }
      );
    }

    const body: unknown = await request.json();

    const bodyEmail =
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      typeof (body as { customerEmail?: unknown }).customerEmail === "string"
        ? (body as { customerEmail: string }).customerEmail
        : "";

    const emailToken = extractCookieFromRequest(
      request,
      EMAIL_VERIFICATION_COOKIE_NAME
    );

    if (!bodyEmail.trim() || !verifyVerifiedEmailToken(emailToken, bodyEmail)) {
      return createProblemDetailsResponse(
        403,
        "E-mail não verificado",
        "Confirme seu e-mail para finalizar o pedido.",
        {
          type: `${SITE_URL}/erros/email-nao-verificado`,
        }
      );
    }

    const result = await createOrderTransaction(body);

    if (!result.success) {
      return createProblemDetailsResponse(
        result.statusHttp,
        result.title,
        result.errors.join(" "),
        {
          type: `${SITE_URL}/erros/${result.statusHttp}`,
          errors: result.errors,
        }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        idempotent: result.idempotent,
        order: result.order,
      },
      { status: result.statusHttp }
    );

    // Após criar o pedido com sucesso, invalida o token de verificação de e-mail e envia resumo transacional
    if (result.statusHttp === 201) {
      response.cookies.set({
        name: EMAIL_VERIFICATION_COOKIE_NAME,
        value: "",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      await sendOrderReceivedEmail(result.order.id);
    }

    return response;
  } catch (error) {
    console.error("Erro não tratado ao registrar pedido:", error);
    return createProblemDetailsResponse(
      500,
      "Erro interno do servidor",
      "Não foi possível processar o pedido no momento. Tente novamente em instantes.",
      {
        type: `${SITE_URL}/erros/servidor`,
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
      type: `${SITE_URL}/erros/endpoint-descontinuado`,
    }
  );
}

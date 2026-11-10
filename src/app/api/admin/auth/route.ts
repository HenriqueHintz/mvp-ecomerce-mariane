import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_TTL_MS,
  verifyAdminPassword,
  createAdminSessionToken,
  verifyAdminCsrfOrigin,
} from "@/lib/admin-auth";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { createProblemDetailsResponse } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    if (!verifyAdminCsrfOrigin(request)) {
      return createProblemDetailsResponse(
        403,
        "Origem não autorizada",
        "Requisição cross-origin bloqueada por proteção CSRF."
      );
    }

    // Rate limit rigoroso: máx 5 tentativas por 15 minutos por IP + trava global contra spoofing (Especificação Seção K.1)
    const clientIp = extractClientIp(request);
    const rate = checkRateLimit("admin_login", clientIp, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      return createProblemDetailsResponse(
        429,
        "Muitas tentativas de login",
        `Limite de tentativas excedido. Aguarde ${rate.retryAfterSeconds} segundos.`,
        {
          type: "https://marianecosmeticos.com.br/erros/limite-login",
          extra: { retryAfterSeconds: rate.retryAfterSeconds },
        }
      );
    }

    const rawBody: unknown = await request.json();
    const body =
      rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
        ? (rawBody as { password?: unknown })
        : {};
    const password = typeof body.password === "string" ? body.password : "";

    if (!verifyAdminPassword(password)) {
      const globalFailRate = checkRateLimit(
        "admin_login_global_fail",
        "global",
        25,
        15 * 60 * 1000
      );
      if (!globalFailRate.allowed) {
        return createProblemDetailsResponse(
          429,
          "Muitas tentativas de login",
          `Limite global de segurança excedido. Aguarde ${globalFailRate.retryAfterSeconds} segundos.`,
          {
            type: "https://marianecosmeticos.com.br/erros/limite-login",
            extra: { retryAfterSeconds: globalFailRate.retryAfterSeconds },
          }
        );
      }

      return createProblemDetailsResponse(
        401,
        "Credenciais inválidas",
        "A senha administrativa informada está incorreta.",
        {
          type: "https://marianecosmeticos.com.br/erros/credenciais-invalidas",
        }
      );
    }

    const token = createAdminSessionToken();
    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
    });

    return response;
  } catch (error) {
    console.error("Erro na autenticação administrativa:", error);
    return createProblemDetailsResponse(
      500,
      "Erro interno de autenticação",
      "Verifique se a variável ADMIN_PASSWORD está configurada no servidor."
    );
  }
}

export async function DELETE(request: Request) {
  if (!verifyAdminCsrfOrigin(request)) {
    return createProblemDetailsResponse(
      403,
      "Origem não autorizada",
      "Requisição cross-origin bloqueada por proteção CSRF."
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

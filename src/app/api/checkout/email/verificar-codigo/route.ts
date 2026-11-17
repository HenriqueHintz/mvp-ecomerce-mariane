import { NextResponse } from "next/server";
import { createProblemDetailsResponse } from "@/lib/api-errors";
import { SITE_URL } from "@/lib/site";
import {
  EMAIL_VERIFICATION_COOKIE_NAME,
  VERIFIED_COOKIE_MAX_AGE_SECONDS,
  verifyCodeRequestSchema,
  verifyEmailCode,
} from "@/lib/email-verification";

export async function POST(request: Request) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return createProblemDetailsResponse(
        400,
        "Requisição inválida",
        "Não foi possível ler os dados enviados.",
        { type: `${SITE_URL}/erros/requisicao-invalida` }
      );
    }

    const parsed = verifyCodeRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createProblemDetailsResponse(
        400,
        "Código inválido",
        parsed.error.issues.map((i) => i.message).join(" "),
        {
          type: `${SITE_URL}/erros/validacao`,
          errors: parsed.error.issues.map((i) => i.message),
        }
      );
    }

    const result = await verifyEmailCode({
      email: parsed.data.email,
      code: parsed.data.code,
    });

    if (!result.ok) {
      return createProblemDetailsResponse(
        result.statusHttp,
        result.title,
        result.detail,
        {
          type: `${SITE_URL}/erros/verificacao-email`,
          extra: {
            ...(result.code ? { errorCode: result.code } : {}),
            ...(typeof result.attemptsRemaining === "number"
              ? { attemptsRemaining: result.attemptsRemaining }
              : {}),
          },
        }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        verified: true,
        email: result.email,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: EMAIL_VERIFICATION_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: VERIFIED_COOKIE_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error(
      "[otp] Erro inesperado em POST /api/checkout/email/verificar-codigo:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
    return createProblemDetailsResponse(
      500,
      "Erro interno do servidor",
      "Não foi possível validar o código de verificação no momento.",
      { type: `${SITE_URL}/erros/servidor` }
    );
  }
}

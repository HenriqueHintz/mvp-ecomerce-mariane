import { NextResponse } from "next/server";
import { createProblemDetailsResponse } from "@/lib/api-errors";
import { extractClientIp } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";
import {
  sendCodeRequestSchema,
  sendVerificationCode,
} from "@/lib/email-verification";

const GENERIC_SEND_MESSAGE = "Se o e-mail for válido, enviamos um código.";

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

    const parsed = sendCodeRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createProblemDetailsResponse(
        400,
        "Dados inválidos",
        parsed.error.issues.map((i) => i.message).join(" "),
        {
          type: `${SITE_URL}/erros/validacao`,
          errors: parsed.error.issues.map((i) => i.message),
        }
      );
    }

    const ip = extractClientIp(request);
    const outcome = await sendVerificationCode({
      email: parsed.data.email,
      ip,
    });

    if (!outcome.ok) {
      const response = createProblemDetailsResponse(
        outcome.statusHttp,
        outcome.title,
        outcome.detail,
        {
          type: `${SITE_URL}/erros/verificacao-email`,
          extra: outcome.retryAfterSeconds
            ? { retryAfterSeconds: outcome.retryAfterSeconds }
            : undefined,
        }
      );

      if (outcome.retryAfterSeconds) {
        response.headers.set("Retry-After", String(outcome.retryAfterSeconds));
      }
      return response;
    }

    const responseBody: {
      success: true;
      message: string;
      testCode?: string;
    } = {
      success: true,
      message: GENERIC_SEND_MESSAGE,
    };

    if (process.env.NODE_ENV === "test") {
      responseBody.testCode = outcome.code;
    }

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error(
      "[otp] Erro inesperado em POST /api/checkout/email/enviar-codigo:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
    return createProblemDetailsResponse(
      500,
      "Erro interno do servidor",
      "Não foi possível enviar o código de verificação no momento.",
      { type: `${SITE_URL}/erros/servidor` }
    );
  }
}

import { NextResponse } from "next/server";
import { handlePaymentWebhook } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-webhook-signature");
    const accessTokenHeader =
      request.headers.get("asaas-access-token") ||
      request.headers.get("x-asaas-access-token");

    const result = await handlePaymentWebhook({
      rawBody,
      signatureHeader,
      accessTokenHeader,
    });

    return NextResponse.json(result.body, { status: result.statusHttp });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erro ao processar webhook de pagamento." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createSandboxPayment } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      paymentMethod?: "pix" | "card";
    };

    const result = await createSandboxPayment({
      orderId: body.orderId || "",
      paymentMethod: body.paymentMethod,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusHttp }
      );
    }

    return NextResponse.json(result, { status: result.statusHttp });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erro ao iniciar criação de pagamento." },
      { status: 500 }
    );
  }
}

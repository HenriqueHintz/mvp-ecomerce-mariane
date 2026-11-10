import { NextResponse } from "next/server";
import { db, products } from "@/db";
import { inArray } from "drizzle-orm";
import { quoteRequestSchema } from "@/lib/validations/checkout";
import { calculateOrderPricing, toCents } from "@/lib/pricing";
import { createProblemDetailsResponse } from "@/lib/api-errors";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { COMMERCE_CONFIG } from "@/config/commerce";

export async function POST(request: Request) {
  try {
    // Rate Limiting: máx 30 cotações por minuto por IP (Especificação Seção J.1)
    const clientIp = extractClientIp(request);
    const rateCheck = checkRateLimit("checkout_quote", clientIp, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return createProblemDetailsResponse(
        429,
        "Muitas cotações",
        `Limite de cotações por minuto excedido. Aguarde ${rateCheck.retryAfterSeconds} segundos.`,
        {
          type: "https://marianecosmeticos.com.br/erros/limite-requisicoes",
          extra: { retryAfterSeconds: rateCheck.retryAfterSeconds },
        }
      );
    }

    const json: unknown = await request.json();
    const parsed = quoteRequestSchema.safeParse(json);

    if (!parsed.success) {
      const errorMap: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const field = err.path.join(".");
        errorMap[field] = errorMap[field] || [];
        errorMap[field].push(err.message);
      });

      return createProblemDetailsResponse(
        400,
        "Dados de cotação inválidos",
        "A requisição contém dados incompletos ou formatos incorretos.",
        {
          type: "https://marianecosmeticos.com.br/erros/validacao-cotacao",
          errors: errorMap,
        }
      );
    }

    const { items, deliveryMode, paymentMethod } = parsed.data;

    // Agregar itens com mesmo productId (simétrico a createOrderTransaction)
    const itemMap = new Map<string, number>();
    for (const item of items) {
      const current = itemMap.get(item.productId) || 0;
      itemMap.set(item.productId, current + item.quantity);
    }

    for (const [, totalQty] of Array.from(itemMap.entries())) {
      if (totalQty > COMMERCE_CONFIG.MAX_QUANTITY_PER_ITEM) {
        return createProblemDetailsResponse(
          400,
          "Quantidade máxima excedida",
          `Quantidade máxima por item é ${COMMERCE_CONFIG.MAX_QUANTITY_PER_ITEM} unidades.`,
          {
            type: "https://marianecosmeticos.com.br/erros/validacao-cotacao",
          }
        );
      }
    }

    const aggregatedItems = Array.from(itemMap.entries())
      .map(([productId, quantity]) => ({ productId, quantity }))
      .sort((a, b) => a.productId.localeCompare(b.productId));

    const requestedIds = aggregatedItems.map((i) => i.productId);

    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, requestedIds));

    const prodMap = new Map(dbProducts.map((p) => [p.id, p]));

    for (const item of aggregatedItems) {
      if (!prodMap.has(item.productId)) {
        return createProblemDetailsResponse(
          400,
          "Produto não encontrado",
          `O produto '${item.productId}' não foi localizado no catálogo da loja.`,
          {
            type: "https://marianecosmeticos.com.br/erros/produto-inexistente",
          }
        );
      }
    }

    const pricingItems = aggregatedItems.map((item) => {
      const prod = prodMap.get(item.productId)!;
      // Preferir centavos inteiros da nova coluna, com fallback seguro para reais legados
      const priceCents =
        prod.priceCents != null ? prod.priceCents : toCents(prod.price);
      const promoPriceCents =
        prod.promoPriceCents != null
          ? prod.promoPriceCents
          : prod.promoPrice
          ? toCents(prod.promoPrice)
          : null;

      return {
        productId: prod.id,
        name: prod.name,
        priceCents,
        promoPriceCents,
        quantity: item.quantity,
        pixDiscountPercent: prod.pixDiscountPercent,
      };
    });

    const quote = calculateOrderPricing({
      deliveryMode,
      paymentMethod,
      items: pricingItems,
    });

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error) {
    console.error("Erro ao calcular cotação de checkout:", error);
    return createProblemDetailsResponse(
      500,
      "Erro interno de cotação",
      "Não foi possível calcular os valores da cotação no momento. Tente novamente em instantes.",
      {
        type: "https://marianecosmeticos.com.br/erros/servidor",
      }
    );
  }
}

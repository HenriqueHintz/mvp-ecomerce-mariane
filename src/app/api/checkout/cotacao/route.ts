import { NextResponse } from "next/server";
import { db, products } from "@/db";
import { inArray } from "drizzle-orm";
import { quoteRequestSchema } from "@/lib/validations/checkout";
import { calculateOrderPricing, toCents } from "@/lib/pricing";
import {
  checkCouponQuoteRateLimit,
  findCouponByCode,
} from "@/lib/coupons";
import { createProblemDetailsResponse } from "@/lib/api-errors";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { COMMERCE_CONFIG } from "@/config/commerce";
import { SITE_URL } from "@/lib/site";

export async function POST(request: Request) {
  try {
    // Rate Limiting geral: máx 60 cotações por minuto por IP
    const clientIp = extractClientIp(request);
    const rateCheck = checkRateLimit("checkout_quote", clientIp, 60, 60 * 1000);
    if (!rateCheck.allowed) {
      return createProblemDetailsResponse(
        429,
        "Muitas cotações",
        `Limite de cotações por minuto excedido. Aguarde ${rateCheck.retryAfterSeconds} segundos.`,
        {
          type: `${SITE_URL}/erros/limite-requisicoes`,
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
          type: `${SITE_URL}/erros/validacao-cotacao`,
          errors: errorMap,
        }
      );
    }

    const { items, deliveryMode, paymentMethod, cep, couponCode } = parsed.data;
    const rawCouponInput =
      typeof couponCode === "string" && couponCode.trim().length > 0
        ? couponCode.trim()
        : null;

    // Rate Limit persistido no banco: máx 10 tentativas de cupom não vazio por IP a cada 10 minutos
    if (rawCouponInput) {
      const couponRl = await checkCouponQuoteRateLimit(clientIp);
      if (!couponRl.allowed) {
        const response = createProblemDetailsResponse(
          429,
          "Muitas tentativas de cupom",
          `Limite de tentativas de cupom atingido. Aguarde ${couponRl.retryAfterSeconds} segundos.`,
          {
            type: `${SITE_URL}/erros/limite-cupom`,
            extra: { retryAfterSeconds: couponRl.retryAfterSeconds },
          }
        );
        response.headers.set("Retry-After", String(couponRl.retryAfterSeconds));
        return response;
      }
    }

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
            type: `${SITE_URL}/erros/validacao-cotacao`,
          }
        );
      }
    }

    const aggregatedItems = Array.from(itemMap.entries())
      .map(([productId, quantity]) => ({ productId, quantity }))
      .sort((a, b) => a.productId.localeCompare(b.productId));

    const requestedIds = aggregatedItems.map((i) => i.productId);

    const [dbProducts, couponRecord] = await Promise.all([
      db.select().from(products).where(inArray(products.id, requestedIds)),
      rawCouponInput ? findCouponByCode(rawCouponInput) : Promise.resolve(null),
    ]);

    const prodMap = new Map(dbProducts.map((p) => [p.id, p]));

    for (const item of aggregatedItems) {
      if (!prodMap.has(item.productId)) {
        return createProblemDetailsResponse(
          400,
          "Produto não encontrado",
          `O produto '${item.productId}' não foi localizado no catálogo da loja.`,
          {
            type: `${SITE_URL}/erros/produto-inexistente`,
          }
        );
      }
    }

    const pricingItems = aggregatedItems.map((item) => {
      const prod = prodMap.get(item.productId)!;
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
      cep: cep ?? null,
      coupon: couponRecord,
      couponCodeInput: rawCouponInput,
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
        type: `${SITE_URL}/erros/servidor`,
      }
    );
  }
}

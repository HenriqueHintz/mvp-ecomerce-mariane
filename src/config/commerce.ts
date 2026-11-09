export const COMMERCE_CONFIG = {
  // Valores monetários rigorosamente em centavos inteiros
  SHIPPING_FIXED_CENTS: 2290, // R$ 22,90
  FREE_SHIPPING_THRESHOLD_CENTS: 19900, // R$ 199,00
  DEFAULT_PIX_DISCOUNT_PERCENT: 5, // 5%
  MAX_INSTALLMENTS: 10,
  MIN_INSTALLMENT_VALUE_CENTS: 2000, // R$ 20,00 por parcela mínima
  ORDER_EXPIRATION_HOURS: 24, // 24 horas para expiração de pedidos pendentes
  MAX_ITEMS_PER_ORDER: 50,
  MAX_QUANTITY_PER_ITEM: 20,

  // Feature Flags de Gateway
  PAYMENT_FEATURES: {
    whatsapp: true, // Sempre ativo no MVP
    pixAsaas: Boolean(
      process.env.NEXT_PUBLIC_ENABLE_PIX === "true" &&
      process.env.ASAAS_API_KEY
    ),
    cardAsaas: Boolean(
      process.env.NEXT_PUBLIC_ENABLE_CARD === "true" &&
      process.env.ASAAS_API_KEY
    ),
  },
} as const;

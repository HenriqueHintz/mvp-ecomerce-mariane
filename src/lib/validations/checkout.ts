import { z } from "zod";
import { COMMERCE_CONFIG } from "@/config/commerce";

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Identificador do produto é obrigatório").max(80),
  quantity: z
    .number()
    .int("A quantidade deve ser um número inteiro")
    .min(1, "Quantidade mínima é 1 unidade")
    .max(
      COMMERCE_CONFIG.MAX_QUANTITY_PER_ITEM,
      `Quantidade máxima permitida por item é ${COMMERCE_CONFIG.MAX_QUANTITY_PER_ITEM} unidades`
    ),
});

export const quoteRequestSchema = z.object({
  deliveryMode: z.enum(["entrega", "retirada"]),
  paymentMethod: z.enum(["whatsapp", "pix", "cartao"]),
  items: z
    .array(checkoutItemSchema)
    .min(1, "A sacola está vazia")
    .max(
      COMMERCE_CONFIG.MAX_ITEMS_PER_ORDER,
      `Limite de ${COMMERCE_CONFIG.MAX_ITEMS_PER_ORDER} itens excedido`
    ),
});

export const createOrderSchema = z
  .object({
    // Contato e Identificação
    customerName: z
      .string()
      .trim()
      .min(3, "Informe o nome completo (mínimo 3 caracteres)")
      .max(120, "Nome muito longo")
      .transform((val) => val.replace(/[<>]/g, "").trim()),
    customerPhone: z
      .string()
      .trim()
      .transform((val) => val.replace(/\D/g, ""))
      .refine((digits) => digits.length === 10 || digits.length === 11, {
        message: "Informe um telefone/WhatsApp válido com DDD (ex: 49 99125-1617)",
      }),
    customerEmail: z
      .string()
      .trim()
      .email("Informe um endereço de e-mail válido")
      .max(160)
      .optional()
      .or(z.literal(""))
      .transform((val) => (val ? val.trim() : null)),

    // LGPD - Consentimento opcional de marketing (sempre desmarcado por default)
    marketingConsent: z.boolean().default(false),

    // Modalidade de Entrega
    deliveryMode: z.enum(["entrega", "retirada"]),
    cep: z
      .string()
      .optional()
      .transform((val) => (val ? val.replace(/\D/g, "") : "")),
    address: z
      .string()
      .optional()
      .transform((val) => (val ? val.replace(/[<>]/g, "").trim() : "")),
    city: z
      .string()
      .optional()
      .transform((val) => (val ? val.replace(/[<>]/g, "").trim() : "")),

    // Pagamento e Observações
    paymentMethod: z.enum(["whatsapp", "pix", "cartao"]),
    notes: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? val.replace(/[<>]/g, "").trim().slice(0, 300) : null)),

    // Itens
    items: z
      .array(checkoutItemSchema)
      .min(1, "A sacola de compras está vazia")
      .max(COMMERCE_CONFIG.MAX_ITEMS_PER_ORDER, "Limite de itens excedido"),

    // Anti-fraude & Concorrência
    idempotencyKey: z
      .string()
      .min(16, "Chave de idempotência inválida")
      .max(64),
    honeypot: z
      .string()
      .max(0, "Acesso automatizado detectado")
      .optional()
      .default(""),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMode === "entrega") {
      if (!data.cep || data.cep.length !== 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cep"],
          message: "Informe um CEP válido de 8 dígitos para entrega",
        });
      }
      if (!data.address || data.address.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message: "Informe o endereço completo (rua, número e complemento/bairro)",
        });
      }
      if (!data.city || data.city.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["city"],
          message: "Informe a cidade e estado (ex: Lages - SC)",
        });
      }
    }
  });

export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

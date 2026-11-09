import {
  createOrderSchema,
  quoteRequestSchema,
} from "../../src/lib/validations/checkout";

console.log("▶ Iniciando testes de validação de checkout (Zod)...");

// 1. Payload Válido com Entrega
const validDeliveryPayload = {
  customerName: "Mariane Santos",
  customerPhone: "(49) 99125-1617",
  customerEmail: "mariane@exemplo.com.br",
  deliveryMode: "entrega",
  cep: "88505-300",
  address: "Rua Blumenau, 623",
  city: "Lages - SC",
  paymentMethod: "pix",
  notes: "Deixar na portaria",
  items: [{ productId: "p1", quantity: 2 }],
  idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
  honeypot: "",
  marketingConsent: false,
};

const parsed1 = createOrderSchema.safeParse(validDeliveryPayload);
if (!parsed1.success) {
  throw new Error(`Payload válido com entrega falhou: ${JSON.stringify(parsed1.error.format())}`);
}
if (parsed1.data.customerPhone !== "49991251617") {
  throw new Error("Telefone deveria ser sanitizado para dígitos puros");
}
if (parsed1.data.cep !== "88505300") {
  throw new Error("CEP deveria ser sanitizado para dígitos puros");
}

// 2. Payload Válido com Retirada (sem CEP e sem endereço)
const validPickupPayload = {
  customerName: "Ana Paula",
  customerPhone: "49988776655",
  deliveryMode: "retirada",
  paymentMethod: "whatsapp",
  items: [{ productId: "p2", quantity: 1 }],
  idempotencyKey: "123e4567-e89b-12d3-a456-426614174001",
};

const parsed2 = createOrderSchema.safeParse(validPickupPayload);
if (!parsed2.success) {
  throw new Error(`Payload válido com retirada falhou: ${JSON.stringify(parsed2.error.format())}`);
}

// 3. Validação de Honeypot (Bot Trapping)
const botPayload = {
  ...validDeliveryPayload,
  honeypot: "https://spam.com",
};
const parsedBot = createOrderSchema.safeParse(botPayload);
if (parsedBot.success) {
  throw new Error("Payload com honeypot preenchido DEVE ser rejeitado!");
}

// 4. Quantidade Acima do Limite (> 20)
const excessiveQtyPayload = {
  ...validDeliveryPayload,
  items: [{ productId: "p1", quantity: 21 }],
};
const parsedExcess = createOrderSchema.safeParse(excessiveQtyPayload);
if (parsedExcess.success) {
  throw new Error("Quantidade > 20 por item DEVE ser rejeitada!");
}

// 5. CEP Ausente quando Entrega
const missingCepPayload = {
  ...validDeliveryPayload,
  cep: "",
};
const parsedMissingCep = createOrderSchema.safeParse(missingCepPayload);
if (parsedMissingCep.success) {
  throw new Error("Entrega sem CEP DEVE ser rejeitada!");
}

// 6. Schema de Cotação
const validQuotePayload = {
  deliveryMode: "entrega",
  paymentMethod: "pix",
  items: [{ productId: "p1", quantity: 3 }],
};
const parsedQuote = quoteRequestSchema.safeParse(validQuotePayload);
if (!parsedQuote.success) {
  throw new Error(`Payload de cotação falhou: ${JSON.stringify(parsedQuote.error.format())}`);
}

console.log("✔ Todos os testes de validação de checkout passaram com sucesso!");

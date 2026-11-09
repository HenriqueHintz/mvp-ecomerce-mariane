import { STORE_CONFIG, buildOrderWhatsAppMessage, buildWhatsAppLink } from "../../src/config/store";
import { COMMERCE_CONFIG } from "../../src/config/commerce";

console.log("▶ Iniciando testes de configuração...");

// 1. Validar Store Config
if (STORE_CONFIG.name !== "Mariane Cosméticos") {
  throw new Error("STORE_CONFIG.name incorreto");
}
if (STORE_CONFIG.phone.raw !== "5549991251617") {
  throw new Error("STORE_CONFIG.phone.raw incorreto");
}

// 2. Validar Commerce Config
if (COMMERCE_CONFIG.SHIPPING_FIXED_CENTS !== 2290) {
  throw new Error("COMMERCE_CONFIG.SHIPPING_FIXED_CENTS deve ser 2290 centavos");
}
if (COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS !== 19900) {
  throw new Error("COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS deve ser 19900 centavos");
}
if (COMMERCE_CONFIG.ORDER_EXPIRATION_HOURS !== 24) {
  throw new Error("COMMERCE_CONFIG.ORDER_EXPIRATION_HOURS deve ser 24 horas");
}

// 3. Validar Mensagem do WhatsApp
const sampleMessage = buildOrderWhatsAppMessage({
  humanCode: "MC-20261109-ABC123",
  customerName: "Maria Silva",
  customerPhone: "49991234567",
  deliveryMode: "retirada",
  shippingAddress: STORE_CONFIG.physicalStore.formattedAddress,
  paymentMethod: "pix",
  subtotalCents: 20000,
  discountCents: 1000,
  shippingCents: 0,
  totalCents: 19000,
  items: [
    {
      name: "Shampoo Truss",
      quantity: 1,
      unitPriceCents: 20000,
      lineTotalCents: 20000,
    },
  ],
  publicToken: "token-123456",
});

if (!sampleMessage.includes("MC-20261109-ABC123")) {
  throw new Error("Mensagem não contém código do pedido");
}
// Normalizar espaços para checagem flexível
const normalizedMsg = sampleMessage.replace(/\u00A0/g, " ");
if (!normalizedMsg.includes("R$ 190,00")) {
  throw new Error("Mensagem não contém total formatado em BRL");
}
if (!sampleMessage.includes("/pedido/token-123456")) {
  throw new Error("Mensagem não contém link com publicToken");
}

const waLink = buildWhatsAppLink(sampleMessage);
if (!waLink.startsWith("https://wa.me/5549991251617?text=")) {
  throw new Error("Link do WhatsApp incorreto");
}

console.log("✔ Testes de configuração passaram com sucesso!");

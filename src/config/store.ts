export const STORE_CONFIG = {
  name: "Mariane Cosméticos",
  legalName: "Mariane Cosméticos e Perfumaria Ltda",
  slogan: "Linda é a mulher que bem se quer",
  credential: "Revendedora Oficial Madressenza",
  domain: "https://marianecosmeticos.com.br",
  instagram: {
    handle: "@mariane_cosmeticos_01",
    url: "https://www.instagram.com/mariane_cosmeticos_01/",
  },
  phone: {
    raw: "5549991251617",
    display: "(49) 99125-1617",
    international: "+55 (49) 99125-1617",
  },
  physicalStore: {
    street: "Rua Blumenau",
    number: "623",
    complement: "",
    neighborhood: "São Cristóvão",
    city: "Lages",
    state: "SC",
    cep: "88505-300",
    formattedAddress: "Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)",
    pickupInstructions: "Retirada de segunda a sexta das 09h às 18h e sábado das 09h às 13h.",
  },
} as const;

export interface WhatsAppOrderMessageParams {
  humanCode: string;
  customerName: string;
  customerPhone: string;
  deliveryMode: "entrega" | "retirada";
  shippingAddress: string;
  paymentMethod: "whatsapp" | "pix" | "cartao";
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
  notes?: string | null;
  publicToken: string;
}

export function buildOrderWhatsAppMessage(order: WhatsAppOrderMessageParams): string {
  const formatBrl = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const paymentLabels: Record<"whatsapp" | "pix" | "cartao", string> = {
    whatsapp: "Atendimento & Pagamento via WhatsApp",
    pix: "PIX (com 5% OFF)",
    cartao: "Cartão de Crédito",
  };

  let msg = `*NOVO PEDIDO - ${STORE_CONFIG.name.toUpperCase()}*\n`;
  msg += `_${STORE_CONFIG.slogan}_\n`;
  msg += `📍 _${STORE_CONFIG.physicalStore.formattedAddress}_\n\n`;
  msg += `🧾 *Pedido:* ${order.humanCode}\n`;
  msg += `👤 *Cliente:* ${order.customerName}\n`;
  msg += `📱 *Telefone:* ${order.customerPhone}\n`;
  msg += `🚚 *Modalidade:* ${
    order.deliveryMode === "retirada"
      ? "Retirada na Loja Física"
      : "Entrega em Domicílio"
  }\n`;
  msg += `📍 *Endereço:* ${order.shippingAddress}\n`;
  msg += `💳 *Pagamento:* ${paymentLabels[order.paymentMethod]}\n\n`;
  msg += `*ITENS DO PEDIDO:*\n`;

  order.items.forEach((item, idx) => {
    msg += `${idx + 1}. ${item.name}\n`;
    msg += `   ${item.quantity}x de ${formatBrl(item.unitPriceCents)} = *${formatBrl(
      item.lineTotalCents
    )}*\n`;
  });

  msg += `\n💰 *Subtotal:* ${formatBrl(order.subtotalCents)}`;
  if (order.discountCents > 0) {
    msg += `\n💎 *Desconto PIX:* - ${formatBrl(order.discountCents)}`;
  }
  msg += `\n🚚 *Frete:* ${
    order.shippingCents === 0 ? "GRÁTIS 🎉" : formatBrl(order.shippingCents)
  }`;
  msg += `\n✨ *Total a Pagar:* ${formatBrl(order.totalCents)}`;

  if (order.notes) {
    msg += `\n📝 *Observações:* ${order.notes}`;
  }

  msg += `\n\n🔗 *Acompanhar Pedido:* ${STORE_CONFIG.domain}/pedido/${order.publicToken}`;
  msg += `\n\nOlá! Acabei de registrar o pedido *${order.humanCode}* no site e gostaria de confirmar o atendimento.`;

  return msg;
}

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${STORE_CONFIG.phone.raw}?text=${encodeURIComponent(message)}`;
}

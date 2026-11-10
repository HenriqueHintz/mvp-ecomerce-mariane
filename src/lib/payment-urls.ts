import { STORE_CONFIG } from "@/config/store";
import { COMMERCE_CONFIG } from "@/config/commerce";
import { OrderStatus } from "@/lib/order-state-machine";

const PUBLIC_TOKEN_REGEX =
  /^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
const PUBLIC_TOKEN_PATH_REGEX =
  /^\/pedido\/(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
const ALLOWED_ASAAS_HOSTS = new Set([
  "sandbox.asaas.com",
  "www.asaas.com",
  "asaas.com",
]);

export function isValidPublicToken(token: string | null | undefined): boolean {
  if (typeof token !== "string") return false;
  return PUBLIC_TOKEN_REGEX.test(token.trim());
}

/**
 * Valida estritamente a URL de retorno pós-checkout para impedir ataques de Open Redirect (CWE-601).
 * Aceita apenas caminhos relativos `/pedido/<token-128-bits>` ou URLs absolutas pertencentes ao
 * domínio oficial (`STORE_CONFIG.domain` ou `http://localhost:3001` em dev) apontando para `/pedido/<token-128-bits>`.
 */
export function validateReturnUrl(rawUrl: string): string | null {
  if (typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Bloqueia barras duplas (//evil.com), barras invertidas (/\evil.com), caracteres de controle e credenciais (@)
  if (
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("@") ||
    /[\x00-\x1f\x7f]/.test(trimmed)
  ) {
    return null;
  }

  const canonicalOrigin = new URL(STORE_CONFIG.domain).origin;
  const allowedOrigins = new Set([canonicalOrigin, "http://localhost:3001"]);

  try {
    const parsed = trimmed.startsWith("/")
      ? new URL(trimmed, STORE_CONFIG.domain)
      : new URL(trimmed);

    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
      return null;
    }

    if (!allowedOrigins.has(parsed.origin)) {
      return null;
    }

    if (!PUBLIC_TOKEN_PATH_REGEX.test(parsed.pathname)) {
      return null;
    }

    return `${STORE_CONFIG.domain}${parsed.pathname}`;
  } catch {
    return null;
  }
}

/**
 * Valida estritamente a URL do checkout hospedado retornada pelo Asaas antes de redirecionar o cliente.
 * Exige protocolo HTTPS e hostname estritamente pertencente ao Asaas (`sandbox.asaas.com` ou `www.asaas.com`).
 */
export function validateAsaasCheckoutUrl(rawUrl: string): string | null {
  if (typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.includes("\\") || trimmed.includes("@")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" || parsed.port !== "") return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    if (!ALLOWED_ASAAS_HOSTS.has(parsed.hostname.toLowerCase())) return null;
    if (!/^\/(?:i|c)\/[a-zA-Z0-9_-]+$/.test(parsed.pathname)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Retorna as instruções de próximos passos por status para exibição na página `/pedido/[token]`.
 * Todas as referências de endereço e contato vêm exclusivamente de `STORE_CONFIG`.
 */
export function getNextStepsForStatus(
  status: string,
  deliveryMode: "entrega" | "retirada",
  paymentMethod: "whatsapp" | "pix" | "cartao"
): { title: string; steps: string[] } {
  const normalized: OrderStatus =
    status === "aguardando pagamento"
      ? "aguardando_pagamento"
      : (status as OrderStatus);

  switch (normalized) {
    case "aguardando_confirmacao":
      return {
        title: "Próximos Passos — Confirmação no WhatsApp",
        steps: [
          `Clique em "Falar com a loja no WhatsApp" para enviar o resumo à nossa equipe (${STORE_CONFIG.phone.display}).`,
          "Seus itens já estão reservados por 24 horas enquanto alinhamos o pagamento.",
          deliveryMode === "retirada"
            ? `Após a confirmação, você poderá retirar seu pedido em ${STORE_CONFIG.physicalStore.formattedAddress}.`
            : "Após a confirmação, iniciaremos a separação e o envio para o seu endereço.",
        ],
      };

    case "aguardando_pagamento":
      return {
        title:
          paymentMethod === "pix"
            ? "Próximos Passos — Pagamento via PIX"
            : "Próximos Passos — Pagamento via Cartão",
        steps: [
          paymentMethod === "pix"
            ? "Escaneie o QR Code ou copie o código PIX Copia e Cola abaixo no aplicativo do seu banco."
            : "Conclua o pagamento no ambiente seguro hospedado pelo Asaas clicando no botão de pagamento.",
          "Assim que o pagamento for compensado, esta página atualizará automaticamente para 'Pago'.",
          `Seu estoque está garantido por ${COMMERCE_CONFIG.ORDER_EXPIRATION_HOURS} horas.`,
        ],
      };

    case "pago":
      return {
        title: "Próximos Passos — Pagamento Confirmado",
        steps: [
          "Recebemos a confirmação do seu pagamento com sucesso!",
          "Nossa equipe em Lages – SC já recebeu seu pedido e iniciará a separação dos produtos.",
          "Você pode acompanhar cada avanço por este mesmo link seguro.",
        ],
      };

    case "em_separacao":
      return {
        title: "Próximos Passos — Pedido em Separação",
        steps: [
          "Estamos conferindo o lote, validade e embalagem de cada cosmético do seu pedido.",
          deliveryMode === "retirada"
            ? `Assim que estiver pronto, o status mudará para "Pronto para Retirada" na ${STORE_CONFIG.physicalStore.formattedAddress}.`
            : "Assim que o pacote sair para entrega, o status mudará para 'Enviado'.",
        ],
      };

    case "pronto_para_retirada":
      return {
        title: "Próximos Passos — Pronto para Retirada na Loja",
        steps: [
          `Seu pedido está pronto! Dirija-se à ${STORE_CONFIG.physicalStore.formattedAddress}.`,
          STORE_CONFIG.physicalStore.pickupInstructions,
          "Apresente o código do pedido na recepção da loja.",
        ],
      };

    case "enviado":
      return {
        title: "Próximos Passos — Pedido a Caminho",
        steps: [
          "Seu pedido já saiu da nossa loja e está em rota de entrega para o endereço informado.",
          "Certifique-se de que haja alguém disponível para receber o pacote.",
        ],
      };

    case "entregue":
      return {
        title: "Pedido Concluído — Obrigada pela Preferência!",
        steps: [
          "Seu pedido foi entregue. Esperamos que você ame os resultados no seu ritual de beleza!",
          `Qualquer dúvida sobre o modo de uso ou cronograma capilar, chame nossa consultoria no WhatsApp (${STORE_CONFIG.phone.display}).`,
        ],
      };

    case "expirado":
      return {
        title: "Pedido Expirado — Reserva Encerrada",
        steps: [
          "O prazo de 24 horas para conclusão do pagamento expirou e os itens retornaram automaticamente ao estoque.",
          "Você pode adicionar os produtos novamente na vitrine ou falar com nossa equipe pelo WhatsApp.",
        ],
      };

    case "cancelado":
    default:
      return {
        title: "Pedido Cancelado",
        steps: [
          "Este pedido foi cancelado e os itens reservados foram devolvidos ao estoque.",
          "Caso precise de suporte ou queira refazer o pedido, fale com a loja no WhatsApp.",
        ],
      };
  }
}

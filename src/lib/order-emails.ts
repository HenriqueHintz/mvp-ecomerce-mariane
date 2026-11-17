import { eq } from "drizzle-orm";
import { db, orders, orderItems } from "@/db";
import { sendEmail } from "@/lib/email";
import { formatBrl } from "@/lib/pricing";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/order-state-machine";
import { maskPiiEmail } from "@/lib/orders";
import { createSandboxPayment } from "@/lib/payments";
import { SITE_URL } from "@/lib/site";
import { STORE_CONFIG } from "@/config/store";
import { SHIPPING_ZONES } from "@/config/shipping";
import { getShippingZone } from "@/lib/shipping";

const NOTIFIED_ADMIN_STATUSES = new Set<OrderStatus>([
  "enviado",
  "pronto_para_retirada",
  "entregue",
  "cancelado",
]);

const STATUS_DESCRIPTIONS: Partial<Record<OrderStatus, string>> = {
  enviado:
    "Seu pedido já foi despachado e está a caminho do endereço informado.",
  pronto_para_retirada: `Seu pedido já está separado e pronto para retirada em nossa loja (${STORE_CONFIG.physicalStore.pickupInstructions}).`,
  entregue:
    "Seu pedido foi entregue com sucesso. Obrigado por escolher a Mariane Cosméticos!",
  cancelado:
    "Seu pedido foi cancelado. Caso tenha dúvidas ou precise de atendimento, fale com nossa equipe no WhatsApp.",
};

const PAYMENT_LABELS: Record<string, string> = {
  whatsapp: "Atendimento e Pagamento via WhatsApp",
  pix: "PIX Instantâneo (5% OFF)",
  cartao: "Cartão de Crédito",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderTransactionalShell(params: {
  title: string;
  greetingName: string;
  intro: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  textLines: string[];
}): { html: string; text: string } {
  const logoUrl = `${SITE_URL}/logo-nav.png`;
  const waUrl = `https://wa.me/${STORE_CONFIG.phone.raw}`;

  const secondaryHtml =
    params.secondaryCtaLabel && params.secondaryCtaUrl
      ? `<a href="${escapeHtml(
          params.secondaryCtaUrl
        )}" style="display:inline-block;margin:8px 6px 0;padding:12px 22px;background-color:#FFFFFF;color:#75066A;border:1px solid #75066A;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;">${escapeHtml(
          params.secondaryCtaLabel
        )}</a>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background-color:#FAF5FB;font-family:Inter,Arial,sans-serif;color:#1A0918;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:16px;border:1px solid #EDE2EF;overflow:hidden;">
    <tr>
      <td style="padding:24px 28px;text-align:center;border-bottom:1px solid #F3EBF5;">
        <img src="${escapeHtml(
          logoUrl
        )}" alt="Mariane Cosméticos" width="160" style="max-width:160px;height:auto;display:inline-block;" />
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#4D0046;font-family:Georgia,serif;">
          ${escapeHtml(params.title)}
        </h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#2D182B;">
          Olá, <strong>${escapeHtml(params.greetingName)}</strong>!
        </p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#2D182B;">
          ${escapeHtml(params.intro)}
        </p>
        ${params.bodyHtml}
        <div style="margin:24px 0 8px;text-align:center;">
          <a href="${escapeHtml(
            params.ctaUrl
          )}" style="display:inline-block;margin:8px 6px 0;padding:12px 24px;background-color:#75066A;color:#FFFFFF;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;">${escapeHtml(
            params.ctaLabel
          )}</a>
          ${secondaryHtml}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px;background-color:#FAF5FB;border-top:1px solid #F3EBF5;font-size:12px;line-height:1.6;color:#5A4758;text-align:center;">
        <p style="margin:0 0 6px;">
          <strong>${escapeHtml(STORE_CONFIG.name)}</strong> — &ldquo;${escapeHtml(
    STORE_CONFIG.slogan
  )}&rdquo;
        </p>
        <p style="margin:0 0 6px;">
          ${escapeHtml(STORE_CONFIG.physicalStore.formattedAddress)}
        </p>
        <p style="margin:0 0 10px;">
          WhatsApp oficial: <a href="${escapeHtml(
            waUrl
          )}" style="color:#75066A;font-weight:600;text-decoration:none;">${escapeHtml(
    STORE_CONFIG.phone.display
  )}</a>
        </p>
        <p style="margin:0;font-size:11px;color:#786576;">
          E-mail transacional enviado exclusivamente para acompanhamento do seu pedido.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `${STORE_CONFIG.name} — ${params.title}`,
    "",
    `Olá, ${params.greetingName}!`,
    params.intro,
    "",
    ...params.textLines,
    "",
    `${params.ctaLabel}: ${params.ctaUrl}`,
    ...(params.secondaryCtaLabel && params.secondaryCtaUrl
      ? [`${params.secondaryCtaLabel}: ${params.secondaryCtaUrl}`]
      : []),
    "",
    "---",
    `${STORE_CONFIG.name} | WhatsApp: ${STORE_CONFIG.phone.display}`,
    STORE_CONFIG.physicalStore.formattedAddress,
  ].join("\n");

  return { html, text };
}

async function resolvePaymentLinkForOrder(
  orderId: string,
  paymentMethod: string | null,
  trackingUrl: string
): Promise<string | null> {
  if (paymentMethod !== "pix" && paymentMethod !== "cartao") {
    return null;
  }

  try {
    const paymentResult = await createSandboxPayment({
      orderId,
      paymentMethod: paymentMethod === "cartao" ? "card" : "pix",
      returnUrl: trackingUrl,
    });
    if (
      paymentResult.success &&
      "checkoutUrl" in paymentResult &&
      typeof paymentResult.checkoutUrl === "string" &&
      paymentResult.checkoutUrl
    ) {
      return paymentResult.checkoutUrl;
    }
  } catch {
    // Fallback para link oficial de acompanhamento onde o pagamento está disponível
  }

  return trackingUrl;
}

export async function sendOrderReceivedEmail(orderId: string): Promise<void> {
  try {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (rows.length === 0) return;

    const order = rows[0];
    if (!order.customerEmail || !order.publicToken) return;

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    const trackingUrl = `${SITE_URL}/pedido/${order.publicToken}`;
    const paymentUrl = await resolvePaymentLinkForOrder(
      order.id,
      order.paymentMethod,
      trackingUrl
    );

    const shippingCents = order.shippingCents ?? 0;
    const couponCode = order.couponCode ?? null;
    const couponDiscountCents = order.couponDiscountCents ?? 0;
    const pixDiscountCents = Math.max(
      0,
      (order.discountCents ?? 0) - couponDiscountCents
    );
    const totalCents =
      order.totalCents != null
        ? order.totalCents
        : Math.round(order.total * 100);
    const deliveryLabel =
      order.deliveryMode === "retirada"
        ? "Retirada na Loja Física"
        : "Entrega em Domicílio";
    const paymentLabel =
      PAYMENT_LABELS[order.paymentMethod || "whatsapp"] ||
      order.paymentMethod ||
      "WhatsApp";

    const cepMatch =
      order.deliveryMode === "entrega" && order.shippingAddress
        ? order.shippingAddress.match(/CEP:\s*([0-9-]{8,9})/i)
        : null;
    const shippingZone = cepMatch ? getShippingZone(cepMatch[1]) : null;
    const shippingZoneMeta = shippingZone ? SHIPPING_ZONES[shippingZone] : null;
    const shippingLabelText = shippingZoneMeta
      ? `Frete (${shippingZoneMeta.label} · ${shippingZoneMeta.etaMin} a ${shippingZoneMeta.etaMax} dias úteis)`
      : "Frete";

    const itemsHtml = items
      .map((item) => {
        const lineCents =
          item.lineTotalCents ?? Math.round(item.unitPrice * item.quantity * 100);
        return `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #F3EBF5;font-size:13px;color:#2D182B;">
            ${item.quantity}x ${escapeHtml(item.productName)}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #F3EBF5;font-size:13px;color:#1A0918;text-align:right;font-weight:600;white-space:nowrap;">
            ${escapeHtml(formatBrl(lineCents))}
          </td>
        </tr>`;
      })
      .join("");

    const couponHtmlRow =
      couponCode && couponDiscountCents > 0
        ? `<tr>
          <td style="padding:8px 0;font-size:13px;color:#0F766E;">Cupom ${escapeHtml(
            couponCode
          )}</td>
          <td style="padding:8px 0;font-size:13px;color:#0F766E;text-align:right;font-weight:600;">
            &minus;${escapeHtml(formatBrl(couponDiscountCents))}
          </td>
        </tr>`
        : "";

    const pixHtmlRow =
      pixDiscountCents > 0
        ? `<tr>
          <td style="padding:8px 0;font-size:13px;color:#75066A;">Desconto PIX</td>
          <td style="padding:8px 0;font-size:13px;color:#75066A;text-align:right;font-weight:600;">
            &minus;${escapeHtml(formatBrl(pixDiscountCents))}
          </td>
        </tr>`
        : "";

    const bodyHtml = `
      <div style="background:#FAF5FB;border:1px solid #EDE2EF;border-radius:12px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px;font-size:13px;color:#4D0046;"><strong>Pedido:</strong> ${escapeHtml(
          order.id
        )}</p>
        <p style="margin:0 0 6px;font-size:13px;color:#2D182B;"><strong>Recebimento:</strong> ${escapeHtml(
          deliveryLabel
        )}</p>
        ${
          order.shippingAddress
            ? `<p style="margin:0 0 6px;font-size:12px;color:#5A4758;">${escapeHtml(
                order.shippingAddress
              )}</p>`
            : ""
        }
        <p style="margin:0;font-size:13px;color:#2D182B;"><strong>Pagamento:</strong> ${escapeHtml(
          paymentLabel
        )}</p>
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:12px;">
        ${itemsHtml}
        ${couponHtmlRow}
        ${pixHtmlRow}
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#5A4758;">${escapeHtml(
            shippingLabelText
          )}</td>
          <td style="padding:8px 0;font-size:13px;color:#1A0918;text-align:right;">
            ${shippingCents === 0 ? "Grátis" : escapeHtml(formatBrl(shippingCents))}
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0 0;border-top:2px solid #EDE2EF;font-size:15px;font-weight:700;color:#1A0918;">Total</td>
          <td style="padding:10px 0 0;border-top:2px solid #EDE2EF;font-size:16px;font-weight:700;color:#75066A;text-align:right;">
            ${escapeHtml(formatBrl(totalCents))}
          </td>
        </tr>
      </table>`;

    const textLines = [
      `Pedido: ${order.id}`,
      `Recebimento: ${deliveryLabel}${
        order.shippingAddress ? ` — ${order.shippingAddress}` : ""
      }`,
      `Forma de pagamento: ${paymentLabel}`,
      "",
      "Itens:",
      ...items.map((item) => {
        const lineCents =
          item.lineTotalCents ?? Math.round(item.unitPrice * item.quantity * 100);
        return `- ${item.quantity}x ${item.productName}: ${formatBrl(lineCents)}`;
      }),
      ...(couponCode && couponDiscountCents > 0
        ? [`Cupom ${couponCode}: −${formatBrl(couponDiscountCents)}`]
        : []),
      ...(pixDiscountCents > 0
        ? [`Desconto PIX: −${formatBrl(pixDiscountCents)}`]
        : []),
      `${shippingLabelText}: ${
        shippingCents === 0 ? "Grátis" : formatBrl(shippingCents)
      }`,
      `Total: ${formatBrl(totalCents)}`,
    ];

    const { html, text } = renderTransactionalShell({
      title: `Pedido recebido (${order.id})`,
      greetingName: order.customerName,
      intro:
        "Recebemos seu pedido na Mariane Cosméticos! Abaixo estão os detalhes da sua compra.",
      bodyHtml,
      ctaLabel: "Acompanhar pedido",
      ctaUrl: trackingUrl,
      secondaryCtaLabel:
        paymentUrl && paymentUrl !== trackingUrl
          ? "Acessar link de pagamento"
          : paymentUrl
          ? "Ver opções de pagamento"
          : undefined,
      secondaryCtaUrl: paymentUrl || undefined,
      textLines,
    });

    const res = await sendEmail({
      to: order.customerEmail,
      subject: `Pedido recebido: ${order.id} — Mariane Cosméticos`,
      html,
      text,
    });

    if (!res.success) {
      console.error(
        `[order-email] Falha ao enviar confirmação de pedido ${order.id} para ${maskPiiEmail(
          order.customerEmail
        )}: ${res.error || "erro no provedor"}`
      );
    }
  } catch (err) {
    console.error(
      `[order-email] Exceção ao notificar pedido ${orderId}:`,
      err instanceof Error ? err.message : "erro desconhecido"
    );
  }
}

export async function sendPaymentConfirmedEmail(orderId: string): Promise<void> {
  try {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (rows.length === 0) return;

    const order = rows[0];
    if (!order.customerEmail || !order.publicToken) return;

    const totalCents =
      order.totalCents != null
        ? order.totalCents
        : Math.round(order.total * 100);
    const trackingUrl = `${SITE_URL}/pedido/${order.publicToken}`;

    const bodyHtml = `
      <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#065F46;">
          Pagamento confirmado!
        </p>
        <p style="margin:0 0 4px;font-size:13px;color:#064E3B;">
          <strong>Pedido:</strong> ${escapeHtml(order.id)}
        </p>
        <p style="margin:0;font-size:13px;color:#064E3B;">
          <strong>Valor confirmado:</strong> ${escapeHtml(formatBrl(totalCents))}
        </p>
      </div>`;

    const { html, text } = renderTransactionalShell({
      title: `Pagamento confirmado — ${order.id}`,
      greetingName: order.customerName,
      intro:
        "Confirmamos o pagamento do seu pedido. Nossa equipe já vai preparar os seus produtos com todo cuidado.",
      bodyHtml,
      ctaLabel: "Acompanhar pedido",
      ctaUrl: trackingUrl,
      textLines: [
        `Pedido: ${order.id}`,
        `Valor confirmado: ${formatBrl(totalCents)}`,
        `Status atual: ${ORDER_STATUS_LABELS.pago}`,
      ],
    });

    const res = await sendEmail({
      to: order.customerEmail,
      subject: `Pagamento confirmado: ${order.id} — Mariane Cosméticos`,
      html,
      text,
    });

    if (!res.success) {
      console.error(
        `[order-email] Falha ao enviar confirmação de pagamento ${order.id} para ${maskPiiEmail(
          order.customerEmail
        )}: ${res.error || "erro no provedor"}`
      );
    }
  } catch (err) {
    console.error(
      `[order-email] Exceção ao notificar pagamento do pedido ${orderId}:`,
      err instanceof Error ? err.message : "erro desconhecido"
    );
  }
}

export async function sendOrderStatusChangedEmail(params: {
  orderId: string;
  newStatus: OrderStatus;
}): Promise<void> {
  if (!NOTIFIED_ADMIN_STATUSES.has(params.newStatus)) {
    return;
  }

  try {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, params.orderId))
      .limit(1);
    if (rows.length === 0) return;

    const order = rows[0];
    if (!order.customerEmail || !order.publicToken) return;

    const statusLabel = ORDER_STATUS_LABELS[params.newStatus];
    const statusDescription =
      STATUS_DESCRIPTIONS[params.newStatus] ||
      `O status do seu pedido foi atualizado para: ${statusLabel}.`;
    const trackingUrl = `${SITE_URL}/pedido/${order.publicToken}`;

    const bodyHtml = `
      <div style="background:#FAF5FB;border:1px solid #D9B8DE;border-radius:12px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 6px;font-size:13px;color:#4D0046;">
          <strong>Pedido:</strong> ${escapeHtml(order.id)}
        </p>
        <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#75066A;">
          Status: ${escapeHtml(statusLabel)}
        </p>
        <p style="margin:0;font-size:13px;line-height:1.5;color:#2D182B;">
          ${escapeHtml(statusDescription)}
        </p>
      </div>`;

    const { html, text } = renderTransactionalShell({
      title: `Atualização do pedido ${order.id}`,
      greetingName: order.customerName,
      intro: `Temos uma atualização sobre o seu pedido na ${STORE_CONFIG.name}:`,
      bodyHtml,
      ctaLabel: "Acompanhar pedido",
      ctaUrl: trackingUrl,
      textLines: [
        `Pedido: ${order.id}`,
        `Novo status: ${statusLabel}`,
        statusDescription,
      ],
    });

    const res = await sendEmail({
      to: order.customerEmail,
      subject: `Atualização do pedido ${order.id}: ${statusLabel} — Mariane Cosméticos`,
      html,
      text,
    });

    if (!res.success) {
      console.error(
        `[order-email] Falha ao enviar status '${params.newStatus}' do pedido ${order.id} para ${maskPiiEmail(
          order.customerEmail
        )}: ${res.error || "erro no provedor"}`
      );
    }
  } catch (err) {
    console.error(
      `[order-email] Exceção ao notificar status do pedido ${params.orderId}:`,
      err instanceof Error ? err.message : "erro desconhecido"
    );
  }
}

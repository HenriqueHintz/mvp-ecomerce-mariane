import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByPublicToken } from "@/lib/orders";
import {
  createSandboxPayment,
  syncOrderPaymentStatusFromProvider,
  isValidPublicToken,
} from "@/lib/payments";
import { formatBrl, toCents } from "@/lib/pricing";
import {
  STORE_CONFIG,
  buildOrderWhatsAppMessage,
  buildWhatsAppLink,
} from "@/config/store";
import { OrderStatusTimeline } from "./components/OrderStatusTimeline";
import { OrderNextSteps } from "./components/OrderNextSteps";
import { PixPaymentAction } from "./components/PixPaymentAction";
import { CardPaymentAction } from "./components/CardPaymentAction";
import { OrderSummaryCard } from "./components/OrderSummaryCard";
import { MessageCircle, ArrowLeft, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const order = isValidPublicToken(token) ? await getOrderByPublicToken(token) : null;
  return {
    title: order
      ? `Pedido ${order.id} | ${STORE_CONFIG.name}`
      : `Acompanhamento de Pedido | ${STORE_CONFIG.name}`,
    description: `Acompanhe o status do seu pedido na ${STORE_CONFIG.name}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!isValidPublicToken(token)) {
    notFound();
  }
  let order = await getOrderByPublicToken(token, { skipLazyExpiration: true });

  if (!order) {
    notFound();
  }

  // Quando o pedido está aguardando pagamento, sincronizar ativamente com o provedor Asaas antes de avaliar expiração
  if (
    order.status === "aguardando_pagamento" ||
    order.status === "aguardando_confirmacao" ||
    order.status === "aguardando pagamento"
  ) {
    await syncOrderPaymentStatusFromProvider(order.id);
    const refreshed = await getOrderByPublicToken(token);
    if (refreshed) {
      order = refreshed;
    }
  }

  const totalCents =
    order.totalCents != null ? order.totalCents : toCents(order.total);
  const subtotalCents =
    order.subtotalCents != null ? order.subtotalCents : totalCents;
  const discountCents = order.discountCents ?? 0;
  const shippingCents = order.shippingCents ?? 0;
  const deliveryMode = (
    order.deliveryMode === "retirada" ? "retirada" : "entrega"
  ) as "entrega" | "retirada";
  const paymentMethod = (
    order.paymentMethod === "pix" || order.paymentMethod === "cartao"
      ? order.paymentMethod
      : "whatsapp"
  ) as "whatsapp" | "pix" | "cartao";

  // Mensagem do WhatsApp gerada por uma única função a partir de src/config/store.ts, sem dados fixos no código
  const whatsappMessage = buildOrderWhatsAppMessage({
    humanCode: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryMode,
    shippingAddress:
      order.shippingAddress || STORE_CONFIG.physicalStore.formattedAddress,
    paymentMethod,
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents,
    items: order.items.map((i) => {
      const unitPriceCents =
        i.unitPriceCents != null ? i.unitPriceCents : toCents(i.unitPrice);
      const lineTotalCents =
        i.lineTotalCents != null
          ? i.lineTotalCents
          : unitPriceCents * i.quantity;
      return {
        name: i.productName,
        quantity: i.quantity,
        unitPriceCents,
        lineTotalCents,
      };
    }),
    notes: order.notes,
    publicToken: order.publicToken || token,
  });

  const whatsappUrl = buildWhatsAppLink(whatsappMessage);

  const isPendingPayment =
    order.status === "aguardando_pagamento" ||
    order.status === "aguardando_confirmacao" ||
    order.status === "aguardando pagamento";

  // Obter dados de cobrança Asaas Sandbox (PIX QR Code/Copia-e-Cola com prazo ou Checkout Hospedado de Cartão com returnUrl validada)
  const paymentDetails =
    isPendingPayment && (paymentMethod === "pix" || paymentMethod === "cartao")
      ? await createSandboxPayment(
          {
            orderId: order.id,
            paymentMethod: paymentMethod === "cartao" ? "card" : "pix",
            returnUrl: `/pedido/${order.publicToken || token}`,
          },
          { forceSandboxMock: process.env.NODE_ENV !== "production" }
        )
      : null;

  return (
    <main className="min-h-screen bg-luxury-offwhite py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Topo de Navegação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-silk-200">
          <div>
            <Link
              href="/produtos"
              className="inline-flex items-center text-xs font-semibold text-onyx-600 hover:text-brand transition-colors mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
            >
              <ArrowLeft aria-hidden="true" className="w-4 h-4 mr-1.5" />
              Voltar para a Vitrine
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-onyx-950">
              Acompanhamento do Pedido
            </h1>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-onyx-700 bg-white px-3.5 py-2 rounded-xl border border-silk-200">
            <ShieldCheck aria-hidden="true" className="w-4 h-4 text-brand" />
            <span>Acesso protegido por Token Público de 128 bits</span>
          </div>
        </div>

        {/* Linha do Tempo Visual do Status */}
        <OrderStatusTimeline
          currentStatus={order.status || "aguardando_confirmacao"}
          deliveryMode={deliveryMode}
        />

        {/* Próximos Passos por Status */}
        <OrderNextSteps
          status={order.status || "aguardando_confirmacao"}
          deliveryMode={deliveryMode}
          paymentMethod={paymentMethod}
        />

        {/* Área de Ação PIX (quando ativo e pendente) */}
        {paymentMethod === "pix" &&
          isPendingPayment &&
          paymentDetails?.success &&
          paymentDetails.pixCopyPaste && (
            <PixPaymentAction
              orderId={order.id}
              totalFormatted={formatBrl(totalCents)}
              pixCopyPaste={paymentDetails.pixCopyPaste}
              expiresAt={paymentDetails.pixExpiresAt || order.expiresAt}
            />
          )}

        {/* Área de Ação Cartão (quando ativo e pendente — redireciona para checkout hospedado Asaas e volta para /pedido/[token]) */}
        {paymentMethod === "cartao" &&
          isPendingPayment &&
          paymentDetails?.success && (
            <CardPaymentAction
              orderId={order.id}
              totalFormatted={formatBrl(totalCents)}
              checkoutUrl={paymentDetails.checkoutUrl ?? null}
              returnUrl={paymentDetails.returnUrl ?? null}
              expiresAt={order.expiresAt}
            />
          )}

        {/* CTA Oficial: Falar com a loja no WhatsApp */}
        <div className="bg-white rounded-3xl border border-silk-200 p-6 shadow-luxury-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-serif text-base font-bold text-onyx-950">
              Atendimento Direto — {STORE_CONFIG.name}
            </h2>
            <p className="text-xs text-onyx-600">
              Envie o resumo deste pedido para nosso atendimento oficial (
              {STORE_CONFIG.phone.international}) para tirar dúvidas ou confirmar detalhes.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-whatsapp hover:opacity-95 text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md flex-shrink-0 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-dark"
          >
            <MessageCircle aria-hidden="true" className="w-4 h-4" />
            <span>Falar com a loja no WhatsApp</span>
          </a>
        </div>

        {/* Card de Resumo Completo (Itens, Totais, Entrega ou Retirada) */}
        <OrderSummaryCard
          humanCode={order.id}
          customerName={order.customerName}
          customerPhone={order.customerPhone}
          deliveryMode={deliveryMode}
          shippingAddress={
            order.shippingAddress || STORE_CONFIG.physicalStore.formattedAddress
          }
          paymentMethod={paymentMethod}
          subtotalCents={subtotalCents}
          discountCents={discountCents}
          shippingCents={shippingCents}
          totalCents={totalCents}
          items={order.items}
        />
      </div>
    </main>
  );
}

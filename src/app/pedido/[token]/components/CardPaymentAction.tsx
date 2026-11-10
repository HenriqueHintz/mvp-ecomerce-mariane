import React from "react";
import { CreditCard, ExternalLink, Lock, Clock } from "lucide-react";
import { validateAsaasCheckoutUrl } from "@/lib/payment-urls";

interface CardPaymentActionProps {
  orderId: string;
  totalFormatted: string;
  checkoutUrl: string | null;
  returnUrl: string | null;
  expiresAt?: string | null;
}

export function CardPaymentAction({
  orderId,
  totalFormatted,
  checkoutUrl,
  returnUrl,
  expiresAt,
}: CardPaymentActionProps) {
  const safeCheckoutUrl = checkoutUrl
    ? validateAsaasCheckoutUrl(checkoutUrl)
    : null;

  return (
    <section
      aria-labelledby="card-payment-heading"
      className="bg-white rounded-3xl border border-silk-200 p-6 shadow-luxury-card space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-silk-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            aria-hidden="true"
            className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand"
          >
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="card-payment-heading"
              className="font-serif font-bold text-onyx-950 text-base"
            >
              Pagamento via Cartão de Crédito (Checkout Hospedado Asaas)
            </h3>
            <p className="text-xs text-onyx-600 tabular-nums">
              Pedido <span className="font-mono font-semibold">{orderId}</span> &bull; Valor:{" "}
              <strong className="text-brand">{totalFormatted}</strong> (em até 10x sem juros)
            </p>
          </div>
        </div>
        {expiresAt && (
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <Clock aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Reserva válida por 24h</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-onyx-700 leading-relaxed">
          Para sua segurança, os dados do cartão são digitados exclusivamente no ambiente criptografado do{" "}
          <strong>Asaas</strong>. Após a aprovação, você retornará automaticamente para esta página de acompanhamento.
        </p>

        {safeCheckoutUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <a
              href={safeCheckoutUrl}
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-luxury focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <Lock aria-hidden="true" className="w-4 h-4" />
              <span>Pagar com Cartão no Ambiente Seguro Asaas</span>
              <ExternalLink aria-hidden="true" className="w-3.5 h-3.5" />
            </a>
            {returnUrl && (
              <span className="text-[11px] text-onyx-500">
                Retorno seguro verificado para seu pedido
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-onyx-600 bg-silk-50 p-3.5 rounded-xl border border-silk-200">
            Solicite o link de pagamento em cartão diretamente pelo botão &ldquo;Falar com a loja no WhatsApp&rdquo; abaixo.
          </p>
        )}
      </div>
    </section>
  );
}

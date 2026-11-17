"use client";

import React from "react";
import { COMMERCE_CONFIG } from "@/config/commerce";
import { formatBrl, OrderPricingSummary } from "@/lib/pricing";
import Button from "@/components/ui/Button";
import {
  MessageCircle,
  QrCode,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useCheckoutContext } from "../CheckoutContext";

interface CheckoutPaymentProps {
  paymentMethod?: "whatsapp" | "pix" | "cartao";
  setPaymentMethod?: (m: "whatsapp" | "pix" | "cartao") => void;
  onPaymentChange?: () => void;
  quote?: OrderPricingSummary | null;
  loadingQuote?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}

export function CheckoutPayment(props: CheckoutPaymentProps) {
  const ctx = useCheckoutContext();
  const paymentMethod =
    props.paymentMethod ?? ctx?.state.paymentMethod ?? "whatsapp";
  const setPaymentMethod =
    props.setPaymentMethod ?? ctx?.actions.setPaymentMethod ?? (() => {});
  const onPaymentChange = props.onPaymentChange;
  const quote = props.quote ?? ctx?.meta.quote ?? null;
  const loadingQuote = props.loadingQuote ?? ctx?.meta.loadingQuote ?? false;

  const { pixAsaas, cardAsaas, whatsapp } = COMMERCE_CONFIG.PAYMENT_FEATURES;

  const handleSelect = (method: "whatsapp" | "pix" | "cartao") => {
    setPaymentMethod(method);
    onPaymentChange?.();
  };

  const totalCents = quote?.totalCents ?? 0;
  const installmentValueCents =
    totalCents > 0 ? Math.round(totalCents / COMMERCE_CONFIG.MAX_INSTALLMENTS) : 0;

  return (
    <section
      aria-labelledby="checkout-step-payment"
      className="bg-white rounded-2xl border border-silk-200 p-5 sm:p-6 shadow-luxury-card space-y-5 motion-safe:transition-opacity motion-reduce:transition-none"
    >
      <div className="flex items-center space-x-3 pb-3 border-b border-silk-100">
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-brand-light text-marina-700 flex items-center justify-center font-bold text-sm tabular-nums shrink-0"
        >
          4
        </div>
        <div>
          <h2
            id="checkout-step-payment"
            ref={props.headingRef}
            tabIndex={-1}
            className="text-lg font-serif font-bold text-onyx-950 focus:outline-none"
          >
            Forma de Pagamento
          </h2>
          <p className="text-xs text-onyx-600">
            Selecione como prefere concluir o pagamento do seu pedido.
          </p>
        </div>
      </div>

      {/* Resumo rápido de benefícios e total recalculado */}
      {quote && (
        <div className="rounded-xl bg-marina-50/60 border border-marina-200/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
          <span className="text-onyx-800">
            Total recalculado:{" "}
            <strong className="text-base text-marina-800 ml-1">
              {loadingQuote ? (
                <Loader2 className="w-4 h-4 animate-spin inline" aria-label="Calculando total" />
              ) : (
                formatBrl(totalCents)
              )}
            </strong>
          </span>
          <span className="text-onyx-600 font-medium">
            5% OFF no PIX &bull; Até {COMMERCE_CONFIG.MAX_INSTALLMENTS}x de{" "}
            {formatBrl(installmentValueCents)} sem juros
          </span>
        </div>
      )}

      <div
        role="radiogroup"
        aria-label="Forma de pagamento"
        className="space-y-3"
      >
        {whatsapp && (
          <button
            type="button"
            role="radio"
            aria-checked={paymentMethod === "whatsapp"}
            onClick={() => handleSelect("whatsapp")}
            className={`w-full p-4 min-h-[44px] rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2 ${
              paymentMethod === "whatsapp"
                ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/15"
                : "border-silk-200 hover:border-silk-300 bg-white"
            }`}
          >
            <div
              aria-hidden="true"
              className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                paymentMethod === "whatsapp"
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-silk-300 bg-white"
              }`}
            >
              {paymentMethod === "whatsapp" && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-onyx-900 flex items-center">
                  <MessageCircle
                    aria-hidden="true"
                    className="w-4 h-4 mr-1.5 text-emerald-700"
                  />
                  Atendimento e Pagamento via WhatsApp
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                  Recomendado
                </span>
              </div>
              <p className="text-xs text-onyx-600 mt-1 leading-relaxed">
                Envie seu pedido direto para nosso WhatsApp oficial e pague via PIX (5% OFF) ou cartão em até 10x sem juros com atendimento consultivo.
              </p>
            </div>
          </button>
        )}

        {pixAsaas && (
          <button
            type="button"
            role="radio"
            aria-checked={paymentMethod === "pix"}
            onClick={() => handleSelect("pix")}
            className={`w-full p-4 min-h-[44px] rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2 ${
              paymentMethod === "pix"
                ? "border-marina-600 bg-brand-light/40 ring-2 ring-marina-600/15"
                : "border-silk-200 hover:border-silk-300 bg-white"
            }`}
          >
            <div
              aria-hidden="true"
              className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                paymentMethod === "pix"
                  ? "border-marina-700 bg-marina-700 text-white"
                  : "border-silk-300 bg-white"
              }`}
            >
              {paymentMethod === "pix" && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-onyx-900 flex items-center">
                  <QrCode aria-hidden="true" className="w-4 h-4 mr-1.5 text-marina-700" />
                  PIX Instantâneo
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-light text-marina-800 shrink-0">
                  5% OFF
                </span>
              </div>
              <p className="text-xs text-onyx-600 mt-1 leading-relaxed">
                Geração automática de QR Code e código Copia e Cola. Aprovação imediata.
              </p>
            </div>
          </button>
        )}

        {cardAsaas && (
          <button
            type="button"
            role="radio"
            aria-checked={paymentMethod === "cartao"}
            onClick={() => handleSelect("cartao")}
            className={`w-full p-4 min-h-[44px] rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2 ${
              paymentMethod === "cartao"
                ? "border-marina-600 bg-brand-light/40 ring-2 ring-marina-600/15"
                : "border-silk-200 hover:border-silk-300 bg-white"
            }`}
          >
            <div
              aria-hidden="true"
              className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                paymentMethod === "cartao"
                  ? "border-marina-700 bg-marina-700 text-white"
                  : "border-silk-300 bg-white"
              }`}
            >
              {paymentMethod === "cartao" && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-onyx-900 flex items-center">
                  <CreditCard
                    aria-hidden="true"
                    className="w-4 h-4 mr-1.5 text-marina-700"
                  />
                  Cartão de Crédito
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-silk-100 text-onyx-800 shrink-0">
                  Até 10x Sem Juros
                </span>
              </div>
              <p className="text-xs text-onyx-600 mt-1 leading-relaxed">
                Pagamento em página criptografada protegida pelo gateway oficial Asaas.
              </p>
            </div>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2 text-xs text-onyx-600 bg-silk-50 p-3 rounded-xl border border-silk-100">
        <ShieldCheck
          aria-hidden="true"
          className="w-4 h-4 text-emerald-700 flex-shrink-0"
        />
        <span>
          Ambiente 100% protegido. Seus dados nunca são armazenados ou compartilhados.
        </span>
      </div>

      {(props.onBack || props.onNext) && (
        <div className="hidden lg:flex items-center justify-between pt-2 border-t border-silk-100">
          {props.onBack ? (
            <Button type="button" variant="ghost" size="md" onClick={props.onBack}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Voltar</span>
            </Button>
          ) : (
            <span />
          )}
          {props.onNext && (
            <Button type="button" variant="primary" size="lg" onClick={props.onNext}>
              <span>Revisar pedido</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

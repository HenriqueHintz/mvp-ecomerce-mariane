"use client";

import React from "react";
import { COMMERCE_CONFIG } from "@/config/commerce";
import { MessageCircle, QrCode, CreditCard, ShieldCheck } from "lucide-react";

interface CheckoutPaymentProps {
  paymentMethod: "whatsapp" | "pix" | "cartao";
  setPaymentMethod: (m: "whatsapp" | "pix" | "cartao") => void;
  onPaymentChange?: () => void;
}

export function CheckoutPayment({
  paymentMethod,
  setPaymentMethod,
  onPaymentChange,
}: CheckoutPaymentProps) {
  const { pixAsaas, cardAsaas, whatsapp } = COMMERCE_CONFIG.PAYMENT_FEATURES;

  const handleSelect = (method: "whatsapp" | "pix" | "cartao") => {
    setPaymentMethod(method);
    if (onPaymentChange) onPaymentChange();
  };

  return (
    <div className="bg-white rounded-2xl border border-silk-200 p-6 shadow-luxury-card space-y-5">
      <div className="flex items-center space-x-3 pb-3 border-b border-silk-100">
        <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-sm">
          3
        </div>
        <div>
          <h2 className="text-lg font-serif font-bold text-onyx-950">
            Forma de Pagamento
          </h2>
          <p className="text-xs text-onyx-600">
            Selecione como prefere concluir o pagamento do seu pedido.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Opção WhatsApp (Sempre ativa no MVP) */}
        {whatsapp && (
          <button
            type="button"
            onClick={() => handleSelect("whatsapp")}
            className={`w-full p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
              paymentMethod === "whatsapp"
                ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/10"
                : "border-silk-200 hover:border-silk-300 bg-white"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                paymentMethod === "whatsapp"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-silk-300 bg-white"
              }`}
            >
              {paymentMethod === "whatsapp" && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-onyx-900 flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Atendimento & Pagamento via WhatsApp
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Recomendado
                </span>
              </div>
              <p className="text-xs text-onyx-600 mt-1 leading-relaxed">
                Você envia o pedido pronto para o nosso WhatsApp oficial. Combinamos a melhor forma (PIX, Cartão na maquininha na entrega/retirada ou transferência) com suporte humano dedicado.
              </p>
            </div>
          </button>
        )}

        {/* Opção PIX (Apenas quando ativo via flag/ambiente) */}
        {pixAsaas && (
          <button
            type="button"
            onClick={() => handleSelect("pix")}
            className={`w-full p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
              paymentMethod === "pix"
                ? "border-brand bg-brand-light/30 ring-2 ring-brand/10"
                : "border-silk-200 hover:border-silk-300 bg-white"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                paymentMethod === "pix"
                  ? "border-brand bg-brand text-white"
                  : "border-silk-300 bg-white"
              }`}
            >
              {paymentMethod === "pix" && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-onyx-900 flex items-center">
                  <QrCode className="w-4 h-4 mr-1.5 text-brand" />
                  PIX Instantâneo
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-light text-brand">
                  5% OFF
                </span>
              </div>
              <p className="text-xs text-onyx-600 mt-1 leading-relaxed">
                Geração automática de QR Code e código Copia e Cola. Aprovação imediata em ambiente seguro Asaas.
              </p>
            </div>
          </button>
        )}

        {/* Opção Cartão de Crédito (Apenas quando ativo via flag/ambiente) */}
        {cardAsaas && (
          <button
            type="button"
            onClick={() => handleSelect("cartao")}
            className={`w-full p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
              paymentMethod === "cartao"
                ? "border-brand bg-brand-light/30 ring-2 ring-brand/10"
                : "border-silk-200 hover:border-silk-300 bg-white"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                paymentMethod === "cartao"
                  ? "border-brand bg-brand text-white"
                  : "border-silk-300 bg-white"
              }`}
            >
              {paymentMethod === "cartao" && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-onyx-900 flex items-center">
                  <CreditCard className="w-4 h-4 mr-1.5 text-brand" />
                  Cartão de Crédito
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-silk-100 text-onyx-700">
                  Até 10x Sem Juros
                </span>
              </div>
              <p className="text-xs text-onyx-600 mt-1 leading-relaxed">
                Pagamento processado em página criptografada protegida pelo gateway oficial Asaas.
              </p>
            </div>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2 text-xs text-onyx-600 bg-silk-50 p-3 rounded-xl border border-silk-100">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>
          Ambiente 100% protegido. Seus dados nunca são armazenados ou compartilhados.
        </span>
      </div>
    </div>
  );
}

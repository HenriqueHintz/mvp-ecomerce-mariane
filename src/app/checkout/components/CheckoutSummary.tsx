"use client";

import React from "react";
import Image from "next/image";
import { formatBrl } from "@/lib/pricing";
import { OrderPricingSummary } from "@/lib/pricing";
import { ShoppingBag, Loader2, Truck, QrCode, Lock, ShieldCheck } from "lucide-react";

interface CheckoutSummaryProps {
  quote: OrderPricingSummary | null;
  loadingQuote: boolean;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  deliveryMode: "entrega" | "retirada";
  paymentMethod: "whatsapp" | "pix" | "cartao";
  cartItems: Array<{
    id: string;
    name: string;
    image: string;
    quantity: number;
    price: number;
  }>;
}

export function CheckoutSummary({
  quote,
  loadingQuote,
  submitting,
  onSubmit,
  deliveryMode,
  paymentMethod,
  cartItems,
}: CheckoutSummaryProps) {
  const subtotalCents = quote?.subtotalCents || 0;
  const shippingCents = quote?.shippingCents || 0;
  const discountCents = quote?.discountCents || 0;
  const totalCents = quote?.totalCents || 0;

  const installmentsCount = 10;
  const installmentValueCents = totalCents > 0 ? Math.round(totalCents / installmentsCount) : 0;

  return (
    <div className="bg-white rounded-2xl border border-silk-200 p-6 shadow-luxury-card space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-silk-100">
        <h2 className="text-lg font-serif font-bold text-onyx-950 flex items-center">
          <ShoppingBag className="w-5 h-5 mr-2 text-brand" />
          Resumo do Pedido
        </h2>
        <span className="text-xs font-semibold text-onyx-600 bg-silk-100 px-2.5 py-1 rounded-full">
          {cartItems.reduce((acc, i) => acc + i.quantity, 0)} {cartItems.length === 1 ? "item" : "itens"}
        </span>
      </div>

      {/* Lista de Itens na Sacola */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center space-x-3 text-xs">
            <div className="w-12 h-12 rounded-lg bg-silk-50 border border-silk-200 relative overflow-hidden flex-shrink-0">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-onyx-400">
                  Foto
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-onyx-900 truncate">{item.name}</p>
              <p className="text-onyx-500 mt-0.5">Qtd: {item.quantity} un.</p>
            </div>
          </div>
        ))}
      </div>

      {/* Valores Oficiais da Cotação */}
      <div className="border-t border-silk-100 pt-4 space-y-2.5 text-xs">
        <div className="flex justify-between text-onyx-700">
          <span>Subtotal</span>
          <span className="font-medium text-onyx-900">
            {loadingQuote ? "Calculando..." : formatBrl(subtotalCents)}
          </span>
        </div>

        {discountCents > 0 && (
          <div className="flex justify-between text-brand font-medium">
            <span className="flex items-center">
              <QrCode className="w-3.5 h-3.5 mr-1" />
              Desconto PIX (5% OFF)
            </span>
            <span>- {formatBrl(discountCents)}</span>
          </div>
        )}

        <div className="flex justify-between text-onyx-700">
          <span className="flex items-center">
            <Truck className="w-3.5 h-3.5 mr-1 text-onyx-500" />
            Frete
          </span>
          <span className="font-medium">
            {loadingQuote ? (
              "Calculando..."
            ) : shippingCents === 0 ? (
              <span className="text-emerald-700 font-bold uppercase text-[11px]">
                {deliveryMode === "retirada" ? "Grátis (Retirada)" : "Grátis 🎉"}
              </span>
            ) : (
              formatBrl(shippingCents)
            )}
          </span>
        </div>

        {/* Total Final */}
        <div className="border-t border-silk-100 pt-3 flex justify-between items-baseline">
          <span className="text-sm font-bold text-onyx-950 font-serif">Total a Pagar</span>
          <div className="text-right">
            <span className="text-xl font-bold text-brand">
              {loadingQuote ? (
                <Loader2 className="w-5 h-5 animate-spin inline-block" />
              ) : (
                formatBrl(totalCents)
              )}
            </span>
            {totalCents > 0 && (
              <p className="text-[11px] text-onyx-500 mt-0.5">
                ou até {installmentsCount}x de {formatBrl(installmentValueCents)} sem juros
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botão de Finalização */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || loadingQuote || cartItems.length === 0}
        className="w-full py-3.5 px-6 rounded-xl bg-brand hover:bg-brand-dark active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-luxury transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processando Pedido...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Concluir Pedido com Segurança</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center space-x-1.5 text-[11px] text-onyx-500 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Garantia de atendimento e sigilo Mariane Cosméticos</span>
      </div>
    </div>
  );
}

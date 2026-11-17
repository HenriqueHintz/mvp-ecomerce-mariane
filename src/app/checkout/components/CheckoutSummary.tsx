"use client";

import React, { useState, useEffect, useId } from "react";
import Image from "next/image";
import { formatBrl, OrderPricingSummary } from "@/lib/pricing";
import {
  ShoppingBag,
  Loader2,
  Truck,
  QrCode,
  Lock,
  ShieldCheck,
  Tag,
} from "lucide-react";

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
  showSubmitButton?: boolean;
  canSubmit?: boolean;
  couponCode?: string | null;
  applyingCoupon?: boolean;
  couponError?: string | null;
  onApplyCoupon?: (code: string) => void | Promise<void>;
  onRemoveCoupon?: () => void;
}

export function CheckoutSummary({
  quote,
  loadingQuote,
  submitting,
  onSubmit,
  deliveryMode,
  cartItems,
  showSubmitButton = true,
  canSubmit = true,
  couponCode = null,
  applyingCoupon = false,
  couponError = null,
  onApplyCoupon,
  onRemoveCoupon,
}: CheckoutSummaryProps) {
  const couponInputId = useId();
  const effectiveCouponError = couponError ?? quote?.couponError ?? null;
  const appliedCouponCode = !effectiveCouponError
    ? quote?.couponCode || couponCode || null
    : null;

  const [isCouponOpen, setIsCouponOpen] = useState(
    Boolean(effectiveCouponError)
  );
  const [couponInput, setCouponInput] = useState("");

  useEffect(() => {
    if (effectiveCouponError) {
      setIsCouponOpen(true);
    }
  }, [effectiveCouponError]);

  const subtotalCents = quote?.subtotalCents ?? 0;
  const shippingCents = quote ? quote.shippingCents : null;
  const couponDiscountCents = quote?.couponDiscountCents ?? 0;
  const pixDiscountCents = quote?.pixDiscountCents ?? 0;
  const totalCents = quote?.totalCents ?? 0;

  const installmentsCount = 10;
  const installmentValueCents =
    totalCents > 0 ? Math.round(totalCents / installmentsCount) : 0;

  const totalItemUnits = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const handleTriggerApply = () => {
    const trimmed = couponInput.trim();
    if (!trimmed || applyingCoupon) return;
    void onApplyCoupon?.(trimmed);
  };

  return (
    <aside
      aria-label="Resumo financeiro do pedido"
      className="bg-white rounded-2xl border border-silk-200 p-6 shadow-luxury-card space-y-6"
    >
      <div className="flex items-center justify-between pb-3 border-b border-silk-100">
        <h2 className="text-lg font-serif font-bold text-onyx-950 flex items-center">
          <ShoppingBag aria-hidden="true" className="w-5 h-5 mr-2 text-brand" />
          Resumo do Pedido
        </h2>
        <span className="text-xs font-semibold text-onyx-600 bg-silk-100 px-2.5 py-1 rounded-full tabular-nums">
          {totalItemUnits} {totalItemUnits === 1 ? "item" : "itens"}
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
              <p className="text-onyx-600 mt-0.5 tabular-nums">
                Qtd: {item.quantity} un.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bloco de Cupom de Desconto */}
      <div className="border-t border-silk-100 pt-3">
        {appliedCouponCode ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-onyx-600">Cupom aplicado</span>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-marina-50 text-marina-800 border border-marina-200 text-xs font-semibold">
              <Tag aria-hidden="true" className="w-3.5 h-3.5 text-marina-700 shrink-0" />
              <span>{appliedCouponCode}</span>
              <button
                type="button"
                aria-label="Remover cupom"
                onClick={() => onRemoveCoupon?.()}
                className="ml-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-marina-200/70 text-marina-800 font-bold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              aria-expanded={isCouponOpen}
              onClick={() => setIsCouponOpen((prev) => !prev)}
              className="text-xs font-semibold text-marina-700 hover:text-marina-900 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded cursor-pointer"
            >
              Tem um cupom?
            </button>

            {isCouponOpen && (
              <div className="space-y-1.5 pt-1">
                <label
                  htmlFor={couponInputId}
                  className="block text-xs font-semibold text-onyx-800"
                >
                  Cupom de desconto
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={couponInputId}
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleTriggerApply();
                      }
                    }}
                    autoComplete="off"
                    enterKeyHint="done"
                    maxLength={30}
                    placeholder="EX: BEMVINDA10"
                    className="h-11 flex-1 min-w-0 px-3.5 rounded-xl border border-silk-200 hover:border-silk-300 focus-visible:border-marina-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 text-xs font-semibold uppercase tracking-wider text-onyx-900"
                  />
                  <button
                    type="button"
                    disabled={applyingCoupon || !couponInput.trim()}
                    onClick={handleTriggerApply}
                    className="h-11 w-auto shrink-0 px-4 rounded-xl bg-marina-600 hover:bg-marina-700 text-white font-semibold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {applyingCoupon ? "Aplicando…" : "Aplicar"}
                  </button>
                </div>
                {effectiveCouponError && (
                  <p
                    role="alert"
                    className="text-xs text-brand-accent font-medium"
                  >
                    {effectiveCouponError}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Valores Oficiais da Cotação (ordem estrita: Subtotal -> Desconto do cupom -> Desconto PIX -> Frete -> Total a pagar) */}
      <div className="border-t border-silk-100 pt-4 space-y-2.5 text-xs tabular-nums">
        {/* 1. Subtotal */}
        <div className="flex justify-between text-onyx-700">
          <span>Subtotal</span>
          <span className="font-medium text-onyx-900">
            {loadingQuote ? "Calculando..." : formatBrl(subtotalCents)}
          </span>
        </div>

        {/* 2. Desconto do cupom */}
        {couponDiscountCents > 0 && (
          <div className="flex justify-between text-emerald-whatsapp font-medium">
            <span className="flex items-center">
              <Tag aria-hidden="true" className="w-3.5 h-3.5 mr-1" />
              Desconto do cupom
            </span>
            <span>−{formatBrl(couponDiscountCents)}</span>
          </div>
        )}

        {/* 3. Desconto PIX */}
        {pixDiscountCents > 0 && (
          <div className="flex justify-between text-brand font-medium">
            <span className="flex items-center">
              <QrCode aria-hidden="true" className="w-3.5 h-3.5 mr-1" />
              Desconto PIX (5% OFF)
            </span>
            <span>−{formatBrl(pixDiscountCents)}</span>
          </div>
        )}

        {/* 4. Frete */}
        <div className="flex justify-between text-onyx-700">
          <span className="flex items-center">
            <Truck aria-hidden="true" className="w-3.5 h-3.5 mr-1 text-onyx-600" />
            Frete
          </span>
          <span className="font-medium">
            {loadingQuote ? (
              "Calculando..."
            ) : shippingCents === null || shippingCents === undefined ? (
              <span className="text-onyx-600">Calcular pelo CEP</span>
            ) : shippingCents === 0 ? (
              <span className="text-emerald-whatsapp font-bold">
                {deliveryMode === "retirada" ? "Grátis (Retirada)" : "Grátis"}
              </span>
            ) : (
              formatBrl(shippingCents)
            )}
          </span>
        </div>

        {/* 5. Total a pagar */}
        <div className="border-t border-silk-100 pt-3 flex justify-between items-baseline">
          <span className="text-sm font-bold text-onyx-950 font-serif">
            Total a pagar
          </span>
          <div className="text-right">
            <span className="text-xl font-bold text-brand tabular-nums">
              {loadingQuote ? (
                <Loader2
                  aria-label="Calculando total"
                  className="w-5 h-5 animate-spin inline-block"
                />
              ) : (
                formatBrl(totalCents)
              )}
            </span>
            {totalCents > 0 && (
              <p className="text-[11px] text-onyx-600 mt-0.5 tabular-nums">
                ou até {installmentsCount}x de {formatBrl(installmentValueCents)} sem juros
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botão de Finalização */}
      {showSubmitButton && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || submitting || loadingQuote || cartItems.length === 0}
          className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-brand hover:bg-brand-dark active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-luxury transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {submitting ? (
            <>
              <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
              <span>Processando Pedido...</span>
            </>
          ) : (
            <>
              <Lock aria-hidden="true" className="w-4 h-4" />
              <span>Confirmar pedido</span>
            </>
          )}
        </button>
      )}

      <div className="flex items-center justify-center space-x-1.5 text-[11px] text-onyx-600 pt-1">
        <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5 text-emerald-whatsapp" />
        <span>Garantia de atendimento e sigilo Mariane Cosméticos</span>
      </div>
    </aside>
  );
}

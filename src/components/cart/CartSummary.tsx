"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import { COMMERCE_CONFIG } from "@/config/commerce";
import { formatBRL, toReais } from "@/lib/pricing";

export interface CartSummaryProps {
  subtotalCents: number;
  pixTotalCents: number;
  totalItems: number;
  remainingForFreeShippingCents: number;
  whatsappHref: string;
  onCheckoutClick?: () => void;
  showFullCartLink?: boolean;
  onFullCartClick?: () => void;
  showEstimatedShipping?: boolean;
}

export default function CartSummary({
  subtotalCents,
  pixTotalCents,
  totalItems,
  remainingForFreeShippingCents,
  whatsappHref,
  onCheckoutClick,
  showFullCartLink = false,
  onFullCartClick,
  showEstimatedShipping = false,
}: CartSummaryProps) {
  const installmentCents = Math.round(subtotalCents / 10);
  const freeShipping = remainingForFreeShippingCents <= 0;

  return (
    <div className="space-y-3.5">
      <div className="space-y-2 text-xs sm:text-[13px]">
        <div className="flex items-center justify-between gap-2 text-onyx-800">
          <span>
            Subtotal ({totalItems} {totalItems === 1 ? "item" : "itens"})
          </span>
          <span className="font-bold text-onyx-950 text-sm sm:text-[15px] tabular-nums">
            {formatBRL(toReais(subtotalCents))}
          </span>
        </div>

        {showEstimatedShipping && (
          <div className="flex items-center justify-between gap-2 text-onyx-700">
            <span>Frete</span>
            <span className="font-semibold text-emerald-800 text-right [word-spacing:0.04em]">
              {freeShipping ? "Grátis (ou retirada em Lages)" : "A calcular no checkout"}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-emerald-800 font-semibold">
          <span>No PIX ({COMMERCE_CONFIG.DEFAULT_PIX_DISCOUNT_PERCENT}% OFF)</span>
          <span className="font-bold text-sm sm:text-[15px] tabular-nums">
            {formatBRL(toReais(pixTotalCents))}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-onyx-700 text-xs">
          <span>Parcelamento</span>
          <span className="tabular-nums [word-spacing:0.04em]">
            Até 10x de {formatBRL(toReais(installmentCents))} sem juros
          </span>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        <Link
          href="/checkout"
          onClick={onCheckoutClick}
          className="w-full min-h-[44px] bg-marina-600 hover:bg-marina-700 text-white font-semibold py-3 px-5 rounded-xl flex items-center justify-center gap-2 text-sm tracking-normal [word-spacing:0.05em] transition-colors shadow-marina-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2"
        >
          <span>Finalizar compra</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </Link>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 px-5 rounded-xl flex items-center justify-center gap-2 text-sm tracking-normal [word-spacing:0.05em] transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        >
          <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Pedir pelo WhatsApp</span>
        </a>

        {showFullCartLink && (
          <Link
            href="/carrinho"
            onClick={onFullCartClick}
            className="block w-full text-center text-xs sm:text-[13px] font-semibold text-marina-700 hover:text-marina-900 py-2 rounded-lg [word-spacing:0.05em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
          >
            Ver sacola completa
          </Link>
        )}

        {showEstimatedShipping && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-onyx-700 pt-1 [word-spacing:0.04em]">
            <ShieldCheck className="w-4 h-4 text-marina-700 shrink-0" aria-hidden="true" />
            <span>Loja Física: Rua Blumenau, Nº 623, Lages – SC</span>
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, Trash2, X } from "lucide-react";
import {
  useCartActions,
  useCartState,
  useCartUI,
} from "@/context/CartContext";
import { formatBRL, toReais } from "@/lib/pricing";
import FreeShippingBar from "@/components/cart/FreeShippingBar";
import CartLineItem from "@/components/cart/CartLineItem";
import CartSummary from "@/components/cart/CartSummary";
import CartEmptyState from "@/components/cart/CartEmptyState";

export default function CartPage() {
  const {
    items,
    subtotalCents,
    pixTotalCents,
    totalItems,
    freeShippingProgress,
    remainingForFreeShippingCents,
    lastRemovedItem,
  } = useCartState();
  const { announcement } = useCartUI();
  const {
    removeItem,
    undoRemove,
    dismissUndo,
    updateQuantity,
    clearCart,
    generateWhatsAppLink,
  } = useCartActions();

  if (items.length === 0) {
    return (
      <div className="bg-luxury-offwhite min-h-[60vh]">
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
        {lastRemovedItem && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div
              role="status"
              className="px-4 py-3 rounded-2xl bg-onyx-950 text-white text-xs sm:text-sm flex items-center justify-between gap-3 shadow-md animate-scaleIn motion-reduce:animate-none"
            >
              <span className="truncate">
                Removido: <strong>{lastRemovedItem.name}</strong>
              </span>
              <button
                type="button"
                onClick={undoRemove}
                className="inline-flex items-center gap-1.5 text-marina-200 hover:text-white font-bold underline underline-offset-2 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Desfazer</span>
              </button>
            </div>
          </div>
        )}
        <CartEmptyState variant="page" />
      </div>
    );
  }

  const whatsappHref = generateWhatsAppLink();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-28 lg:pb-12 space-y-6 sm:space-y-8">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-silk-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-marina-700 block mb-1">
            Sacola de Compras
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-onyx-950 tracking-tight">
            Meu Carrinho
          </h1>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="min-h-[40px] text-xs sm:text-[13px] text-onyx-700 hover:text-red-700 font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          <span>Esvaziar carrinho</span>
        </button>
      </div>

      {/* Toast Desfazer Remoção */}
      {lastRemovedItem && (
        <div
          role="status"
          className="px-4 py-3 rounded-2xl bg-onyx-950 text-white text-xs sm:text-sm flex items-center justify-between gap-3 shadow-md animate-scaleIn motion-reduce:animate-none"
        >
          <span className="truncate">
            Removido: <strong>{lastRemovedItem.name}</strong>
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={undoRemove}
              className="inline-flex items-center gap-1.5 text-marina-200 hover:text-white font-bold underline underline-offset-2 cursor-pointer py-1 px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Desfazer</span>
            </button>
            <button
              type="button"
              onClick={dismissUndo}
              aria-label="Fechar aviso"
              className="text-silk-300 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Barra de Frete Grátis */}
      <FreeShippingBar
        remainingForFreeShippingCents={remainingForFreeShippingCents}
        freeShippingProgress={freeShippingProgress}
      />

      {/* Grade 2 colunas no desktop (itens | resumo sticky) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <CartLineItem
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              variant="page"
            />
          ))}
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-32">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-silk-200 shadow-luxury-card space-y-5">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-onyx-950 border-b border-silk-100 pb-3">
              Resumo do Pedido
            </h2>
            <CartSummary
              subtotalCents={subtotalCents}
              pixTotalCents={pixTotalCents}
              totalItems={totalItems}
              remainingForFreeShippingCents={remainingForFreeShippingCents}
              whatsappHref={whatsappHref}
              showEstimatedShipping
            />
          </div>
        </aside>
      </div>

      {/* Barra fixa inferior no Mobile (total + botão Finalizar compra) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-silk-200 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(26,9,24,0.08)]">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="block text-xs text-onyx-700 font-medium">
              Total ({totalItems} {totalItems === 1 ? "item" : "itens"})
            </span>
            <span className="block text-base font-bold text-onyx-950 tabular-nums">
              {formatBRL(toReais(subtotalCents))}
            </span>
          </div>

          <Link
            href="/checkout"
            className="flex-1 max-w-[220px] min-h-[44px] bg-marina-600 hover:bg-marina-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-marina-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
          >
            <span>Finalizar compra</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import {
  useCartActions,
  useCartState,
  useCartUI,
} from "@/context/CartContext";
import FreeShippingBar from "@/components/cart/FreeShippingBar";
import CartLineItem from "@/components/cart/CartLineItem";
import CartSummary from "@/components/cart/CartSummary";
import CartEmptyState from "@/components/cart/CartEmptyState";

const TRANSITION_MS = 280;

export default function CartDrawer() {
  const {
    items,
    subtotalCents,
    pixTotalCents,
    totalItems,
    freeShippingProgress,
    remainingForFreeShippingCents,
    lastRemovedItem,
  } = useCartState();
  const { isCartOpen, closeCart, announcement } = useCartUI();
  const {
    removeItem,
    undoRemove,
    dismissUndo,
    updateQuantity,
    generateWhatsAppLink,
  } = useCartActions();

  // Mantém montado durante a animação de entrada e saída
  const [rendered, setRendered] = useState(isCartOpen);
  const [visible, setVisible] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isCartOpen) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setRendered(true);
      const raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setVisible(true));
      });
      return () => window.cancelAnimationFrame(raf);
    }

    setVisible(false);
    const timer = window.setTimeout(() => {
      setRendered(false);
      // Devolve o foco ao gatilho original ao fechar
      const trigger =
        previousFocusRef.current ||
        document.querySelector<HTMLElement>('[data-cart-trigger="true"]');
      if (trigger && document.contains(trigger)) {
        trigger.focus();
      }
    }, TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [isCartOpen]);

  // Trava scroll do body e gerencia Esc + focus trap
  useEffect(() => {
    if (!rendered) return;

    const prevOverflow = document.body.style.overflow;
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    }

    // Foca o botão de fechar ao abrir
    if (isCartOpen) {
      const focusTimer = window.setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 40);
      return () => {
        window.clearTimeout(focusTimer);
        document.body.style.overflow = prevOverflow;
      };
    }

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [rendered, isCartOpen]);

  useEffect(() => {
    if (!isCartOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeCart();
        return;
      }

      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!rendered) return null;

  const whatsappHref = generateWhatsAppLink();

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden ${
        visible ? "pointer-events-auto" : "pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      {/* Região aria-live para leitores de tela */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Backdrop */}
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={`absolute inset-0 bg-onyx-950/55 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Painel Lateral */}
      <div className="fixed inset-y-0 right-0 flex w-full sm:max-w-md">
        <div
          ref={panelRef}
          className={`w-full bg-white text-onyx-900 shadow-2xl flex flex-col h-full border-l border-silk-200 transition-transform duration-300 ease-out motion-reduce:transition-none ${
            visible ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Cabeçalho fixo */}
          <header className="px-5 sm:px-6 py-4 border-b border-silk-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-baseline gap-2.5">
              <h2
                id="cart-drawer-title"
                className="font-serif text-xl sm:text-2xl text-onyx-950 font-bold tracking-tight"
              >
                Sua Sacola
              </h2>
              <span className="text-xs sm:text-[13px] text-onyx-700 font-medium tabular-nums">
                {totalItems} {totalItems === 1 ? "item" : "itens"}
              </span>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeCart}
              aria-label="Fechar sacola"
              className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-onyx-700 hover:text-onyx-950 rounded-full hover:bg-silk-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </header>

          {/* Barra de Frete Grátis */}
          <FreeShippingBar
            remainingForFreeShippingCents={remainingForFreeShippingCents}
            freeShippingProgress={freeShippingProgress}
            compact
          />

          {/* Toast Desfazer Remoção (5s) */}
          {lastRemovedItem && (
            <div
              role="status"
              className="mx-5 sm:mx-6 mt-3 px-3.5 py-2.5 rounded-xl bg-onyx-950 text-white text-xs flex items-center justify-between gap-3 shadow-md shrink-0 animate-scaleIn motion-reduce:animate-none"
            >
              <span className="truncate [word-spacing:0.04em]">
                Removido: <strong>{lastRemovedItem.name}</strong>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={undoRemove}
                  className="inline-flex items-center gap-1 text-marina-200 hover:text-white font-bold underline underline-offset-2 cursor-pointer py-1 px-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Desfazer</span>
                </button>
                <button
                  type="button"
                  onClick={dismissUndo}
                  aria-label="Fechar aviso de remoção"
                  className="text-silk-300 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* Lista rolável (apenas esta área rola) */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6">
            {items.length === 0 ? (
              <CartEmptyState onClose={closeCart} variant="drawer" />
            ) : (
              <div className="divide-y divide-silk-200/70">
                {items.map((item) => (
                  <CartLineItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                    onNavigate={closeCart}
                    variant="drawer"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Rodapé fixo com Safe-Area */}
          {items.length > 0 && (
            <footer className="px-5 sm:px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-silk-200 bg-silk-50/70 shrink-0">
              <CartSummary
                subtotalCents={subtotalCents}
                pixTotalCents={pixTotalCents}
                totalItems={totalItems}
                remainingForFreeShippingCents={remainingForFreeShippingCents}
                whatsappHref={whatsappHref}
                onCheckoutClick={closeCart}
                showFullCartLink
                onFullCartClick={closeCart}
              />
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}

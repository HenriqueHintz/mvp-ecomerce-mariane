"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
    subtotal,
    freeShippingProgress,
    remainingForFreeShipping,
    generateWhatsAppLink,
  } = useCart();

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  if (!isCartOpen) return null;

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  const handleWhatsAppCheckout = () => {
    const url = generateWhatsAppLink();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Sacola de compras"
    >
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-onyx-950/50 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10">
        <div className="w-screen max-w-md bg-white text-onyx-900 shadow-2xl flex flex-col h-full border-l border-silk-200 animate-slideUp">
          {/* Header Simples & Refinado */}
          <div className="px-6 py-5 border-b border-silk-200 flex items-center justify-between bg-white">
            <div className="flex items-baseline gap-2.5">
              <h2 className="font-serif text-xl sm:text-2xl text-onyx-950 font-medium tracking-tight">
                Sua Sacola
              </h2>
              <span className="text-xs text-onyx-500 font-sans">
                {totalItems} {totalItems === 1 ? "item" : "itens"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="w-9 h-9 flex items-center justify-center text-onyx-500 hover:text-onyx-900 rounded-full hover:bg-silk-100 transition-colors cursor-pointer"
              aria-label="Fechar sacola"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Frete Grátis Minimalista */}
          <div className="px-6 py-3.5 bg-silk-50/70 border-b border-silk-200/80">
            <div className="flex items-center justify-between text-xs mb-2">
              {remainingForFreeShipping === 0 ? (
                <span className="text-emerald-dark flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-whatsapp" />
                  Parabéns! Você ganhou Frete Grátis!
                </span>
              ) : (
                <span className="text-onyx-700">
                  Faltam{" "}
                  <strong className="text-marina-700 font-semibold">
                    R$ {remainingForFreeShipping.toFixed(2)}
                  </strong>{" "}
                  para Frete Grátis
                </span>
              )}
              <span className="text-onyx-500 text-[11px] font-medium">
                {freeShippingProgress}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-silk-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  remainingForFreeShipping === 0
                    ? "bg-emerald-whatsapp"
                    : "bg-marina-600"
                }`}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Corpo: Lista de Itens ou Estado Vazio */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-2 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-silk-100 flex items-center justify-center text-marina-400 mb-4 border border-silk-200/60">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-onyx-950 mb-2">
                  Sua sacola está vazia
                </h3>
                <p className="text-xs sm:text-sm text-onyx-600 max-w-xs leading-relaxed mb-8">
                  Descubra os melhores tratamentos das marcas profissionais Madressenza, Wella, Truss, L&apos;Oréal e Braé.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="bg-onyx-950 hover:bg-marina-600 text-white px-8 py-3.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all shadow-sm hover:shadow-md cursor-pointer"
                >
                  Explorar Vitrine
                </button>
              </div>
            ) : (
              <div className="divide-y divide-silk-100">
                {items.map((item) => {
                  const unitPrice =
                    item.promoPrice &&
                    item.promoPrice > 0 &&
                    item.promoPrice < item.price
                      ? item.promoPrice
                      : item.price;

                  return (
                    <div
                      key={item.id}
                      className="py-4 flex gap-4 items-center group"
                    >
                      {/* Miniatura do Produto */}
                      <div className="relative w-16 h-18 sm:w-18 sm:h-20 rounded-xl overflow-hidden bg-silk-50 flex-shrink-0 border border-silk-200/80">
                        {!imgErrors[item.id] && item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            onError={() =>
                              setImgErrors((prev) => ({
                                ...prev,
                                [item.id]: true,
                              }))
                            }
                            className="object-cover"
                            sizes="72px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-marina-600 bg-marina-50">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Informações e Controles */}
                      <div className="flex-1 min-w-0">
                        {item.brandName && (
                          <span className="text-[10px] tracking-widest uppercase text-marina-700 font-bold block mb-0.5 truncate">
                            {item.brandName}
                          </span>
                        )}
                        <h4 className="text-xs font-medium text-onyx-900 line-clamp-2 leading-snug">
                          {item.name}
                        </h4>

                        <div className="flex items-center justify-between mt-3">
                          {/* Seletor de Quantidade Minimalista */}
                          <div className="flex items-center border border-silk-200 rounded-lg bg-silk-50/60 p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-onyx-600 hover:text-onyx-950 rounded hover:bg-white transition-colors cursor-pointer"
                              aria-label="Diminuir quantidade"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-semibold text-onyx-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center text-onyx-600 hover:text-onyx-900 rounded hover:bg-white transition-colors cursor-pointer"
                              aria-label="Aumentar quantidade"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Preço Total do Item */}
                          <div className="text-right">
                            <span className="text-xs font-bold text-onyx-950 font-sans">
                              R$ {(unitPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>

                          {/* Botão de Remover */}
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-onyx-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                            aria-label="Remover item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rodapé com Ações de Finalização */}
          {items.length > 0 && (
            <div className="px-6 py-5 border-t border-silk-200 bg-silk-50/50 space-y-4">
              {/* Valores e Desconto PIX */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-onyx-700">
                  <span>Subtotal</span>
                  <span className="font-bold text-onyx-950 text-sm">
                    R$ {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-dark font-medium">
                  <span>No PIX (5% de desconto)</span>
                  <span className="font-bold">
                    R$ {(subtotal * 0.95).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-onyx-500 text-[11px]">
                  <span>Parcelamento</span>
                  <span>
                    Até 10x de R$ {(subtotal / 10).toFixed(2)} sem juros
                  </span>
                </div>
              </div>

              {/* Botões Principais */}
              <div className="space-y-2.5 pt-1">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-marina-600 hover:bg-marina-700 text-white font-semibold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all shadow-sm hover:shadow-marina-md"
                >
                  <span>Finalizar Pedido</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-emerald-whatsapp hover:bg-emerald-dark text-white font-semibold py-3 px-5 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Comprar pelo WhatsApp</span>
                </button>

                <Link
                  href="/carrinho"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full block text-center text-xs font-semibold text-onyx-600 hover:text-marina-600 py-1 transition-colors"
                >
                  Ver sacola completa
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

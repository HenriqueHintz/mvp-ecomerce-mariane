"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Truck,
  ShieldCheck,
} from "lucide-react";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    freeShippingProgress,
    remainingForFreeShipping,
    generateWhatsAppLink,
  } = useCart();

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-5">
        <div className="bg-white p-10 rounded-3xl border border-silk-200 shadow-luxury-card space-y-4">
          <ShoppingBag className="w-14 h-14 text-marina-400 mx-auto stroke-[1.5]" />
          <h1 className="font-serif text-2xl sm:text-3xl text-onyx-900">
            Seu carrinho está vazio
          </h1>
          <p className="text-xs sm:text-sm text-onyx-700 max-w-md mx-auto leading-relaxed">
            Explore nosso catálogo de tratamentos profissionais Wella, Truss, Braé, L&apos;Oréal e perfumaria fina Madressenza.
          </p>
          <div className="pt-2">
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 bg-marina-600 hover:bg-marina-700 text-white px-8 py-3.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-marina-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explorar Catálogo</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pixPrice = subtotal * 0.95;
  const shippingCost = remainingForFreeShipping === 0 ? 0 : 22.9;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-silk-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-marina-600 block mb-1">
            Sacola de Compras
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-onyx-900 tracking-tight">
            Meu Carrinho
          </h1>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-onyx-700 hover:text-red-600 font-medium inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Esvaziar carrinho</span>
        </button>
      </div>

      {/* Barra de Frete Grátis */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-silk-200 shadow-sm">
        <div className="flex items-center justify-between text-xs font-medium mb-2">
          {remainingForFreeShipping === 0 ? (
            <span className="text-emerald-dark flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-whatsapp" />
              <span>Parabéns! Seu pedido tem Frete Grátis garantido!</span>
            </span>
          ) : (
            <span className="text-onyx-800 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-marina-600" />
              <span>
                Adicione mais{" "}
                <strong className="text-marina-600">
                  R$ {remainingForFreeShipping.toFixed(2)}
                </strong>{" "}
                para ganhar <strong>Frete Grátis</strong>
              </span>
            </span>
          )}
          <span className="text-onyx-700 font-bold">{freeShippingProgress}%</span>
        </div>
        <div className="w-full h-2 bg-silk-200 rounded-full overflow-hidden">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lista de Itens */}
        <div className="lg:col-span-8 space-y-4">
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
                className="p-4 sm:p-5 bg-white rounded-2xl border border-silk-200 shadow-luxury-card flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
              >
                <div className="flex items-center gap-4">
                  <Link
                    href={`/produto/${item.slug}`}
                    className="relative w-20 h-24 rounded-xl overflow-hidden bg-silk-100 border border-silk-200 shrink-0"
                  >
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
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-marina-50 text-marina-600">
                        <Sparkles className="w-6 h-6" />
                      </div>
                    )}
                  </Link>

                  <div className="space-y-1">
                    {item.brandName && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-marina-600 bg-marina-50 px-2 py-0.5 rounded">
                        {item.brandName}
                      </span>
                    )}
                    <Link
                      href={`/produto/${item.slug}`}
                      className="block font-serif text-base font-medium text-onyx-900 hover:text-marina-600"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-onyx-700">
                      Valor unitário: <strong>R$ {unitPrice.toFixed(2)}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-silk-100">
                  <div className="flex items-center border border-silk-200 rounded-xl bg-silk-50">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-2 text-onyx-700 hover:text-onyx-900 cursor-pointer"
                      aria-label={`Diminuir quantidade de ${item.name}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-onyx-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-2 text-onyx-700 hover:text-onyx-900 cursor-pointer"
                      aria-label={`Aumentar quantidade de ${item.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[90px]">
                    <span className="text-sm font-bold text-onyx-900 block">
                      R$ {(unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-onyx-700/60 hover:text-red-600 transition-colors cursor-pointer"
                    aria-label={`Remover ${item.name} do carrinho`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo do Pedido */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-3xl border border-silk-200 shadow-luxury-card space-y-5 sticky top-32">
            <h2 className="font-serif text-xl text-onyx-900 border-b border-silk-100 pb-3">
              Resumo do Pedido
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-onyx-700">
                <span>Subtotal ({items.length} itens)</span>
                <span className="font-semibold text-onyx-900">
                  R$ {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-onyx-700">
                <span>Frete estimado</span>
                <span className="font-semibold text-emerald-dark">
                  {shippingCost === 0
                    ? "GRÁTIS (ou Retirada em Lages)"
                    : `R$ ${shippingCost.toFixed(2)} (ou Grátis na Loja)`}
                </span>
              </div>
              <div className="flex justify-between text-emerald-dark font-semibold pt-2 border-t border-silk-100">
                <span>À vista no PIX (5% OFF)</span>
                <span>R$ {pixPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-onyx-950 pt-2 border-t border-silk-200">
                <span>Total dos Produtos</span>
                <span className="text-lg">R$ {subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/checkout"
                className="w-full bg-marina-600 hover:bg-marina-700 text-white font-semibold py-3.5 px-5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-marina-sm hover:shadow-marina-md"
              >
                <span>Prosseguir para o Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={generateWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-whatsapp hover:bg-emerald-dark text-white font-semibold py-3 px-5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Comprar Direto pelo WhatsApp</span>
              </a>
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-onyx-700">
              <ShieldCheck className="w-4 h-4 text-emerald-whatsapp shrink-0" />
              <span>
                Loja Física Oficial: Rua Blumenau, Nº 623, Lages – SC
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

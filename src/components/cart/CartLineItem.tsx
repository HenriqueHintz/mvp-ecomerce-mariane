"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Trash2 } from "lucide-react";
import type { CartItem } from "@/context/CartContext";
import { calculateItemPriceCents, formatBRL, toCents, toReais } from "@/lib/pricing";
import QuantityStepper from "./QuantityStepper";

export interface CartLineItemProps {
  item: CartItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onNavigate?: () => void;
  variant?: "drawer" | "page";
}

export default function CartLineItem({
  item,
  onUpdateQuantity,
  onRemove,
  onNavigate,
  variant = "drawer",
}: CartLineItemProps) {
  const [imgError, setImgError] = useState(false);

  const unitPriceCents = calculateItemPriceCents({
    priceCents: toCents(item.price),
    promoPriceCents: item.promoPrice != null ? toCents(item.promoPrice) : null,
  });
  const lineTotalCents = unitPriceCents * item.quantity;

  const wrapperClass =
    variant === "page"
      ? "p-4 sm:p-5 bg-white rounded-2xl border border-silk-200 shadow-luxury-card flex gap-4 items-start"
      : "py-4 flex gap-3.5 items-start";

  return (
    <article className={wrapperClass}>
      {/* Miniatura 76–80px */}
      <Link
        href={`/produto/${item.slug}`}
        onClick={onNavigate}
        className="relative w-[76px] h-[76px] sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-silk-50 border border-silk-200/90 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
      >
        {!imgError && item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            onError={() => setImgError(true)}
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-marina-50 text-marina-600">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </Link>

      {/* Detalhes + Controles */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {item.brandName && (
              <span className="text-xs font-bold uppercase tracking-wider text-marina-700 block mb-0.5 truncate">
                {item.brandName}
              </span>
            )}
            <Link
              href={`/produto/${item.slug}`}
              onClick={onNavigate}
              title={item.name}
              className="text-sm sm:text-[15px] font-semibold text-onyx-950 hover:text-marina-700 line-clamp-2 leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded"
            >
              {item.name}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`Remover ${item.name} da sacola`}
            className="min-w-[40px] min-h-[40px] -mr-2 -mt-1 flex items-center justify-center text-onyx-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-end justify-between gap-3 mt-3">
          <QuantityStepper
            quantity={item.quantity}
            productName={item.name}
            onDecrease={() => onUpdateQuantity(item.id, -1)}
            onIncrease={() => onUpdateQuantity(item.id, 1)}
          />

          <div className="text-right shrink-0">
            <span className="block text-xs text-onyx-600 tabular-nums [word-spacing:0.04em]">
              {formatBRL(toReais(unitPriceCents))} un.
            </span>
            <span className="block text-sm sm:text-[15px] font-bold text-onyx-950 tabular-nums">
              {formatBRL(toReais(lineTotalCents))}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

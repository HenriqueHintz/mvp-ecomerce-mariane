"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, ShoppingBag, Sparkles } from "lucide-react";
import { useCartActions } from "@/context/CartContext";
import { formatBRL } from "@/lib/pricing";

interface SuggestedProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  brandName?: string | null;
  price: number;
  promoPrice?: number | null;
  imageUrl?: string;
}

export interface CartEmptyStateProps {
  onClose?: () => void;
  variant?: "drawer" | "page";
}

export default function CartEmptyState({
  onClose,
  variant = "drawer",
}: CartEmptyStateProps) {
  const { addItem } = useCartActions();
  const [suggestions, setSuggestions] = useState<SuggestedProduct[]>([]);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    fetch("/api/produtos?ordem=mais_vendidos&limit=4")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.products)
          ? payload.products
          : null;
        if (!active || !list) return;
        setSuggestions(list.slice(0, 4));
      })
      .catch(() => {
        // Falha silenciosa: mantém estado vazio limpo
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className={
        variant === "page"
          ? "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
          : "py-6"
      }
    >
      <div
        className={
          variant === "page"
            ? "bg-white p-6 sm:p-10 rounded-3xl border border-silk-200 shadow-luxury-card text-center"
            : "text-center px-1"
        }
      >
        <div className="w-14 h-14 mx-auto rounded-full bg-marina-50 border border-marina-200/70 flex items-center justify-center text-marina-700 mb-3.5">
          <ShoppingBag className="w-7 h-7 stroke-[1.6]" aria-hidden="true" />
        </div>

        <h3 className="font-serif text-xl sm:text-2xl font-bold text-onyx-950">
          Sua sacola está vazia
        </h3>

        <p className="mt-2 text-xs sm:text-sm text-onyx-700 max-w-xs mx-auto leading-relaxed [word-spacing:0.04em]">
          Escolha seus favoritos de Madressenza, Wella, L&apos;Oréal, Truss e Braé.
        </p>

        <div className="mt-5">
          <Link
            href="/produtos"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] bg-onyx-950 hover:bg-marina-700 text-white px-7 py-2.5 rounded-full text-sm font-semibold [word-spacing:0.05em] transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Explorar produtos</span>
          </Link>
        </div>
      </div>

      {/* Trilho de sugestões (Mais vendidos) */}
      {suggestions.length > 0 && (
        <div className="mt-7 pt-5 border-t border-silk-200/80">
          <p className="text-xs font-bold uppercase tracking-wider text-onyx-700 mb-3 [word-spacing:0.06em]">
            Mais vendidos para começar
          </p>
          <div className="bs-rail flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            {suggestions.map((prod) => {
              const displayPrice =
                prod.promoPrice && prod.promoPrice > 0 && prod.promoPrice < prod.price
                  ? prod.promoPrice
                  : prod.price;
              const imgUrl = prod.imageUrl || "/products/fallback.webp";

              return (
                <div
                  key={prod.id}
                  className="w-[156px] sm:w-[168px] shrink-0 snap-start bg-white border border-silk-200 rounded-2xl p-2.5 flex flex-col justify-between gap-2 shadow-2xs"
                >
                  <div>
                    <Link
                      href={`/produto/${prod.slug}`}
                      onClick={onClose}
                      className="relative block aspect-[4/5] w-full rounded-xl overflow-hidden bg-silk-50 border border-silk-100 mb-2"
                    >
                      {!imgErrors[prod.id] ? (
                        <Image
                          src={imgUrl}
                          alt={prod.name}
                          fill
                          sizes="160px"
                          onError={() =>
                            setImgErrors((prev) => ({ ...prev, [prod.id]: true }))
                          }
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-marina-600 bg-marina-50">
                          <Sparkles className="w-5 h-5" aria-hidden="true" />
                        </div>
                      )}
                    </Link>

                    <p className="text-xs font-semibold text-onyx-950 line-clamp-2 leading-snug min-h-[2.1rem]">
                      {prod.name}
                    </p>
                    <p className="text-xs font-bold text-marina-700 mt-1 tabular-nums">
                      {formatBRL(displayPrice)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      addItem(
                        {
                          id: prod.id,
                          name: prod.name,
                          slug: prod.slug,
                          sku: prod.sku,
                          brandName: prod.brandName,
                          price: prod.price,
                          promoPrice: prod.promoPrice,
                          image: imgUrl,
                        },
                        1
                      )
                    }
                    className="w-full min-h-[40px] bg-marina-50 hover:bg-marina-700 text-marina-800 hover:text-white border border-marina-200 hover:border-marina-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Adicionar</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

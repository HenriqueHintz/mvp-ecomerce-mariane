"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartActions } from "@/context/CartContext";
import { Price } from "@/components/ui";
import { formatBRL } from "@/lib/pricing";
import { Check, Eye, MessageCircle, ShoppingBag } from "lucide-react";

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  price: number;
  promoPrice?: number | null;
  installmentCount?: number | null;
  installmentValue?: number | null;
  imageUrl?: string;
  rating?: number | null;
  reviewCount?: number | null;
  isBestSeller?: number | null;
  isFeatured?: number | null;
}

export default function ProductCard({
  id,
  name,
  slug,
  sku,
  brandName,
  price,
  promoPrice,
  installmentCount = 10,
  installmentValue,
  imageUrl = "/products/fallback.webp",
  isBestSeller,
}: ProductCardProps) {
  const { addItem } = useCartActions();
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const hasRealPromo =
    typeof promoPrice === "number" && promoPrice > 0 && promoPrice < price;
  const currentPrice = hasRealPromo ? promoPrice : price;
  const installments = installmentCount || 10;
  const instVal =
    installmentValue || Math.round((currentPrice / installments) * 100) / 100;
  const pixPrice = formatBRL(currentPrice * 0.95);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id,
      name,
      slug,
      sku,
      brandName,
      price,
      promoPrice: hasRealPromo ? promoPrice : null,
      image: imageUrl,
    });
    setAdded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 1500);
  };

  const handleWhatsAppSingle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const msg = `Olá, Mariane Cosméticos! Gostaria de pedir o produto:\n*${name}*\nMarca: ${brandName || "Profissional"}\nPreço: ${formatBRL(currentPrice)} (ou ${pixPrice} no PIX)\nLink: https://marianecosmeticos.com.br/produto/${slug}`;
    window.open(
      `https://wa.me/5549991251617?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const discountPercent = hasRealPromo
    ? Math.round(((price - promoPrice!) / price) * 100)
    : 0;

  return (
    <article className="group relative bg-white rounded-2xl border border-silk-200 hover:border-marina-300 hover:shadow-luxury-hover transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Imagem 4:5 com fundo uniforme + ação secundária no hover */}
      <Link
        href={`/produto/${slug}`}
        title={name}
        aria-label={name}
        className="block relative aspect-[4/5] bg-silk-50 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marina-600"
      >
        {!imgError && imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            onError={() => setImgError(true)}
            className="object-contain p-4 group-hover:scale-[1.03] transition-transform duration-500 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-marina-50 to-silk-100 text-marina-700">
            <ShoppingBag className="w-8 h-8 text-marina-500 mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider text-marina-700">
              {brandName || "Mariane Cosméticos"}
            </span>
            <span className="font-serif text-sm text-onyx-900 mt-1 line-clamp-2">
              {name}
            </span>
          </div>
        )}

        {hasRealPromo && (
          <span className="absolute top-3 left-3 bg-marina-700 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
            -{discountPercent}%
          </span>
        )}

        <span
          aria-hidden="true"
          className="hidden sm:inline-flex items-center gap-1.5 absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 text-onyx-950 border border-silk-200 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 motion-reduce:transition-none whitespace-nowrap"
        >
          <Eye className="w-3.5 h-3.5 text-marina-700" />
          Ver detalhes
        </span>
      </Link>

      {/* Corpo do card */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold text-marina-700 truncate">
              {brandName || "Mariane Cosméticos"}
            </span>
            {isBestSeller === 1 && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-silk-100 text-onyx-800 shrink-0">
                Destaque
              </span>
            )}
          </div>

          <Link
            href={`/produto/${slug}`}
            title={name}
            aria-label={name}
            className="block group-hover:text-marina-700 transition-colors focus-visible:outline-none focus-visible:underline"
          >
            <h3 className="font-sans text-[14px] sm:text-[15px] font-medium text-onyx-900 line-clamp-3 leading-snug min-h-[3.85rem]">
              {name}
            </h3>
          </Link>
        </div>

        {/* Preço + Ações */}
        <div className="pt-3 border-t border-silk-200/80 flex flex-col gap-3">
          <Price
            price={price}
            promoPrice={hasRealPromo ? promoPrice : null}
            installmentCount={installments}
            installmentValue={instVal}
          />

          <div className="flex flex-col gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`w-full min-h-[44px] py-2.5 px-4 rounded-full text-xs sm:text-[13px] font-semibold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2 active:scale-[0.98] ${
                added
                  ? "bg-emerald-700 text-white"
                  : "bg-onyx-950 hover:bg-marina-700 text-white"
              }`}
              aria-label={
                added ? `${name} adicionado à sacola` : `Adicionar ${name} à sacola`
              }
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Adicionado ✓</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Adicionar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleWhatsAppSingle}
              className="w-full min-h-[44px] py-2 px-3 rounded-full text-xs sm:text-[13px] font-medium bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] text-emerald-800 border border-emerald-700/25 flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              aria-label={`Pedir ${name} pelo WhatsApp`}
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Pedir no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

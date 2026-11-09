"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Price } from "@/components/ui";
import { ShoppingBag, MessageCircle } from "lucide-react";

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
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
  isFeatured,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [imgError, setImgError] = useState(false);

  const hasRealPromo =
    typeof promoPrice === "number" && promoPrice > 0 && promoPrice < price;
  const currentPrice = hasRealPromo ? promoPrice : price;
  const installments = installmentCount || 10;
  const instVal =
    installmentValue || Math.round((currentPrice / installments) * 100) / 100;
  const pixPrice = (currentPrice * 0.95).toFixed(2);

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
  };

  const handleWhatsAppSingle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const msg = `Olá, Mariane Cosméticos! Gostaria de pedir o produto:\n*${name}*\nMarca: ${brandName || "Profissional"}\nPreço: R$ ${currentPrice.toFixed(2)} (ou R$ ${pixPrice} no PIX)\nLink: https://marianecosmeticos.com.br/produto/${slug}`;
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
    <div className="group relative bg-white rounded-2xl border border-silk-200/80 hover:border-marina-300/80 hover:shadow-luxury-hover transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Image Container with Fallback */}
      <Link
        href={`/produto/${slug}`}
        className="block relative aspect-square bg-silk-50/50 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marina-500"
      >
        {!imgError && imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            onError={() => setImgError(true)}
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-marina-50 to-silk-100 text-marina-700">
            <ShoppingBag className="w-8 h-8 text-marina-500 mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-marina-600">
              {brandName || "Mariane Cosméticos"}
            </span>
            <span className="font-serif text-xs text-onyx-800 mt-1 line-clamp-2">
              {name}
            </span>
          </div>
        )}

        {/* Floating Promotion Badge */}
        {hasRealPromo && (
          <span className="absolute top-2.5 left-2.5 bg-onyx-950/85 backdrop-blur-xs text-white text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full shadow-xs">
            -{discountPercent}%
          </span>
        )}
      </Link>

      {/* Info Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Brand Eyebrow */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-marina-700">
              {brandName || "Mariane Cosméticos"}
            </span>
            {isBestSeller === 1 && (
              <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-silk-100 text-onyx-700">
                Destaque
              </span>
            )}
          </div>

          {/* Title */}
          <Link
            href={`/produto/${slug}`}
            className="block group-hover:text-marina-700 transition-colors focus-visible:outline-none focus-visible:underline"
          >
            <h3 className="font-sans text-[13px] sm:text-[14px] font-normal text-onyx-800 line-clamp-2 leading-relaxed min-h-[2.5rem]">
              {name}
            </h3>
          </Link>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-silk-100/90 flex flex-col gap-3">
          <Price
            price={price}
            promoPrice={hasRealPromo ? promoPrice : null}
            installmentCount={installments}
            installmentValue={instVal}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 bg-onyx-950 hover:bg-marina-600 active:scale-[0.98] text-white py-2.5 px-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 min-h-[40px]"
              aria-label={`Adicionar ${name} à sacola`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppSingle}
              className="w-10 h-10 shrink-0 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-whatsapp border border-emerald-200/80 rounded-full flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-whatsapp min-h-[40px]"
              title="Pedir pelo WhatsApp"
              aria-label={`Comprar ${name} pelo WhatsApp`}
            >
              <MessageCircle className="w-4 h-4 fill-emerald-whatsapp text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCartActions } from "@/context/CartContext";
import { Price } from "@/components/ui";
import { SvgIcon } from "@/components/ui/SvgIcon";

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

  return (
    <article className="group product-card">
      {/* Imagem 4:5 com fundo uniforme + ação secundária no hover */}
      <Link
        href={`/produto/${slug}`}
        className="product-card-media"
      >
        {!imgError && imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="pc-img"
          />
        ) : (
          <div className="pc-fallback">
            <SvgIcon name="shopping-bag" className="w-8 h-8 text-marina-500 mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider text-marina-700">
              {brandName || "Mariane Cosméticos"}
            </span>
            <span className="font-serif text-sm text-onyx-900 mt-1 line-clamp-2">
              {name}
            </span>
          </div>
        )}

        <span aria-hidden="true" className="product-card-hover-pill">
          <SvgIcon name="eye" className="w-3.5 h-3.5 text-marina-700" />
          Ver detalhes
        </span>
      </Link>

      {/* Corpo do card */}
      <div className="pc-body">
        <div>
          <span className="pc-brand">
            {brandName || "Mariane Cosméticos"}
          </span>

          <Link
            href={`/produto/${slug}`}
            className="pc-link"
          >
            <h3 className="pc-title line-clamp-3">
              {name}
            </h3>
          </Link>
        </div>

        {/* Preço + Ação */}
        <div className="pc-foot">
          <Price
            price={price}
            promoPrice={hasRealPromo ? promoPrice : null}
            installmentCount={installments}
            installmentValue={instVal}
          />

          <button
            type="button"
            onClick={handleAddToCart}
            className={`btn-card-add ${added ? "!bg-emerald-700 !text-white" : ""}`}
            aria-label={
              added ? `${name} adicionado à sacola` : `Adicionar ${name} à sacola`
            }
          >
            {added ? (
              <>
                <SvgIcon name="check" className="w-4 h-4 shrink-0" />
                <span>Adicionado ✓</span>
              </>
            ) : (
              <>
                <SvgIcon name="shopping-bag" className="w-4 h-4 shrink-0" />
                <span>Adicionar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

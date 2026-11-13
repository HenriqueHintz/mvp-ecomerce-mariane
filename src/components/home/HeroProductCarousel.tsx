"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroCarouselProduct } from "@/data/hero-products";

export interface HeroProductCarouselProps {
  products: HeroCarouselProduct[];
}

export default function HeroProductCarousel({ products }: HeroProductCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [transitionId, setTransitionId] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);

  const total = products.length;

  const triggerStep = useCallback(
    (nextIdx: number) => {
      if (total <= 1) return;
      setHasInteracted(true);
      setPrevIndex(activeIndex);
      setActiveIndex(nextIdx);
      setTransitionId((prev) => prev + 1);

      if (cleanupTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(cleanupTimerRef.current);
      }
      if (typeof window !== "undefined") {
        cleanupTimerRef.current = window.setTimeout(() => {
          setPrevIndex(null);
        }, 800);
      }
    },
    [activeIndex, total]
  );

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    const nextIdx = (activeIndex - 1 + total) % total;
    triggerStep(nextIdx);
  }, [activeIndex, total, triggerStep]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    const nextIdx = (activeIndex + 1) % total;
    triggerStep(nextIdx);
  }, [activeIndex, total, triggerStep]);

  useEffect(() => {
    return () => {
      if (cleanupTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(cleanupTimerRef.current);
      }
    };
  }, []);

  // Pre-carrega imagens do proximo conjunto e do anterior apos o LCP inicial
  useEffect(() => {
    if (typeof window === "undefined" || total <= 1) return;
    const preloadTimer = window.setTimeout(() => {
      const indicesToPreload = [
        (activeIndex + 1) % total,
        (activeIndex + 2) % total,
        (activeIndex + 3) % total,
        (activeIndex + 4) % total,
        (activeIndex - 1 + total) % total,
      ];
      indicesToPreload.forEach((idx) => {
        const item = products[idx];
        if (!item?.image) return;
        const img = new window.Image();
        img.src = item.image;
      });
    }, 280);

    return () => window.clearTimeout(preloadTimer);
  }, [activeIndex, products, total]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (e.targetTouches.length === 0) return;
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchStartYRef.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    if (
      touchStartXRef.current === null ||
      touchStartYRef.current === null ||
      e.changedTouches.length === 0
    ) {
      return;
    }
    const deltaX = touchStartXRef.current - e.changedTouches[0].clientX;
    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Ignora rolagem vertical e dispara troca no arraste horizontal (> 36px)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 36) {
      if (deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  if (!products || total === 0) return null;

  const featuredProduct = products[activeIndex] || products[0];
  const previousProduct =
    prevIndex !== null && prevIndex !== activeIndex ? products[prevIndex] : null;

  const upperCards: HeroCarouselProduct[] = [
    products[(activeIndex + 1) % total],
    products[(activeIndex + 2) % total],
    products[(activeIndex + 3) % total],
  ].filter(Boolean);

  const isEditorialCover = featuredProduct.slug.includes("madressenza");
  const isPrevEditorialCover = previousProduct?.slug.includes("madressenza");

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Produtos em destaque da Mariane Cosméticos"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-3.5 sm:gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-4 rounded-3xl"
    >
      {/* Anuncio acessivel do produto em destaque */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`Produto em destaque: ${featuredProduct.brand} — ${featuredProduct.name}, ${featuredProduct.formattedPrice}`}
      </div>

      {/* 1. Banner Grande em Destaque (Protagonista — embaixo dos 3 cards no desktop, logo abaixo dos botoes no celular) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="order-1 lg:order-2 relative rounded-3xl bg-white border border-silk-200/80 shadow-[0_24px_60px_-15px_rgba(26,9,24,0.08),0_8px_24px_-6px_rgba(26,9,24,0.04)] overflow-hidden"
      >
        {/* Palco Fotografico com Proporcao Fixa (CLS = 0) */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] bg-silk-50 overflow-hidden">
          {previousProduct && (
            <div
              key={`prev-${previousProduct.id}-${transitionId}`}
              aria-hidden="true"
              className="hero-banner-exit absolute inset-0 w-full h-full pointer-events-none z-0"
            >
              <div className="relative w-full h-full">
                <Image
                  src={previousProduct.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 88vw, 680px"
                  className={
                    isPrevEditorialCover
                      ? "object-cover object-center"
                      : "object-contain p-5 sm:p-7 bg-white"
                  }
                />
              </div>
            </div>
          )}

          <Link
            key={`active-${featuredProduct.id}-${hasInteracted ? transitionId : "init"}`}
            href={featuredProduct.href}
            aria-label={`Ver ${featuredProduct.name} da marca ${featuredProduct.brand} por ${featuredProduct.formattedPrice}`}
            className={`block relative w-full h-full z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marina-600 ${
              hasInteracted ? "hero-banner-enter" : ""
            }`}
          >
            <Image
              src={featuredProduct.image}
              alt={featuredProduct.alt}
              fill
              priority={!hasInteracted && activeIndex === 0}
              loading={!hasInteracted && activeIndex === 0 ? "eager" : undefined}
              fetchPriority={!hasInteracted && activeIndex === 0 ? "high" : "auto"}
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 88vw, 680px"
              className={
                isEditorialCover
                  ? "object-cover object-center"
                  : "object-contain p-5 sm:p-7 bg-white"
              }
            />
          </Link>

          {/* Setas Anterior / Proximo sobre o banner (alvo >= 48px, acento Roxo Imperial no hover/foco) */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Produto anterior"
            className="
              absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20
              w-12 h-12 min-w-[48px] min-h-[48px] rounded-full
              bg-white/95 text-onyx-900 border border-silk-200/90
              shadow-luxury-card transition-colors duration-200
              hover:bg-marina-600 hover:text-white hover:border-marina-600
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2
              flex items-center justify-center cursor-pointer
            "
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Próximo produto"
            className="
              absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20
              w-12 h-12 min-w-[48px] min-h-[48px] rounded-full
              bg-white/95 text-onyx-900 border border-silk-200/90
              shadow-luxury-card transition-colors duration-200
              hover:bg-marina-600 hover:text-white hover:border-marina-600
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2
              flex items-center justify-center cursor-pointer
            "
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Legenda Editorial Discreta fora da imagem: Marca, Nome e Preco */}
        <Link
          href={featuredProduct.href}
          className="group/featured flex items-center justify-between gap-4 px-5 sm:px-6 py-3.5 sm:py-4 bg-white border-t border-silk-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marina-600"
        >
          <div className="min-w-0">
            <span className="block font-sans text-[11px] font-normal text-onyx-600 truncate">
              {featuredProduct.brand}
            </span>
            <span className="block font-serif text-sm sm:text-base font-medium text-onyx-950 truncate group-hover/featured:text-onyx-700 transition-colors">
              {featuredProduct.name}
            </span>
          </div>
          <span className="shrink-0 font-sans text-sm sm:text-base font-semibold text-onyx-950 tabular-nums">
            {featuredProduct.formattedPrice}
          </span>
        </Link>
      </div>

      {/* 2. Tres Cards de Produto (em cima no desktop, fileira horizontal com rolagem no celular) */}
      <div
        aria-label="Próximos produtos da coleção"
        className="order-2 lg:order-1 flex lg:grid lg:grid-cols-3 gap-3 sm:gap-3.5 overflow-x-auto lg:overflow-visible snap-x snap-mandatory hero-cards-rail pb-1 lg:pb-0"
      >
        {upperCards.map((card, cardIdx) => {
          const isCardCover = card.slug.includes("madressenza");
          return (
            <Link
              key={`upper-${card.id}-${hasInteracted ? transitionId : "init"}`}
              href={card.href}
              style={
                hasInteracted
                  ? { animationDelay: `${cardIdx * 75}ms` }
                  : undefined
              }
              className={`group/card snap-start shrink-0 w-[68%] sm:w-[44%] lg:w-auto flex flex-col rounded-2xl bg-white border border-silk-200/80 shadow-[0_8px_24px_-8px_rgba(26,9,24,0.05)] overflow-hidden transition-shadow duration-300 hover:shadow-luxury-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 ${
                hasInteracted ? "hero-card-enter" : ""
              }`}
            >
              <div className="relative w-full aspect-[4/3] lg:aspect-[16/10] bg-silk-50 overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.alt}
                  fill
                  sizes="(max-width: 640px) 62vw, (max-width: 1024px) 40vw, 210px"
                  className={
                    isCardCover
                      ? "object-cover object-center transition-transform duration-500 ease-out group-hover/card:scale-[1.03]"
                      : "object-contain p-2.5 bg-white transition-transform duration-500 ease-out group-hover/card:scale-[1.03]"
                  }
                />
              </div>
              <div className="px-3.5 py-2 flex flex-col gap-0.5 bg-white border-t border-silk-200/60">
                <span className="font-sans text-[11px] font-normal text-onyx-600 truncate">
                  {card.brand}
                </span>
                <span className="font-serif text-xs sm:text-[13px] font-medium text-onyx-950 truncate">
                  {card.name}
                </span>
                <span className="font-sans text-xs sm:text-[13px] font-semibold text-onyx-900 tabular-nums pt-0.5">
                  {card.formattedPrice}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

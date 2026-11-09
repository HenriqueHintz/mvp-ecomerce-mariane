"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { HERO_SLIDES, HERO_CONTENT, HeroSlide } from "@/data/hero-slides";
import { ChevronLeft, ChevronRight, MessageCircle, ShoppingBag } from "lucide-react";

export interface HeroCarouselProps {
  slides?: HeroSlide[];
  headline?: string;
  curation?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
}

export default function HeroCarousel({
  slides = HERO_SLIDES,
  headline = HERO_CONTENT.headline,
  curation = HERO_CONTENT.curation,
  primaryCtaLabel = HERO_CONTENT.primaryCta.label,
  primaryCtaHref = HERO_CONTENT.primaryCta.href,
  secondaryCtaLabel = HERO_CONTENT.secondaryCta.label,
  secondaryCtaHref = HERO_CONTENT.secondaryCta.href,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion || slides.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion, slides.length, handleNext]);

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
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (distance > 45) {
      handleNext();
    } else if (distance < -45) {
      handlePrev();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;
    setIsMouseDown(true);
    setMouseStartX(e.clientX);
  };

  const handleMouseMove = (_e: React.MouseEvent<HTMLElement>) => {
    if (!isMouseDown) return;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLElement>) => {
    if (!isMouseDown || mouseStartX === null) {
      setIsMouseDown(false);
      setMouseStartX(null);
      return;
    }
    const distance = mouseStartX - e.clientX;
    if (distance > 45) {
      handleNext();
    } else if (distance < -45) {
      handlePrev();
    }
    setIsMouseDown(false);
    setMouseStartX(null);
  };

  if (!slides || slides.length === 0) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Destaques Mariane Cosméticos"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        setIsMouseDown(false);
        setMouseStartX(null);
      }}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragStart={(e) => e.preventDefault()}
      className="relative isolate w-full overflow-hidden select-none bg-silk-50 border-b border-silk-200/80 aspect-[1080/1350] sm:aspect-[16/9] lg:aspect-[1920/720] focus:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 cursor-grab active:cursor-grabbing"
    >
      <div className="absolute inset-0 w-full h-full" aria-live={isPaused ? "polite" : "off"}>
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`Foto ${index + 1} de ${slides.length}: ${slide.alt}`}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <div className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none select-none">
                <Image
                  src={slide.desktop}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  draggable={false}
                  className="object-cover object-center pointer-events-none select-none"
                />
              </div>

              <div className="block sm:hidden absolute inset-0 w-full h-full pointer-events-none select-none">
                <Image
                  src={slide.mobile}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  draggable={false}
                  className="object-cover object-center pointer-events-none select-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Overlay com fundo branco no lado esquerdo, degradê reduzido e corte posicionado mais para a direita */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-t from-white from-45% to-transparent to-55% sm:bg-gradient-to-r sm:from-white sm:from-51% sm:to-transparent sm:to-56% w-full"
      />

      <div className="absolute inset-0 z-20 flex flex-col justify-end sm:justify-center pointer-events-none pb-12 sm:pb-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 xl:px-14">
          <div className="max-w-md lg:max-w-lg xl:max-w-[31.5rem] space-y-4 sm:space-y-5 lg:space-y-6 pointer-events-auto">
            <h2 className="font-serif italic text-2xl sm:text-3xl lg:text-[2.9rem] xl:text-[3.15rem] font-bold text-marina-900 tracking-tight leading-[1.14] text-balance">
              {headline}
            </h2>

            <p className="text-xs sm:text-base lg:text-[1.0625rem] text-onyx-700 font-normal leading-relaxed font-sans">
              <span className="block font-medium text-onyx-900">Curadoria oficial Madressenza, Wella Professionals,</span>
              <span className="block text-onyx-700">Truss, Braé e L&apos;Oréal Professionnel.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 pt-1.5 sm:pt-2">
              <Link
                href={primaryCtaHref}
                className="bg-marina-500 hover:bg-marina-600 active:scale-[0.98] text-white font-semibold px-6 sm:px-7 py-3 sm:py-3.5 rounded-full text-xs tracking-wider uppercase transition-all shadow-marina-md hover:shadow-lg flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 min-h-[44px]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{primaryCtaLabel}</span>
              </Link>

              <a
                href={secondaryCtaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-whatsapp hover:bg-emerald-dark active:scale-[0.98] text-white font-semibold px-5 sm:px-6 py-3 sm:py-3.5 rounded-full text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-whatsapp min-h-[44px]"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>{secondaryCtaLabel}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePrev}
        aria-label="Foto anterior"
        className="absolute left-2.5 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-onyx-900 shadow-md hover:shadow-lg border border-silk-200/80 transition-all active:scale-95 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 cursor-pointer backdrop-blur-xs"
      >
        <ChevronLeft className="w-6 h-6 text-onyx-900" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Próxima foto"
        className="absolute right-2.5 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-onyx-900 shadow-md hover:shadow-lg border border-silk-200/80 transition-all active:scale-95 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 cursor-pointer backdrop-blur-xs"
      >
        <ChevronRight className="w-6 h-6 text-onyx-900" />
      </button>

      <div
        role="tablist"
        aria-label="Slides do carrossel"
        className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-onyx-950/20 backdrop-blur-xs px-3 py-1.5 rounded-full"
      >
        {slides.map((_, index) => {
          const isActive = currentIndex === index;
          return (
            <button
              key={index}
              type="button"
              role="tab"
              onClick={() => goToSlide(index)}
              aria-label={`Ir para a foto ${index + 1} de ${slides.length}`}
              aria-selected={isActive}
              className={`transition-all duration-300 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white p-1 ${
                isActive
                  ? "w-6 h-2 bg-marina-600 shadow-xs"
                  : "w-2 h-2 bg-white/70 hover:bg-white"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export { HeroCarousel as HeroPanoramicBanner };

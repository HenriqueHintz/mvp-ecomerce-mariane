"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HeroScenes, { type SlideDirection } from "@/components/home/HeroScenes";
import {
  HERO_CONTENT,
  resolveHeroSlides,
  type ResolvedHeroSlide,
} from "@/data/hero-slides";
import type { HeroCarouselProduct } from "@/data/hero-products";

export { HeroScenes as HeroPanoramicBanner };

export interface HeroProps {
  products?: HeroCarouselProduct[];
}

declare global {
  interface Window {
    SitesIncriveis?: {
      iniciar?: () => void;
    };
  }
}

const SLOGAN_WORDS = HERO_CONTENT.slogan.split(/\s+/);

export default function Hero({ products }: HeroProps) {
  const slides: ResolvedHeroSlide[] = resolveHeroSlides(products);
  const total = slides.length;

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<SlideDirection>("next");
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [entered, setEntered] = useState<boolean>(false);
  const [parallaxOffset, setParallaxOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Garante coreografia de entrada (< 1,2s) e 100% de visibilidade ao voltar de /produtos -> /
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setEntered(true);
      if (typeof window !== "undefined" && window.SitesIncriveis?.iniciar) {
        window.SitesIncriveis.iniciar();
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const triggerSlideChange = useCallback(
    (targetIndex: number, dir: SlideDirection) => {
      const normalized = ((targetIndex % total) + total) % total;
      if (normalized === activeIndex) return;

      setIsInitialLoad(false);
      setDirection(dir);
      setPrevIndex(activeIndex);
      setActiveIndex(normalized);

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      transitionTimeoutRef.current = setTimeout(() => {
        setPrevIndex(null);
      }, 850);
    },
    [activeIndex, total]
  );

  const handlePrev = useCallback(() => {
    triggerSlideChange(activeIndex - 1, "prev");
  }, [activeIndex, triggerSlideChange]);

  const handleNext = useCallback(() => {
    triggerSlideChange(activeIndex + 1, "next");
  }, [activeIndex, triggerSlideChange]);

  const handleSelectSlide = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      const dir: SlideDirection = index > activeIndex ? "next" : "prev";
      triggerSlideChange(index, dir);
    },
    [activeIndex, triggerSlideChange]
  );

  // Navegação por teclado (ArrowLeft / ArrowRight)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePrev, handleNext]);

  // Swipe touch no celular
  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (e.changedTouches.length === 0) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) > 36 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  // Paralaxe sutil do fundo com o mouse no desktop (desativado no celular e em movimento reduzido)
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (typeof window === "undefined" || window.innerWidth < 1024) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;

    setParallaxOffset({
      x: -relX * 12,
      y: -relY * 8,
    });
  };

  const handleMouseLeave = () => {
    setParallaxOffset({ x: 0, y: 0 });
  };

  const activeSlide = slides[activeIndex] ?? slides[0];
  const isDarkTone = activeSlide.tone === "escuro";

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques da Mariane Cosméticos"
      data-tone={activeSlide.tone}
      data-active-slide={activeIndex}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hero-editorial relative w-full h-[calc(100svh-138px)] min-h-[540px] max-h-[705px] md:h-[clamp(560px,76vh,720px)] md:max-h-[760px] overflow-hidden select-none"
    >
      {/* Anúncio acessível de mudança de slide (apenas para leitores de tela) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Slide ${activeIndex + 1} de ${total}: ${activeSlide.productName}`}
      </div>

      {/* Planos de Fundo em Cena (21:9 Desktop / 4:5 Celular) */}
      <HeroScenes
        slides={slides}
        activeIndex={activeIndex}
        prevIndex={prevIndex}
        direction={direction}
        isInitialLoad={isInitialLoad}
        parallaxOffset={parallaxOffset}
      />

      {/* Seta Esquerda — Na metade superior ao lado do produto no celular; na borda lateral no desktop */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Slide anterior"
        className={`hero-arrow-btn group absolute z-30 left-2.5 md:left-4 lg:left-6 top-[26%] md:top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 focus-visible:ring-offset-2 ${
          isDarkTone
            ? "bg-onyx-950/55 text-silk-50 border border-silk-50/25 hover:bg-marina-500 hover:border-marina-500 hover:text-white focus-visible:bg-marina-500 focus-visible:text-white"
            : "bg-white/75 text-onyx-950 border border-onyx-950/15 hover:bg-marina-500 hover:border-marina-500 hover:text-white focus-visible:bg-marina-500 focus-visible:text-white"
        }`}
      >
        <ChevronLeft
          className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:-translate-x-0.5"
          strokeWidth={1.6}
        />
      </button>

      {/* Seta Direita — Na metade superior ao lado do produto no celular; na borda lateral no desktop */}
      <button
        type="button"
        onClick={handleNext}
        aria-label="Próximo slide"
        className={`hero-arrow-btn group absolute z-30 right-2.5 md:right-4 lg:right-6 top-[26%] md:top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 focus-visible:ring-offset-2 ${
          isDarkTone
            ? "bg-onyx-950/55 text-silk-50 border border-silk-50/25 hover:bg-marina-500 hover:border-marina-500 hover:text-white focus-visible:bg-marina-500 focus-visible:text-white"
            : "bg-white/75 text-onyx-950 border border-onyx-950/15 hover:bg-marina-500 hover:border-marina-500 hover:text-white focus-visible:bg-marina-500 focus-visible:text-white"
        }`}
      >
        <ChevronRight
          className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:translate-x-0.5"
          strokeWidth={1.6}
        />
      </button>

      {/* Container de Conteúdo Fixo (Esquerda no Desktop / Metade Inferior no Celular) */}
      <div className="relative z-20 mx-auto w-full max-w-[1360px] h-full px-5 sm:px-8 md:pl-20 lg:pl-24 md:pr-12 flex flex-col justify-end md:justify-center pb-4 sm:pb-6 md:pb-0 pointer-events-none">
        <div className="w-full md:w-[46%] lg:w-[44%] max-w-[520px] flex flex-col items-start text-left pointer-events-auto">
          {/* 1. Nome da Marca (pequeno, espaçado, acima do slogan) */}
          <p
            data-fx="subir"
            style={{ transitionDelay: "80ms" }}
            className={`order-1 uppercase tracking-[0.28em] text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-3 transition-colors duration-500 ${
              entered ? "fx-em-cena" : ""
            } ${isDarkTone ? "text-marina-100" : "text-marina-700"}`}
          >
            {HERO_CONTENT.companyName}
          </p>

          {/* 2. Slogan (h1 em Playfair Display, surge palavra por palavra na carga inicial e não reanima na troca) */}
          <h1
            data-fx="palavras"
            className={`order-2 font-serif text-[1.5rem] leading-[1.15] sm:text-[2.15rem] md:text-[2.55rem] lg:text-[3rem] md:leading-[1.12] font-normal tracking-[-0.01em] mb-1 sm:mb-4 md:mb-7 transition-colors duration-500 ${
              entered ? "fx-em-cena" : ""
            } ${isDarkTone ? "text-silk-50" : "text-onyx-950"}`}
          >
            {SLOGAN_WORDS.map((word, idx) => (
              <React.Fragment key={idx}>
                <span
                  className="fx-palavra"
                  style={
                    {
                      "--i": idx,
                      transitionDelay: `${140 + idx * 55}ms`,
                    } as React.CSSProperties
                  }
                >
                  {word}
                </span>
                {idx < SLOGAN_WORDS.length - 1 ? " " : ""}
              </React.Fragment>
            ))}
          </h1>

          {/* 4. Indicadores Finos (No celular: acima dos botões [order-3]; no desktop: centralizados na base do banner) */}
          <div
            role="group"
            aria-label="Indicadores de slides"
            className="order-3 md:order-none flex items-center gap-0.5 mb-1 sm:mb-3 md:mb-0 md:absolute md:bottom-5 lg:bottom-6 md:left-1/2 md:-translate-x-1/2 z-30"
          >
            {slides.map((slide, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => handleSelectSlide(idx)}
                  aria-label={`Ir para o slide ${idx + 1} de ${total}`}
                  aria-current={isActive ? "true" : undefined}
                  className="group relative flex items-center justify-center min-w-[44px] min-h-[44px] px-1.5 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 rounded-full"
                >
                  <span
                    className={`block rounded-full transition-all duration-500 ${
                      isActive
                        ? isDarkTone
                          ? "w-9 h-[3px] bg-silk-50 shadow-[0_0_8px_rgba(117,6,106,0.8)]"
                          : "w-9 h-[3px] bg-marina-500"
                        : isDarkTone
                        ? "w-4 h-[2px] bg-silk-50/40 group-hover:bg-silk-50/75"
                        : "w-4 h-[2px] bg-onyx-950/30 group-hover:bg-marina-500/65"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* 3. Botões ("Ver Catálogo" principal -> /produtos e "Consultoria no WhatsApp" secundário) */}
          <div
            data-fx="subir"
            style={{ transitionDelay: "580ms" }}
            className={`order-4 flex flex-nowrap items-center gap-2 sm:gap-3.5 w-full sm:w-auto ${
              entered ? "fx-em-cena" : ""
            }`}
          >
            <Link
              href={HERO_CONTENT.primaryCta.href}
              className="inline-flex items-center justify-center min-h-[44px] sm:min-h-[48px] px-4 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wide bg-marina-500 text-white hover:bg-marina-600 active:scale-[0.99] transition-all duration-300 shadow-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 focus-visible:ring-offset-2"
            >
              {HERO_CONTENT.primaryCta.cleanLabel}
            </Link>

            <a
              href={HERO_CONTENT.secondaryCta.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium tracking-wide backdrop-blur-sm transition-all duration-500 active:scale-[0.99] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 focus-visible:ring-offset-2 ${
                isDarkTone
                  ? "border border-silk-50/65 bg-onyx-950/65 text-silk-50 hover:bg-marina-500 hover:border-marina-500 hover:text-white"
                  : "border border-marina-500/80 bg-white/80 text-marina-700 hover:bg-marina-500 hover:border-marina-500 hover:text-white"
              }`}
            >
              {HERO_CONTENT.secondaryCta.cleanLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

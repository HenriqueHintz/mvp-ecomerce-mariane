"use client";

import React from "react";
import { getImageProps } from "next/image";
import Link from "next/link";
import type { ResolvedHeroSlide } from "@/data/hero-slides";

export type SlideDirection = "next" | "prev";

export interface HeroScenesProps {
  slides: ResolvedHeroSlide[];
  activeIndex: number;
  prevIndex: number | null;
  direction: SlideDirection;
  isInitialLoad: boolean;
  parallaxOffset: { x: number; y: number };
}

interface ScenePictureProps {
  slide: ResolvedHeroSlide;
  isFirstSlide: boolean;
  eagerLoad: boolean;
}

function ScenePicture({ slide, isFirstSlide, eagerLoad }: ScenePictureProps) {
  const common = {
    alt: slide.alt,
    sizes: "100vw",
    quality: 84,
  };

  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({
    ...common,
    width: 1080,
    height: 1350,
    src: slide.mobile,
    priority: isFirstSlide,
  });

  const {
    props: { srcSet: desktopSrcSet, src: desktopSrc, ...restDesktop },
  } = getImageProps({
    ...common,
    width: 2400,
    height: 1030,
    src: slide.desktop,
    priority: isFirstSlide,
  });

  const focalVars = {
    "--fp-desktop": slide.focalPoint.desktop,
    "--fp-mobile": slide.focalPoint.mobile,
  } as React.CSSProperties;

  return (
    <picture className="block w-full h-full select-none pointer-events-none">
      <source media="(max-width: 767px)" srcSet={mobileSrcSet} sizes="100vw" />
      <source media="(min-width: 768px)" srcSet={desktopSrcSet} sizes="100vw" />
      <img
        {...restDesktop}
        src={desktopSrc}
        alt={slide.alt}
        loading={isFirstSlide || eagerLoad ? "eager" : "lazy"}
        fetchPriority={isFirstSlide ? "high" : "auto"}
        decoding={isFirstSlide ? "sync" : "async"}
        style={focalVars}
        className="hero-scene-img w-full h-full"
      />
    </picture>
  );
}

export default function HeroScenes({
  slides,
  activeIndex,
  prevIndex,
  direction,
  isInitialLoad,
  parallaxOffset,
}: HeroScenesProps) {
  const total = slides.length;
  const activeSlide = slides[activeIndex] ?? slides[0];
  const nextIndex = (activeIndex + 1) % total;

  const parallaxStyle = {
    "--hero-px": `${parallaxOffset.x.toFixed(2)}px`,
    "--hero-py": `${parallaxOffset.y.toFixed(2)}px`,
  } as React.CSSProperties;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={parallaxStyle}
    >
      {/* Camadas de Cenas (Slide Anterior em Saída, Slide Ativo e Preload do Próximo Slide) */}
      {slides.map((slide, idx) => {
        const isActive = idx === activeIndex;
        const isExiting = prevIndex !== null && idx === prevIndex && idx !== activeIndex;
        const isNextPreload = idx === nextIndex && !isActive && !isExiting;

        if (!isActive && !isExiting && !isNextPreload) {
          return null;
        }

        let animationClass = "";
        if (isActive) {
          if (isInitialLoad && prevIndex === null) {
            animationClass = "hero-scene-initial-enter z-10";
          } else {
            animationClass =
              direction === "next"
                ? "hero-scene-slide-enter-next z-10"
                : "hero-scene-slide-enter-prev z-10";
          }
        } else if (isExiting) {
          animationClass = "hero-scene-slide-exit z-0";
        } else {
          animationClass = "opacity-0 pointer-events-none -z-10";
        }

        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            data-slide-index={idx}
            data-slide-plan={slide.plan}
            data-slide-tone={slide.tone}
            className={`absolute inset-0 will-change-transform ${animationClass}`}
          >
            <div className="hero-parallax-layer w-full h-full">
              <ScenePicture
                slide={slide}
                isFirstSlide={idx === 0}
                eagerLoad={isActive || isNextPreload}
              />

              {/* Camada óptica complementar de Sombra de Contato & Reflexo em CSS (Plano B) */}
              {slide.plan === "B" && (
                <div
                  aria-hidden="true"
                  className="hero-plano-b-fx pointer-events-none absolute inset-0"
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Véu Local Suave (Apenas atrás da zona de texto: esquerda no desktop, base no celular) */}
      <div
        aria-hidden="true"
        className={`hero-veil-light absolute inset-0 z-20 transition-opacity duration-500 ease-out ${
          activeSlide.tone === "claro" ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden="true"
        className={`hero-veil-dark absolute inset-0 z-20 transition-opacity duration-500 ease-out ${
          activeSlide.tone === "escuro" ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Área clicável sobre o produto em cena -> leva à página do produto no catálogo */}
      <Link
        href={activeSlide.productHref}
        aria-label={`Ver produto ${activeSlide.productName}`}
        className="pointer-events-auto absolute z-20 left-[15%] right-[15%] top-[3%] bottom-[48%] md:left-[47%] md:right-[6%] md:top-[6%] md:bottom-[10%] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 focus-visible:ring-offset-2 cursor-pointer"
      >
        <span className="sr-only">{activeSlide.productName}</span>
      </Link>
    </div>
  );
}

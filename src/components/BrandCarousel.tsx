"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export interface BrandItem {
  name: string;
  slug: string;
  image: string;
  alt: string;
  tagline?: string;
}

export const OFFICIAL_BRANDS: BrandItem[] = [
  {
    name: "Madressenza",
    slug: "madressenza",
    image: "/brands/madressenza.webp",
    alt: "Madressenza — Curadoria Oficial Mariane Cosméticos",
  },
  {
    name: "Wella Profissional",
    slug: "wella-profissional",
    image: "/brands/wella-profissional.webp",
    alt: "Wella Profissional — Revendedora Oficial Mariane Cosméticos",
  },
  {
    name: "L'Oréal Professionnel",
    slug: "loreal-professionnel",
    image: "/brands/loreal-professionnel.webp",
    alt: "L'Oréal Professionnel — Revendedora Oficial Mariane Cosméticos",
  },
  {
    name: "Truss",
    slug: "truss",
    image: "/brands/truss.webp",
    alt: "Truss — Revendedora Oficial Mariane Cosméticos",
  },
  {
    name: "Braé",
    slug: "brae",
    image: "/brands/brae.webp",
    alt: "Braé — Revendedora Oficial Mariane Cosméticos",
  },
  {
    name: "Lola Cosmetics",
    slug: "lola-cosmetics",
    image: "/brands/lola-cosmetics.webp",
    alt: "Lola Cosmetics — Revendedora Oficial Mariane Cosméticos",
  },
  {
    name: "Amend",
    slug: "amend",
    image: "/brands/amend.webp",
    alt: "Amend — Revendedora Oficial Mariane Cosméticos",
  },
];

export default function BrandCarousel() {
  return (
    <section className="py-14 sm:py-20 bg-silk-50/70 border-b border-silk-200/80 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
        {/* Cabeçalho Editorial com Destaque de Curadoria */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold tracking-widest uppercase text-marina-700 bg-marina-50/80 px-3.5 py-1 rounded-full border border-marina-100/60 inline-flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3 h-3 text-marina-600" />
            Curadoria Oficial
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-[2.25rem] text-onyx-950 tracking-tight leading-tight">
            Marcas Profissionais &amp; Alta Perfumaria
          </h2>
          <p className="text-xs sm:text-sm text-onyx-600 mt-2 font-sans">
            Produtos 100% originais com procedência garantida de salão e difusores finos
          </p>
        </div>
      </div>

      {/* Carrossel Infinito em Loop Inteligente (Dual-Track com Pausa no Hover/Toque) */}
      <div className="relative w-full overflow-hidden select-none">
        {/* Style tag embutida garantindo execução imediata do loop em qualquer navegador */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes brandMarqueeLoop {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-50%, 0, 0); }
            }
            .brand-carousel-track {
              display: flex;
              width: max-content;
              animation: brandMarqueeLoop 24s linear infinite;
              will-change: transform;
            }
            .brand-carousel-track:hover,
            .brand-carousel-track:active,
            .brand-carousel-track:focus-within {
              animation-play-state: paused;
            }
          `
        }} />

        {/* Máscara de Degradê Lateral Esquerda */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#FAF7F7] via-[#FAF7F7]/80 to-transparent z-10" />

        {/* Máscara de Degradê Lateral Direita */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#FAF7F7] via-[#FAF7F7]/80 to-transparent z-10" />

        {/* Trilho Deslizante Infinito (Track 1 + Track 2 em 50% / 50% loop contínuo) */}
        <div className="brand-carousel-track animate-brand-marquee cursor-grab active:cursor-grabbing">
          {/* Primeiro Bloco de Marcas */}
          <div className="flex gap-4 sm:gap-6 pr-4 sm:pr-6 shrink-0">
            {OFFICIAL_BRANDS.map((b) => (
              <Link
                key={`brand-1-${b.slug}`}
                href={`/produtos?marca=${b.slug}`}
                title={b.name}
                className="group/card relative bg-[#FAF9F6] rounded-2xl border border-silk-200/90 hover:border-marina-500 hover:shadow-luxury-hover transition-all duration-300 w-[240px] sm:w-[300px] lg:w-[360px] aspect-[2/1] shrink-0 flex items-center justify-center overflow-hidden p-2.5 sm:p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500"
              >
                {/* Logo Ampliado preenchendo todo o card com nitidez e escala máxima */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={b.image}
                    alt={b.alt}
                    fill
                    sizes="(max-width: 640px) 240px, (max-width: 1024px) 300px, 360px"
                    className="object-contain p-1 sm:p-2 group-hover/card:scale-106 transition-transform duration-500 ease-out"
                    priority
                  />
                </div>
                <span className="sr-only">{b.name}</span>
              </Link>
            ))}
          </div>

          {/* Segundo Bloco Idêntico para Loop Perfeito Sem Cortes */}
          <div className="flex gap-4 sm:gap-6 pr-4 sm:pr-6 shrink-0" aria-hidden="true">
            {OFFICIAL_BRANDS.map((b) => (
              <Link
                key={`brand-2-${b.slug}`}
                href={`/produtos?marca=${b.slug}`}
                tabIndex={-1}
                title={b.name}
                className="group/card relative bg-[#FAF9F6] rounded-2xl border border-silk-200/90 hover:border-marina-500 hover:shadow-luxury-hover transition-all duration-300 w-[240px] sm:w-[300px] lg:w-[360px] aspect-[2/1] shrink-0 flex items-center justify-center overflow-hidden p-2.5 sm:p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500"
              >
                {/* Logo Ampliado preenchendo todo o card com nitidez e escala máxima */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={b.image}
                    alt={b.alt}
                    fill
                    sizes="(max-width: 640px) 240px, (max-width: 1024px) 300px, 360px"
                    className="object-contain p-1 sm:p-2 group-hover/card:scale-106 transition-transform duration-500 ease-out"
                  />
                </div>
                <span className="sr-only">{b.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

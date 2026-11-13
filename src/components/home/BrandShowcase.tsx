"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ALL_SHOWCASE_BRANDS,
  FEATURED_BRAND,
  INDEX_BRANDS,
  type ShowcaseBrand,
} from "@/data/brands";

const IVORY = "#FAF7FB";
const ONYX = "#1A0918";

function Logo({ brand, scale = 1, color }: { brand: ShowcaseBrand; scale?: number; color: string }) {
  const h = Math.round(brand.opticalHeight * scale);
  return (
    <span
      aria-hidden="true"
      className="bs-logo block shrink-0"
      style={{
        width: Math.round(h * brand.ratio),
        height: h,
        maxWidth: "78%",
        backgroundColor: color,
        WebkitMaskImage: `url(${brand.logo})`,
        maskImage: `url(${brand.logo})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

const veil = (tone: ShowcaseBrand["tone"]) =>
  tone === "escuro"
    ? "radial-gradient(ellipse at 50% 46%, rgba(10,4,12,.55) 0%, rgba(10,4,12,.15) 70%)"
    : "radial-gradient(ellipse at 50% 46%, rgba(250,247,251,.62) 0%, rgba(250,247,251,.12) 70%)";

const heroLogoColor = (tone: ShowcaseBrand["tone"]) => (tone === "escuro" ? IVORY : ONYX);

function Cta({ tone }: { tone: ShowcaseBrand["tone"] }) {
  return (
    <span
      className="inline-flex min-h-[28px] items-center gap-1.5 rounded-full px-3 text-[13px] font-medium tracking-[0.04em]"
      style={{
        color: heroLogoColor(tone),
        backgroundColor: tone === "escuro" ? "rgba(26,9,24,.72)" : "rgba(250,247,251,.88)",
      }}
    >
      Ver produtos <span aria-hidden="true">→</span>
    </span>
  );
}

function FeaturedPanel({ brand, index }: { brand: ShowcaseBrand; index: number }) {
  return (
    <Link
      href={brand.href}
      aria-label={`Ver produtos ${brand.name}`}
      className="bs-reveal group relative isolate block h-full min-h-[560px] overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marina-700"
      style={{ ["--i" as string]: index }}
    >
      <Image
        src={brand.scene}
        alt=""
        fill
        sizes="(min-width:1024px) 40vw, 100vw"
        className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <span aria-hidden="true" className="absolute inset-0" style={{ background: veil(brand.tone) }} />
      <span className="absolute left-[8%] top-[22%] flex w-[52%] flex-col items-start gap-5">
        <Logo brand={brand} color={ONYX} />
        <span>
          <Cta tone={brand.tone} />
        </span>
      </span>
    </Link>
  );
}

function IndexCell({ brand, index }: { brand: ShowcaseBrand; index: number }) {
  const dark = brand.tone === "escuro";
  return (
    <Link
      href={brand.href}
      aria-label={`Ver produtos ${brand.name}`}
      className="bs-reveal group relative isolate flex min-h-[280px] items-center justify-center overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-marina-700"
      style={{ ["--i" as string]: index }}
    >
      <Image
        src={brand.scene}
        alt=""
        fill
        sizes="(min-width:1024px) 20vw, 50vw"
        className="object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{ background: veil(brand.tone) }}
      />
      <span className="relative flex flex-col items-center gap-5">
        <span
          className="block opacity-[0.72] transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <span
            className={`block text-[#1A0918] transition-colors duration-500 ${
              dark ? "group-hover:text-[#FAF7FB] group-focus-visible:text-[#FAF7FB]" : ""
            }`}
          >
            <Logo brand={brand} color="currentColor" />
          </span>
        </span>
      </span>
      <span className="absolute inset-x-0 top-6 text-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
        <Cta tone={brand.tone} />
      </span>
    </Link>
  );
}

function MobileBrandGridCarousel() {
  const railRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const page1Top = INDEX_BRANDS.slice(0, 4); // Wella, L'Oréal, Truss, Braé
  const page2Brands = INDEX_BRANDS.slice(4, 6); // Lola, Amend

  const onScroll = () => {
    const el = railRef.current;
    if (!el || el.clientWidth === 0) return;
    setPage(Math.min(1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))));
  };

  const goToPage = (target: number) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
    setPage(target);
  };

  const renderBrandCard = (
    b: ShowcaseBrand,
    opts: { tall?: boolean; badge?: string; priority?: boolean } = {}
  ) => {
    const isDark = b.tone === "escuro";
    return (
      <Link
        key={b.slug}
        href={b.href}
        aria-label={`Ver produtos ${b.name}`}
        className={`relative isolate flex items-center justify-center rounded-2xl overflow-hidden border border-silk-200/80 transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marina-700 ${
          opts.tall ? "col-span-2 h-[130px]" : "h-[112px]"
        }`}
      >
        <Image
          src={b.scene}
          alt=""
          fill
          sizes={opts.tall ? "92vw" : "46vw"}
          priority={opts.priority}
          className="object-cover"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(18,10,13,.66) 0%, rgba(18,10,13,.46) 100%)"
              : "linear-gradient(to bottom, rgba(250,247,251,.84) 0%, rgba(250,247,251,.68) 100%)",
          }}
        />
        <span className="relative z-10 flex flex-col items-center justify-center gap-1.5 px-3 text-center">
          {opts.badge && (
            <span className="text-xs font-semibold text-marina-700 bg-white/90 px-2.5 py-0.5 rounded-full border border-marina-200/70">
              {opts.badge}
            </span>
          )}
          <Logo brand={b} scale={opts.tall ? 0.78 : 0.56} color={heroLogoColor(b.tone)} />
        </span>
      </Link>
    );
  };

  return (
    <div className="md:hidden">
      <div
        ref={railRef}
        onScroll={onScroll}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Marcas oficiais"
        className="bs-rail -mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-4"
      >
        {/* Página 1: 5 cards no padrão 2 + 2 + 1 (Madressenza em destaque) */}
        <div className="w-full shrink-0 snap-start grid grid-cols-2 gap-3">
          {page1Top.map((b, i) => renderBrandCard(b, { priority: i < 2 }))}
          {renderBrandCard(FEATURED_BRAND, {
            tall: true,
            badge: "Revendedora Oficial",
          })}
        </div>

        {/* Página 2: 4 cards no padrão 2 + 2 */}
        <div className="w-full shrink-0 snap-start grid grid-cols-2 gap-3">
          {page2Brands.map((b) => renderBrandCard(b))}
          <Link
            href="/produtos"
            className="h-[112px] rounded-2xl border border-marina-200/80 bg-marina-50 hover:bg-marina-100/70 text-marina-800 flex flex-col items-center justify-center gap-1 px-3 text-center transition-colors active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marina-700"
          >
            <span className="font-serif text-lg font-medium text-marina-800">
              Todas as marcas
            </span>
            <span className="text-xs font-semibold text-marina-700">
              Ver catálogo →
            </span>
          </Link>
          <Link
            href="/produtos?ordem=promocoes"
            className="h-[112px] rounded-2xl border border-onyx-800 bg-onyx-950 hover:bg-marina-900 text-white flex flex-col items-center justify-center gap-1 px-3 text-center transition-colors active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marina-700"
          >
            <span className="font-serif text-lg font-medium text-white">
              Promoções
            </span>
            <span className="text-xs font-medium text-marina-200">
              Ofertas da semana →
            </span>
          </Link>
        </div>
      </div>

      {/* Indicadores de página acessíveis */}
      <div className="mt-3 flex items-center justify-center gap-1" aria-label="Páginas de marcas">
        {[0, 1].map((idx) => {
          const active = page === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => goToPage(idx)}
              aria-label={`Página ${idx + 1} de 2`}
              aria-current={active ? "true" : undefined}
              className="min-h-[44px] min-w-[32px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded-full"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                  active ? "w-6 bg-marina-700" : "w-2 bg-silk-300"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TabletRail() {
  const railRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = railRef.current;
    if (!el || !el.firstElementChild) return;
    const card = el.firstElementChild as HTMLElement;
    const step = card.offsetWidth + 12;
    setActive(Math.min(ALL_SHOWCASE_BRANDS.length - 1, Math.round(el.scrollLeft / step)));
  };

  return (
    <div className="hidden md:block lg:hidden">
      <ul
        ref={railRef}
        onScroll={onScroll}
        className="bs-rail -mx-4 sm:-mx-8 lg:mx-0 flex snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-8 gap-2.5 md:gap-3 overflow-x-auto px-4 sm:px-8 pb-3"
        aria-label="Marcas, deslize para ver mais"
      >
        {ALL_SHOWCASE_BRANDS.map((b, i) => {
          const isFeatured = b.slug === "madressenza";
          return (
            <li
              key={b.slug}
              className="w-[39%] min-w-[138px] max-w-[164px] md:w-[44%] md:min-w-0 md:max-w-[330px] shrink-0 snap-start"
            >
              <Link
                href={b.href}
                aria-label={`Ver produtos ${b.name}`}
                className="relative isolate flex items-center justify-center h-[116px] md:block md:h-auto md:aspect-[4/5] rounded-2xl md:rounded-none overflow-hidden border border-silk-200/80 md:border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marina-700"
              >
                <Image
                  src={b.scene}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 40vw, 82vw"
                  priority={i === 0}
                  className="object-cover"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      b.tone === "escuro"
                        ? "linear-gradient(to bottom, rgba(10,4,12,.58) 0%, rgba(10,4,12,.34) 100%)"
                        : "linear-gradient(to bottom, rgba(250,247,251,.78) 0%, rgba(250,247,251,.48) 100%)",
                  }}
                />
                <span
                  className={
                    isFeatured
                      ? "relative z-10 flex items-center justify-center px-3 md:absolute md:left-[7%] md:top-[10%] md:w-[56%] md:flex-col md:items-start md:gap-3"
                      : "relative z-10 flex items-center justify-center px-3 md:absolute md:inset-x-5 md:top-[10%] md:flex-col md:items-center md:gap-3"
                  }
                >
                  <Logo brand={b} scale={isFeatured ? 0.56 : 0.62} color={heroLogoColor(b.tone)} />
                  <span className="hidden md:inline-flex">
                    <Cta tone={b.tone} />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
        {ALL_SHOWCASE_BRANDS.map((b, i) => (
          <span
            key={b.slug}
            className="h-px w-6 transition-colors duration-300"
            style={{ height: 2, backgroundColor: i === active ? ONYX : "#D9CDD4" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function BrandShowcase() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.setAttribute("data-armed", "");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.setAttribute("data-in", "");
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      aria-labelledby="marcas-titulo"
      className="brand-showcase bg-luxury-offwhite py-10 sm:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8">
        <div className="mb-5 sm:mb-10 lg:mb-14 flex items-baseline justify-between gap-4">
          <h2
            id="marcas-titulo"
            className="bs-reveal max-w-2xl font-serif text-[22px] font-normal leading-snug text-onyx-950 sm:text-4xl"
            style={{ ["--i" as string]: 0 }}
          >
            <span className="md:hidden">Marcas</span>
            <span className="hidden md:inline">
              Marcas Profissionais &amp; Alta Perfumaria
            </span>
          </h2>

          <Link
            href="/produtos"
            className="md:hidden inline-flex items-center min-h-[44px] text-[13px] font-semibold text-marina-700 hover:text-marina-900 shrink-0"
          >
            Ver todas →
          </Link>
        </div>

        <MobileBrandGridCarousel />

        <TabletRail />

        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="col-span-5">
            <FeaturedPanel brand={FEATURED_BRAND} index={1} />
          </div>
          <ul className="col-span-7 grid grid-cols-3 border-l border-t border-silk-200">
            {INDEX_BRANDS.map((b, i) => (
              <li key={b.slug} className="border-b border-r border-silk-200">
                <IndexCell brand={b} index={i + 2} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

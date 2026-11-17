"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FEATURED_BRAND,
  INDEX_BRANDS,
  type ShowcaseBrand,
} from "@/data/brands";

const IVORY = "#FAF7FB";
const ONYX = "#1A0918";

const heroLogoColor = (tone: ShowcaseBrand["tone"]) => (tone === "escuro" ? IVORY : ONYX);

function UnifiedBrandCard({
  brand,
  index,
  featured = false,
}: {
  brand: ShowcaseBrand;
  index: number;
  featured?: boolean;
}) {
  const isDark = brand.tone === "escuro";
  const mobileSrc = featured && brand.featuredScene ? brand.featuredScene : brand.scene;

  if (featured) {
    return (
      <Link
        href={brand.href}
        aria-label={`Ver produtos ${brand.name}`}
        className="bs-reveal bs-u-panel group"
        style={{ ["--i" as string]: index }}
      >
        <img
          src={mobileSrc}
          alt={brand.name}
          loading="eager"
          decoding="async"
          style={{ objectPosition: brand.objectPosition ?? "50% 60%" }}
          className="absolute inset-0 w-full h-full object-cover md:hidden"
        />
        <img
          src={brand.scene}
          alt=""
          loading="lazy"
          decoding="async"
          className="bs-panel-dimg"
        />
        <span
          aria-hidden="true"
          className={`bs-btm-grad ${isDark ? "bs-btm-dark" : "bs-btm-light"}`}
        />
        <span
          aria-hidden="true"
          className={`hidden md:block absolute inset-0 ${isDark ? "bs-veil-dark" : "bs-veil-light"}`}
        />
        <span className="bs-panel-badge">
          Revendedora Oficial
        </span>
        <span className="bs-m-btm">
          <span
            aria-hidden="true"
            className="bs-logo-bottom block shrink-0"
            style={{
              width: "64%",
              maxWidth: 220,
              height: 36,
              backgroundColor: heroLogoColor(brand.tone),
              WebkitMaskImage: `url(${brand.logo})`,
              maskImage: `url(${brand.logo})`,
            }}
          />
        </span>
        <span className="bs-panel-dlbl">
          <span
            aria-hidden="true"
            className="bs-logo block shrink-0"
            style={{
              width: brand.opticalHeight * brand.ratio,
              height: brand.opticalHeight,
              maxWidth: "78%",
              backgroundColor: ONYX,
              WebkitMaskImage: `url(${brand.logo})`,
              maskImage: `url(${brand.logo})`,
            }}
          />
          <span
            className="bs-u-cta"
            style={{
              color: heroLogoColor(brand.tone),
              backgroundColor: isDark ? "rgba(26,9,24,.72)" : "rgba(250,247,251,.88)",
            }}
          >
            Ver produtos <span aria-hidden="true">→</span>
          </span>
        </span>
      </Link>
    );
  }

  // Border hairline for 3x2 desktop grid (cells 0..5 correspond to grid positions)
  const lgBorders =
    index < 3
      ? index === 0
        ? "lg:border-t lg:border-l lg:border-b lg:border-r lg:border-silk-200"
        : "lg:border-t lg:border-b lg:border-r lg:border-silk-200"
      : index === 3
      ? "lg:border-l lg:border-b lg:border-r lg:border-silk-200"
      : "lg:border-b lg:border-r lg:border-silk-200";

  return (
    <Link
      href={brand.href}
      aria-label={`Ver produtos ${brand.name}`}
      className={`bs-reveal bs-u-cell group ${lgBorders}`}
      style={{ ["--i" as string]: index + 2 }}
    >
      <img
        src={brand.scene}
        alt={brand.name}
        loading="lazy"
        decoding="async"
        style={{ objectPosition: brand.objectPosition ?? "50% 60%" }}
        className="bs-cell-img"
      />
      <span
        aria-hidden="true"
        className={`bs-btm-grad ${isDark ? "bs-btm-dark" : "bs-btm-light"}`}
      />
      <span
        aria-hidden="true"
        className={`bs-cell-veil ${isDark ? "bs-veil-dark" : "bs-veil-light"}`}
      />
      <span className="bs-m-btm">
        <span
          aria-hidden="true"
          className="bs-logo-bottom block shrink-0"
          style={{
            width: "68%",
            maxWidth: 124,
            height: 38,
            backgroundColor: heroLogoColor(brand.tone),
            WebkitMaskImage: `url(${brand.logo})`,
            maskImage: `url(${brand.logo})`,
          }}
        />
      </span>
      <span className="bs-hover-lbl">
        <span className="bs-d-lbl">
          <span
            className={`block text-[#1A0918] transition-colors duration-500 ${
              isDark
                ? "md:text-[#FAF7FB] lg:text-[#1A0918] lg:group-hover:text-[#FAF7FB] lg:group-focus-visible:text-[#FAF7FB]"
                : ""
            }`}
          >
            <span
              aria-hidden="true"
              className="bs-logo block shrink-0"
              style={{
                width: Math.round(brand.opticalHeight * brand.ratio),
                height: brand.opticalHeight,
                maxWidth: "78%",
                backgroundColor: "currentColor",
                WebkitMaskImage: `url(${brand.logo})`,
                maskImage: `url(${brand.logo})`,
              }}
            />
          </span>
        </span>
      </span>
      <span className="bs-hover-cta">
        <span
          className="bs-u-cta"
          style={{
            color: heroLogoColor(brand.tone),
            backgroundColor: isDark ? "rgba(26,9,24,.72)" : "rgba(250,247,251,.88)",
          }}
        >
          Ver produtos <span aria-hidden="true">→</span>
        </span>
      </span>
    </Link>
  );
}

export default function BrandShowcase() {
  const ref = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const totalPages = 2;

  const page1Bottom = INDEX_BRANDS.slice(0, 2);
  const page2Brands = INDEX_BRANDS.slice(2, 6);

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
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onScroll = () => {
    const el = railRef.current;
    if (!el || el.clientWidth === 0) return;
    setPage(Math.min(totalPages - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))));
  };

  const goToPage = (target: number) => {
    const clamped = Math.min(totalPages - 1, Math.max(0, target));
    const el = railRef.current;
    if (!el) return;
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setPage(clamped);
  };

  return (
    <section
      ref={ref}
      aria-labelledby="marcas-titulo"
      className="brand-showcase bg-luxury-offwhite py-10 sm:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8">
        <div className="mb-5 sm:mb-10 lg:mb-14 flex items-baseline justify-between gap-4">
          <div>
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
            <p className="sec-sub">
              Revendedora oficial Madressenza e distribuidora autorizada Wella Professionals, L&apos;Oréal Professionnel, Truss, Braé, Lola Cosmetics e Amend com garantia de procedência.
            </p>
          </div>

          <Link
            href="/produtos"
            className="md:hidden inline-flex items-center min-h-[44px] text-[13px] font-semibold text-marina-700 hover:text-marina-900 shrink-0"
          >
            Ver todas →
          </Link>
        </div>

        {/* Único markup responsivo para as 7 marcas (2 páginas no mobile, trilho no tablet, grade 5+7 no desktop) */}
        <div
          ref={railRef}
          onScroll={onScroll}
          tabIndex={0}
          role="region"
          aria-roledescription="carrossel"
          aria-label="Marcas oficiais"
          className="bs-rail-wrap"
        >
          <div className="bs-m-page">
            <UnifiedBrandCard brand={FEATURED_BRAND} index={1} featured />
            {page1Bottom.map((b, i) => (
              <UnifiedBrandCard key={b.slug} brand={b} index={i} />
            ))}
          </div>
          <div className="bs-m-page">
            {page2Brands.map((b, i) => (
              <UnifiedBrandCard key={b.slug} brand={b} index={i + 2} />
            ))}
          </div>
        </div>

        <div className="md:hidden mt-3 flex items-center justify-center gap-3" aria-label="Páginas de marcas">
          <div className="flex items-center gap-1">
            {[0, 1].map((idx) => {
              const active = page === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToPage(idx)}
                  aria-label={`Página ${idx + 1} de ${totalPages}`}
                  aria-current={active ? "true" : undefined}
                  className="min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded-full"
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
          <span className="text-xs font-medium text-onyx-600 tabular-nums">
            {page + 1}/{totalPages}
          </span>
        </div>
      </div>
    </section>
  );
}

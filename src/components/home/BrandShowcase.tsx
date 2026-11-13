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

function MobileRail() {
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
    <div className="lg:hidden">
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
        <h2
          id="marcas-titulo"
          className="bs-reveal mb-5 sm:mb-10 max-w-2xl font-serif text-2xl font-normal leading-snug text-onyx-950 sm:text-4xl lg:mb-14"
          style={{ ["--i" as string]: 0 }}
        >
          Marcas Profissionais &amp; Alta Perfumaria
        </h2>

        <MobileRail />

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

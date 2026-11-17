"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProductCard, { type ProductCardProps } from "@/components/ProductCard";
import { SvgIcon } from "@/components/ui/SvgIcon";

export interface ProductShowcaseProps {
  products: ProductCardProps[];
}

interface FilterTab {
  id: string;
  label: string;
}

const BRAND_ORDER = [
  "Madressenza",
  "Wella Profissional",
  "L'Oréal Professionnel",
  "Truss",
  "Braé",
  "Lola Cosmetics",
  "Amend",
];

export default function ProductShowcase({ products }: ProductShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<string>("best_sellers");
  const [desktopPage, setDesktopPage] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);

  // Abas dinâmicas apenas para filtros/marcas com produtos reais carregados
  const tabs: FilterTab[] = useMemo(() => {
    const list: FilterTab[] = [
      { id: "best_sellers", label: "Mais Vendidos" },
      { id: "promos", label: "Promoções" },
      { id: "novidades", label: "Novidades" },
    ];

    const presentBrands = new Set(
      products.map((p) => p.brandName).filter((b): b is string => Boolean(b))
    );

    for (const brand of BRAND_ORDER) {
      if (presentBrands.has(brand)) {
        list.push({ id: `brand:${brand}`, label: brand });
      }
    }
    return list;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeTab === "best_sellers") {
      const best = products.filter((p) => p.isBestSeller === 1);
      return best.length > 0 ? best : products;
    }
    if (activeTab === "promos") {
      const promos = products.filter(
        (p) => typeof p.promoPrice === "number" && p.promoPrice > 0 && p.promoPrice < p.price
      );
      return promos.length > 0 ? promos : products;
    }
    if (activeTab === "novidades") {
      const feat = products.filter((p) => p.isFeatured === 1);
      return feat.length > 0 ? feat : products;
    }
    if (activeTab.startsWith("brand:")) {
      const brand = activeTab.slice(6);
      return products.filter((p) => p.brandName === brand);
    }
    return products;
  }, [products, activeTab]);

  // Reset paginação e scroll do trilho ao trocar aba
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setDesktopPage(0);
    setMobileIndex(0);
    if (railRef.current) {
      railRef.current.scrollTo({ left: 0, behavior: "auto" });
    }
  };

  // Navegação por teclado nas abas (ArrowLeft / ArrowRight)
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const nextIdx =
      e.key === "ArrowRight"
        ? (idx + 1) % tabs.length
        : (idx - 1 + tabs.length) % tabs.length;
    const nextTab = tabs[nextIdx];
    handleTabChange(nextTab.id);
    const btn = document.getElementById(`vitrine-tab-${nextTab.id}`);
    btn?.focus();
  };

  // Revelação sutil na rolagem (uma vez, respeitando prefers-reduced-motion)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.setAttribute("data-armed", "");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.setAttribute("data-in", "");
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const PAGE_SIZE = 4;
  const totalDesktopPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(desktopPage, totalDesktopPages - 1);

  const handleMobileScroll = () => {
    const el = railRef.current;
    if (!el || !el.firstElementChild) return;
    const card = el.firstElementChild as HTMLElement;
    const step = card.offsetWidth + 14;
    if (step <= 0) return;
    setMobileIndex(
      Math.min(filteredProducts.length - 1, Math.max(0, Math.round(el.scrollLeft / step)))
    );
  };

  const scrollToMobileIndex = (idx: number) => {
    const el = railRef.current;
    if (!el || !el.children[idx]) return;
    (el.children[idx] as HTMLElement).scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
    setMobileIndex(idx);
  };

  const catalogHref = activeTab.startsWith("brand:")
    ? `/produtos?marca=${encodeURIComponent(
        activeTab
          .slice(6)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      )}`
    : "/produtos?ordem=mais_vendidos";

  return (
    <section
      ref={sectionRef}
      aria-labelledby="vitrine-titulo"
      className="vitrine-showcase bg-luxury-offwhite py-10 sm:py-16 lg:py-20 border-b border-silk-200/80"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 sm:mb-8">
          <div>
            <h2
              id="vitrine-titulo"
              className="font-serif text-2xl font-normal sm:text-4xl sm:font-bold text-onyx-950 tracking-tight leading-snug"
            >
              Mais Vendidos e Destaques
            </h2>
            <p className="sec-sub">
              Seleção curada de cronograma capilar, máscaras, óleos e perfumaria Madressenza originais com lacre de fábrica, 5% OFF no PIX, até 10x sem juros no cartão e frete grátis acima de R$ 199 para todo o Brasil.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {totalDesktopPages > 1 && (
              <div className="flex items-center gap-2" aria-label="Paginação da vitrine">
                <button
                  type="button"
                  onClick={() => setDesktopPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  aria-label="Produtos anteriores"
                  className="v-page-btn"
                >
                  <SvgIcon name="chevron-left" className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-onyx-600 tabular-nums px-1">
                  {safePage + 1} / {totalDesktopPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDesktopPage((p) => Math.min(totalDesktopPages - 1, p + 1))
                  }
                  disabled={safePage >= totalDesktopPages - 1}
                  aria-label="Próximos produtos"
                  className="v-page-btn"
                >
                  <SvgIcon name="chevron-right" className="w-4 h-4" />
                </button>
              </div>
            )}

            <Link
              href={catalogHref}
              className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-marina-700 hover:text-marina-900 transition-colors min-h-[44px] px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded-lg"
            >
              <span>Ver Catálogo Completo</span>
              <SvgIcon name="arrow-right" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Abas de filtro (role="tablist") com fade lateral no mobile */}
        <div className="relative mb-5 sm:mb-8">
          <div
            role="tablist"
            aria-label="Filtrar produtos da vitrine"
            className="v-tab-scroll"
          >
            {tabs.map((tab, idx) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`vitrine-tab-${tab.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls="vitrine-painel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => handleTabChange(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={`v-tab ${selected ? "v-tab-on" : "v-tab-off"}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div
            aria-hidden="true"
            className="md:hidden pointer-events-none absolute inset-y-0 -right-4 w-10 bg-gradient-to-l from-luxury-offwhite to-transparent"
          />
        </div>

        {/* Painel único responsivo: trilho scroll-snap no mobile e grade 3/4 cols no tablet/desktop */}
        <div
          id="vitrine-painel"
          role="tabpanel"
          aria-labelledby={`vitrine-tab-${activeTab}`}
        >
          <div
            ref={railRef}
            onScroll={handleMobileScroll}
            role="region"
            aria-roledescription="carousel"
            aria-label="Produtos em destaque"
            className="v-rail snap-x snap-mandatory md:grid-cols-3 lg:grid-cols-4"
          >
            {filteredProducts.map((product, idx) => {
              const desktopStart = safePage * PAGE_SIZE;
              const desktopEnd = desktopStart + PAGE_SIZE;
              const isDesktopVisible = idx >= desktopStart && idx < desktopEnd;
              return (
                <div
                  key={product.id}
                  className={`w-[78%] shrink-0 snap-start vitrine-item md:w-auto ${
                    isDesktopVisible ? "" : "md:hidden"
                  }`}
                  style={{ ["--vi" as string]: Math.min(idx, 5) }}
                >
                  <ProductCard {...product} />
                </div>
              );
            })}
          </div>

          {/* Indicadores de posição do carrossel mobile */}
          {filteredProducts.length > 1 && (
            <div
              className="md:hidden mt-3 flex flex-wrap items-center justify-center gap-0.5"
              aria-label="Indicadores de posição da vitrine"
            >
              {filteredProducts.map((product, idx) => {
                const active = idx === mobileIndex;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => scrollToMobileIndex(idx)}
                    aria-label={`Ir para produto ${idx + 1} de ${filteredProducts.length}`}
                    aria-current={active ? "true" : undefined}
                    className="v-dot-btn"
                  >
                    <span
                      className={`v-dot-pill ${
                        active ? "w-6 bg-marina-700" : "w-2 bg-silk-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* CTA mobile no fim da seção */}
          <div className="md:hidden mt-3">
            <Link href={catalogHref} className="v-mobile-cta">
              <span>Ver Catálogo Completo</span>
              <SvgIcon name="arrow-right" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

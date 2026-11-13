"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProductCard, { type ProductCardProps } from "@/components/ProductCard";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

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
  const desktopItems = filteredProducts.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

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
          <h2
            id="vitrine-titulo"
            className="font-serif text-2xl font-normal sm:text-4xl sm:font-bold text-onyx-950 tracking-tight leading-snug"
          >
            Mais Vendidos &amp; Destaques
          </h2>

          <div className="hidden md:flex items-center gap-4">
            {totalDesktopPages > 1 && (
              <div className="flex items-center gap-2" aria-label="Paginação da vitrine">
                <button
                  type="button"
                  onClick={() => setDesktopPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  aria-label="Produtos anteriores"
                  className="min-h-[44px] min-w-[44px] rounded-full border border-silk-200 bg-white text-onyx-900 hover:border-marina-400 hover:text-marina-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
                >
                  <ChevronLeft className="w-4 h-4" />
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
                  className="min-h-[44px] min-w-[44px] rounded-full border border-silk-200 bg-white text-onyx-900 hover:border-marina-400 hover:text-marina-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <Link
              href={catalogHref}
              className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-marina-700 hover:text-marina-900 transition-colors min-h-[44px] px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded-lg"
            >
              <span>Ver Catálogo Completo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Abas de filtro (role="tablist") com fade lateral no mobile */}
        <div className="relative mb-5 sm:mb-8">
          <div
            role="tablist"
            aria-label="Filtrar produtos da vitrine"
            className="bs-rail -mx-4 px-4 pr-10 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto pb-1.5"
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
                  className={`shrink-0 min-h-[44px] px-4 rounded-full text-xs sm:text-[13px] font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2 ${
                    selected
                      ? "bg-marina-700 text-white shadow-xs"
                      : "bg-white text-onyx-800 border border-silk-200 hover:border-marina-400 hover:text-marina-800"
                  }`}
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

        {/* Painel da vitrine */}
        <div
          id="vitrine-painel"
          role="tabpanel"
          aria-labelledby={`vitrine-tab-${activeTab}`}
        >
          {/* Mobile: Carrossel horizontal com scroll-snap (~78% do card visível, mostrando o próximo) */}
          <div className="md:hidden">
            <div
              ref={railRef}
              onScroll={handleMobileScroll}
              role="region"
              aria-roledescription="carousel"
              aria-label="Produtos em destaque"
              className="bs-rail -mx-4 px-4 flex gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-pl-4 pb-2"
            >
              {filteredProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="w-[78%] shrink-0 snap-start vitrine-item"
                  style={{ ["--vi" as string]: Math.min(idx, 5) }}
                >
                  <ProductCard {...product} />
                </div>
              ))}
            </div>

            {/* Indicadores de posição do carrossel mobile */}
            {filteredProducts.length > 1 && (
              <div
                className="mt-3 flex items-center justify-center gap-1"
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
                      className="min-h-[44px] min-w-[28px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded-full"
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
            )}

            {/* CTA mobile no fim da seção */}
            <div className="mt-3">
              <Link
                href={catalogHref}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full border border-marina-700/30 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-marina-700 hover:bg-marina-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
              >
                <span>Ver Catálogo Completo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Desktop / Tablet: Grade responsiva (3 cols md, 4 cols lg) */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
            {desktopItems.map((product, idx) => (
              <div
                key={product.id}
                className="vitrine-item"
                style={{ ["--vi" as string]: idx }}
              >
                <ProductCard {...product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

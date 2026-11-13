"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X, Check, ArrowUpDown } from "lucide-react";

interface OptionItem {
  slug: string;
  name: string;
}

interface PriceOption {
  key: string;
  label: string;
}

interface SortOption {
  key: string;
  label: string;
}

interface MobileCatalogControlsProps {
  basePath: string;
  currentQueryMap: Record<string, string | undefined>;
  allCategories?: OptionItem[];
  allBrands: OptionItem[];
  priceRanges: PriceOption[];
  sortOptions: SortOption[];
  selectedCategory?: string;
  selectedBrand?: string;
  selectedPrice?: string;
  selectedSort: string;
  hasActiveFilters: boolean;
}

function buildHref(
  basePath: string,
  currentQueryMap: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
): string {
  const merged: Record<string, string | undefined> = {
    ...currentQueryMap,
    ...overrides,
    pagina: undefined,
    page: undefined,
  };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v && v.trim() !== "") {
      params.set(k, v);
    }
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function MobileCatalogControls({
  basePath,
  currentQueryMap,
  allCategories,
  allBrands,
  priceRanges,
  sortOptions,
  selectedCategory,
  selectedBrand,
  selectedPrice,
  selectedSort,
  hasActiveFilters,
}: MobileCatalogControlsProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextHref = buildHref(basePath, currentQueryMap, { ordem: e.target.value });
    router.push(nextHref);
  };

  return (
    <>
      {/* Barra sticky mobile: Filtrar (bottom sheet) + Ordenar (select nativo) */}
      <div className="md:hidden sticky top-0 z-20 -mx-4 px-4 py-2.5 bg-silk-50/95 backdrop-blur-md border-y border-silk-200 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex-1 min-h-[44px] px-4 rounded-xl bg-white border border-silk-300 text-onyx-950 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
        >
          <SlidersHorizontal className="w-4 h-4 text-marina-600" aria-hidden="true" />
          <span>Filtrar</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-marina-600" aria-label="Filtros ativos" />
          )}
        </button>

        <div className="relative flex-1">
          <label htmlFor="mobile-catalog-sort" className="sr-only">
            Ordenar produtos
          </label>
          <ArrowUpDown
            className="w-3.5 h-3.5 text-onyx-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <select
            id="mobile-catalog-sort"
            value={selectedSort}
            onChange={handleSortChange}
            className="w-full min-h-[44px] pl-8 pr-4 rounded-xl bg-white border border-silk-300 text-onyx-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-marina-600"
          >
            {sortOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Sheet de Filtros no Mobile */}
      {sheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros do catálogo"
        >
          <div
            className="fixed inset-0 bg-onyx-950/50 backdrop-blur-[2px]"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 bg-white rounded-t-3xl max-h-[82dvh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 h-14 border-b border-silk-200 shrink-0">
              <span className="font-serif text-lg font-medium text-onyx-950">Filtrar Catálogo</span>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Fechar filtros"
                className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-onyx-700 hover:text-onyx-950 rounded-full hover:bg-silk-100 cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
              {allCategories && allCategories.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-onyx-700 block">
                    Categorias
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={buildHref(basePath, currentQueryMap, { categoria: undefined })}
                      onClick={() => setSheetOpen(false)}
                      className={`min-h-[40px] px-3.5 rounded-full text-xs font-medium inline-flex items-center border ${
                        !selectedCategory
                          ? "bg-marina-600 text-white border-marina-600"
                          : "bg-white text-onyx-800 border-silk-200"
                      }`}
                    >
                      Todas
                    </Link>
                    {allCategories.map((c) => {
                      const active = selectedCategory === c.slug;
                      return (
                        <Link
                          key={c.slug}
                          href={buildHref(basePath, currentQueryMap, {
                            categoria: active ? undefined : c.slug,
                          })}
                          onClick={() => setSheetOpen(false)}
                          className={`min-h-[40px] px-3.5 rounded-full text-xs font-medium inline-flex items-center gap-1 border ${
                            active
                              ? "bg-marina-600 text-white border-marina-600"
                              : "bg-white text-onyx-800 border-silk-200"
                          }`}
                        >
                          {active && <Check className="w-3.5 h-3.5" />}
                          <span>{c.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-3 border-t border-silk-100">
                <span className="text-xs font-bold uppercase tracking-wider text-onyx-700 block">
                  Marcas Oficiais
                </span>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={buildHref(basePath, currentQueryMap, { marca: undefined })}
                    onClick={() => setSheetOpen(false)}
                    className={`min-h-[40px] px-3.5 rounded-full text-xs font-medium inline-flex items-center border ${
                      !selectedBrand
                        ? "bg-onyx-950 text-white border-onyx-950"
                        : "bg-white text-onyx-800 border-silk-200"
                    }`}
                  >
                    Todas
                  </Link>
                  {allBrands.map((b) => {
                    const active = selectedBrand === b.slug;
                    return (
                      <Link
                        key={b.slug}
                        href={buildHref(basePath, currentQueryMap, {
                          marca: active ? undefined : b.slug,
                        })}
                        onClick={() => setSheetOpen(false)}
                        className={`min-h-[40px] px-3.5 rounded-full text-xs font-medium inline-flex items-center gap-1 border ${
                          active
                            ? "bg-onyx-950 text-white border-onyx-950"
                            : "bg-white text-onyx-800 border-silk-200"
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5" />}
                        <span>{b.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-silk-100">
                <span className="text-xs font-bold uppercase tracking-wider text-onyx-700 block">
                  Faixa de Preço
                </span>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((r) => {
                    const active = (selectedPrice || "") === r.key;
                    return (
                      <Link
                        key={r.key || "all"}
                        href={buildHref(basePath, currentQueryMap, {
                          preco: r.key || undefined,
                          minPrice: undefined,
                          maxPrice: undefined,
                        })}
                        onClick={() => setSheetOpen(false)}
                        className={`min-h-[40px] px-3.5 rounded-full text-xs font-medium inline-flex items-center border ${
                          active
                            ? "bg-marina-100 text-marina-800 border-marina-400 font-semibold"
                            : "bg-white text-onyx-800 border-silk-200"
                        }`}
                      >
                        {r.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-silk-200 bg-silk-50 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center gap-2.5 shrink-0">
              {hasActiveFilters && (
                <Link
                  href={basePath}
                  onClick={() => setSheetOpen(false)}
                  className="min-h-[44px] px-4 rounded-full border border-silk-300 bg-white text-onyx-800 text-xs font-semibold inline-flex items-center justify-center"
                >
                  Limpar
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 min-h-[44px] rounded-full bg-marina-600 text-white text-sm font-semibold cursor-pointer"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

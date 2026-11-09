import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import {
  queryCatalogProducts,
  parsePriceRange,
  buildCatalogUrl,
} from "@/lib/catalog";
import { ShoppingBag, Search, X, ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown, Check } from "lucide-react";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Catálogo de Produtos Profissionais & Perfumaria",
  description:
    "Explore o catálogo oficial da Mariane Cosméticos em Lages – SC: Madressenza, Wella Professionals, Truss, Braé, L'Oréal Professionnel, Lola Cosmetics e Amend com 5% OFF no PIX.",
  alternates: {
    canonical: "/produtos",
  },
};

interface Props {
  searchParams: Promise<{
    q?: string;
    marca?: string;
    categoria?: string;
    preco?: string;
    minPrice?: string;
    maxPrice?: string;
    ordem?: string;
    pagina?: string;
    page?: string;
  }>;
}

const PRICE_RANGES = [
  { key: "", label: "Qualquer preço" },
  { key: "ate-100", label: "Até R$ 100" },
  { key: "100-200", label: "R$ 100 a R$ 200" },
  { key: "acima-200", label: "Acima de R$ 200" },
];

const SORT_OPTIONS = [
  { key: "destaques", label: "Destaques" },
  { key: "mais_vendidos", label: "Mais Vendidos" },
  { key: "menor_preco", label: "Menor Preço" },
  { key: "maior_preco", label: "Maior Preço" },
];

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const brandSlug = params.marca || "";
  const catSlug = params.categoria || "";
  const priceKey = params.preco || "";
  const sort = params.ordem || "destaques";
  const pageNum = Math.max(
    1,
    parseInt(params.pagina || params.page || "1", 10) || 1
  );

  const { minPrice, maxPrice } = parsePriceRange(
    priceKey,
    params.minPrice,
    params.maxPrice
  );

  const {
    items: filtered,
    totalCount,
    totalPages,
    currentPage,
    allBrands,
    allCategories,
    brandObj,
    catObj,
  } = await queryCatalogProducts({
    q,
    marca: brandSlug,
    categoria: catSlug,
    preco: priceKey,
    minPrice,
    maxPrice,
    ordem: sort,
    pagina: pageNum,
    limit: 12,
  });

  const currentQueryMap: Record<string, string | undefined> = {
    q: q || undefined,
    marca: brandSlug || undefined,
    categoria: catSlug || undefined,
    preco: priceKey || undefined,
    minPrice: params.minPrice || undefined,
    maxPrice: params.maxPrice || undefined,
    ordem: sort !== "destaques" ? sort : undefined,
    pagina: currentPage > 1 ? String(currentPage) : undefined,
  };

  const hasActiveFilters = Boolean(
    q || brandSlug || catSlug || priceKey || params.minPrice || params.maxPrice
  );

  const sidebarContent = (
    <div className="space-y-6">
      {/* Header do Menu Lateral */}
      <div className="flex items-center justify-between pb-3 border-b border-silk-100">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-onyx-950">
          <SlidersHorizontal className="w-4 h-4 text-marina-600" />
          <span>Filtros do Catálogo</span>
        </div>
        {hasActiveFilters && (
          <Link
            href="/produtos"
            className="text-[11px] text-marina-600 hover:text-marina-800 font-semibold underline"
          >
            Limpar Filtros
          </Link>
        )}
      </div>

      {/* 1. Categorias */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-onyx-800 block">
          Categoria
        </span>
        <ul className="space-y-1 text-xs">
          <li>
            <Link
              href={buildCatalogUrl("/produtos", currentQueryMap, {
                categoria: undefined,
              })}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                !catSlug
                  ? "bg-marina-50 text-marina-700 font-bold border-l-3 border-marina-600"
                  : "text-onyx-700 hover:text-marina-700 hover:bg-silk-50"
              }`}
            >
              <span>Todas as Categorias</span>
              {!catSlug && <Check className="w-3.5 h-3.5 text-marina-600" />}
            </Link>
          </li>
          {allCategories.map((c) => {
            const isSelected = catSlug === c.slug;
            return (
              <li key={c.slug}>
                <Link
                  href={buildCatalogUrl("/produtos", currentQueryMap, {
                    categoria: isSelected ? undefined : c.slug,
                  })}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-marina-50 text-marina-700 font-bold border-l-3 border-marina-600"
                      : "text-onyx-700 hover:text-marina-700 hover:bg-silk-50"
                  }`}
                >
                  <span>{c.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-marina-600" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 2. Marcas Oficiais */}
      <div className="space-y-2 pt-4 border-t border-silk-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-onyx-800 block">
          Marca Oficial
        </span>
        <ul className="space-y-1 text-xs">
          <li>
            <Link
              href={buildCatalogUrl("/produtos", currentQueryMap, {
                marca: undefined,
              })}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                !brandSlug
                  ? "bg-onyx-900 text-white font-bold"
                  : "text-onyx-700 hover:text-onyx-950 hover:bg-silk-50"
              }`}
            >
              <span>Todas as Marcas</span>
              {!brandSlug && <Check className="w-3.5 h-3.5 text-white" />}
            </Link>
          </li>
          {allBrands.map((b) => {
            const isSelected = brandSlug === b.slug;
            return (
              <li key={b.slug}>
                <Link
                  href={buildCatalogUrl("/produtos", currentQueryMap, {
                    marca: isSelected ? undefined : b.slug,
                  })}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-onyx-900 text-white font-bold"
                      : "text-onyx-700 hover:text-onyx-950 hover:bg-silk-50"
                  }`}
                >
                  <span>{b.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 3. Faixa de Preço */}
      <div className="space-y-2 pt-4 border-t border-silk-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-onyx-800 block">
          Faixa de Preço
        </span>
        <ul className="space-y-1 text-xs">
          {PRICE_RANGES.map((range) => {
            const isSelected = priceKey === range.key;
            return (
              <li key={range.key || "all"}>
                <Link
                  href={buildCatalogUrl("/produtos", currentQueryMap, {
                    preco: range.key || undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                  })}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-marina-100 text-marina-800 font-bold border border-marina-300"
                      : "text-onyx-700 hover:text-marina-700 hover:bg-silk-50"
                  }`}
                >
                  <span>{range.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-marina-700" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 4. Ordenar por */}
      <div className="space-y-2 pt-4 border-t border-silk-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-onyx-800 block">
          Ordenar por
        </span>
        <ul className="space-y-1 text-xs">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = sort === opt.key;
            return (
              <li key={opt.key}>
                <Link
                  href={buildCatalogUrl("/produtos", currentQueryMap, {
                    ordem: opt.key,
                  })}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-onyx-900 text-white font-bold"
                      : "text-onyx-700 hover:text-onyx-950 hover:bg-silk-50"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
      {/* Cabeçalho + Busca Direta */}
      <div className="border-b border-silk-200/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest uppercase text-marina-600 block mb-1">
            {brandObj
              ? brandObj.name
              : catObj
              ? catObj.name
              : "Catálogo Oficial Mariane Cosméticos"}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-onyx-900 tracking-tight">
            {q
              ? `Resultados para "${q}"`
              : brandObj && catObj
              ? `${catObj.name} — ${brandObj.name}`
              : brandObj
              ? brandObj.name
              : catObj
              ? catObj.name
              : "Todos os Produtos"}
          </h1>
          <p className="text-xs text-onyx-700 mt-1">
            Exibindo {filtered.length} de {totalCount}{" "}
            {totalCount === 1 ? "produto encontrado" : "produtos encontrados"}
            {totalPages > 1 ? ` (Página ${currentPage} de ${totalPages})` : ""}
          </p>
        </div>

        {/* Formulário de Busca Direta na Página (Server-side GET) */}
        <form
          action="/produtos"
          method="GET"
          className="flex items-center gap-2 w-full md:w-auto"
        >
          {brandSlug && <input type="hidden" name="marca" value={brandSlug} />}
          {catSlug && <input type="hidden" name="categoria" value={catSlug} />}
          {priceKey && <input type="hidden" name="preco" value={priceKey} />}
          {params.minPrice && (
            <input type="hidden" name="minPrice" value={params.minPrice} />
          )}
          {params.maxPrice && (
            <input type="hidden" name="maxPrice" value={params.maxPrice} />
          )}
          {sort !== "destaques" && (
            <input type="hidden" name="ordem" value={sort} />
          )}
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar no catálogo..."
              aria-label="Buscar produtos no catálogo"
              className="w-full bg-white border border-silk-200 focus:border-marina-500 rounded-full py-2 pl-9 pr-4 text-xs text-onyx-900 placeholder-onyx-700/50 focus:outline-none focus:ring-2 focus:ring-marina-200"
            />
            <Search className="w-3.5 h-3.5 text-onyx-700/50 absolute left-3.5 top-2.5 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="bg-marina-600 hover:bg-marina-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Layout Principal: Menu Lateral Esquerdo + Grid de Produtos */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Menu Lateral Esquerdo (Filtros Organizados para Visualizar Tudo) */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0">
          {/* Mobile Accordion para Telas Menores */}
          <div className="lg:hidden mb-4">
            <details className="bg-white rounded-2xl border border-silk-200/90 shadow-xs overflow-hidden group">
              <summary className="p-4 flex items-center justify-between cursor-pointer font-bold text-xs uppercase tracking-wider text-onyx-900 select-none">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-marina-600" />
                  <span>Filtrar &amp; Ordenar Catálogo</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-marina-500" />
                  )}
                </span>
                <ChevronDown className="w-4 h-4 text-onyx-500 group-open:rotate-180 transition-transform duration-200" />
              </summary>
              <div className="p-4 pt-0 border-t border-silk-100">
                {sidebarContent}
              </div>
            </details>
          </div>

          {/* Desktop Sidebar Fixa e Sempre Visível */}
          <div className="hidden lg:block bg-white rounded-2xl border border-silk-200/90 p-5 shadow-xs sticky top-28">
            {sidebarContent}
          </div>
        </aside>

        {/* Coluna da Direita: Chips Ativos + Grid de Produtos + Paginação */}
        <main className="flex-1 w-full space-y-6">
          {/* Chips de Filtros Ativos no Topo dos Produtos */}
          {hasActiveFilters && (
            <div className="bg-white p-3.5 rounded-xl border border-silk-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-onyx-700 font-medium">Filtros ativos:</span>
              {q && (
                <Link
                  href={buildCatalogUrl("/produtos", currentQueryMap, {
                    q: undefined,
                  })}
                  className="inline-flex items-center gap-1 bg-marina-50 text-marina-800 border border-marina-200 px-2.5 py-1 rounded-full hover:bg-marina-100 transition-colors"
                >
                  <span>Busca: &quot;{q}&quot;</span>
                  <X className="w-3 h-3" />
                </Link>
              )}
              {catObj && (
                <Link
                  href={buildCatalogUrl("/produtos", currentQueryMap, {
                    categoria: undefined,
                  })}
                  className="inline-flex items-center gap-1 bg-marina-50 text-marina-800 border border-marina-200 px-2.5 py-1 rounded-full hover:bg-marina-100 transition-colors"
                >
                  <span>Categoria: {catObj.name}</span>
                  <X className="w-3 h-3" />
                </Link>
              )}
              {brandObj && (
                <Link
                  href={buildCatalogUrl("/produtos", currentQueryMap, {
                    marca: undefined,
                  })}
                  className="inline-flex items-center gap-1 bg-marina-50 text-marina-800 border border-marina-200 px-2.5 py-1 rounded-full hover:bg-marina-100 transition-colors"
                >
                  <span>Marca: {brandObj.name}</span>
                  <X className="w-3 h-3" />
                </Link>
              )}
              {(priceKey || params.minPrice || params.maxPrice) && (
                <Link
                  href={buildCatalogUrl("/produtos", currentQueryMap, {
                    preco: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                  })}
                  className="inline-flex items-center gap-1 bg-marina-50 text-marina-800 border border-marina-200 px-2.5 py-1 rounded-full hover:bg-marina-100 transition-colors"
                >
                  <span>
                    Preço:{" "}
                    {priceKey
                      ? PRICE_RANGES.find((r) => r.key === priceKey)?.label ||
                        priceKey
                      : `R$ ${minPrice ?? 0} a R$ ${maxPrice ?? "∞"}`}
                  </span>
                  <X className="w-3 h-3" />
                </Link>
              )}
              <Link
                href="/produtos"
                className="text-marina-600 hover:text-marina-800 font-semibold underline ml-2"
              >
                Limpar Filtros
              </Link>
            </div>
          )}

          {/* Grid de Produtos ou Estado Vazio */}
          {filtered.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-silk-200 p-8">
              <ShoppingBag className="w-10 h-10 text-marina-500 mx-auto" />
              <h2 className="font-serif text-xl text-onyx-900">
                Nenhum produto encontrado
              </h2>
              <p className="text-xs text-onyx-700 max-w-sm mx-auto leading-relaxed">
                Tente buscar por termos mais genéricos como &quot;Madressenza&quot;,
                &quot;Wella&quot;, &quot;Shampoo&quot;, &quot;Máscara&quot; ou limpe
                os filtros selecionados.
              </p>
              <Link
                href="/produtos"
                className="inline-block bg-onyx-900 text-marina-200 px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-marina-600 hover:text-white transition-colors"
              >
                Limpar Filtros
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {/* Paginação Resolvida no Servidor */}
              {totalPages > 1 && (
                <nav
                  aria-label="Paginação do catálogo"
                  className="pt-8 border-t border-silk-200 flex items-center justify-center gap-2"
                >
                  {currentPage > 1 && (
                    <Link
                      href={buildCatalogUrl("/produtos", currentQueryMap, {
                        pagina: String(currentPage - 1),
                      })}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-silk-200 bg-white text-xs font-semibold text-onyx-800 hover:border-marina-400 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior</span>
                    </Link>
                  )}

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Link
                          key={page}
                          href={buildCatalogUrl("/produtos", currentQueryMap, {
                            pagina: String(page),
                          })}
                          aria-current={page === currentPage ? "page" : undefined}
                          className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center border transition-all ${
                            page === currentPage
                              ? "bg-marina-600 text-white border-marina-600 shadow-sm"
                              : "bg-white text-onyx-800 border-silk-200 hover:border-marina-300"
                          }`}
                        >
                          {page}
                        </Link>
                      )
                    )}
                  </div>

                  {currentPage < totalPages && (
                    <Link
                      href={buildCatalogUrl("/produtos", currentQueryMap, {
                        pagina: String(currentPage + 1),
                      })}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-silk-200 bg-white text-xs font-semibold text-onyx-800 hover:border-marina-400 transition-colors"
                    >
                      <span>Próxima</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

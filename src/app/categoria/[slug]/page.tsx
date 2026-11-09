import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, categories } from "@/db";
import { eq } from "drizzle-orm";
import ProductCard from "@/components/ProductCard";
import {
  queryCatalogProducts,
  parsePriceRange,
  buildCatalogUrl,
} from "@/lib/catalog";
import { ShoppingBag, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    marca?: string;
    preco?: string;
    minPrice?: string;
    maxPrice?: string;
    ordem?: string;
    pagina?: string;
    page?: string;
    q?: string;
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const catList = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (catList.length === 0) {
    return {
      title: "Categoria não encontrada | Mariane Cosméticos",
    };
  }

  const category = catList[0];
  return {
    title: `${category.name} — Catálogo Oficial`,
    description: `Compre ${category.name} na Mariane Cosméticos em Lages – SC. Produtos 100% originais com 5% OFF no PIX, até 10x sem juros e frete grátis acima de R$ 199.`,
    alternates: {
      canonical: `/categoria/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} | Mariane Cosméticos`,
      description: `Curadoria oficial em ${category.name} na Mariane Cosméticos — Rua Blumenau, Nº 623, Lages – SC.`,
      url: `https://marianecosmeticos.com.br/categoria/${category.slug}`,
      siteName: "Mariane Cosméticos",
      locale: "pt_BR",
      type: "website",
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};

  const catList = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (catList.length === 0) {
    notFound();
  }

  const category = catList[0];
  const brandSlug = resolvedSearch.marca || "";
  const priceKey = resolvedSearch.preco || "";
  const sort = resolvedSearch.ordem || "destaques";
  const q = resolvedSearch.q?.trim() || "";
  const pageNum = Math.max(
    1,
    parseInt(resolvedSearch.pagina || resolvedSearch.page || "1", 10) || 1
  );

  const { minPrice, maxPrice } = parsePriceRange(
    priceKey,
    resolvedSearch.minPrice,
    resolvedSearch.maxPrice
  );

  const {
    items: categoryProducts,
    totalCount,
    totalPages,
    currentPage,
    allBrands,
    allCategories,
    brandObj,
  } = await queryCatalogProducts({
    categoria: slug,
    marca: brandSlug,
    preco: priceKey,
    minPrice,
    maxPrice,
    ordem: sort,
    q,
    pagina: pageNum,
    limit: 12,
  });

  const basePath = `/categoria/${slug}`;
  const currentQueryMap: Record<string, string | undefined> = {
    marca: brandSlug || undefined,
    preco: priceKey || undefined,
    minPrice: resolvedSearch.minPrice || undefined,
    maxPrice: resolvedSearch.maxPrice || undefined,
    ordem: sort !== "destaques" ? sort : undefined,
    q: q || undefined,
    pagina: currentPage > 1 ? String(currentPage) : undefined,
  };

  const hasActiveFilters = Boolean(
    q || brandSlug || priceKey || resolvedSearch.minPrice || resolvedSearch.maxPrice
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb & Header */}
      <div className="border-b border-silk-200 pb-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="text-xs text-onyx-700 flex items-center gap-2 mb-3"
            >
              <Link href="/" className="hover:text-marina-600">
                Home
              </Link>
              <span>/</span>
              <Link href="/produtos" className="hover:text-marina-600">
                Catálogo
              </Link>
              <span>/</span>
              <span className="text-onyx-900 font-semibold">{category.name}</span>
            </nav>
            <h1 className="font-serif text-3xl sm:text-4xl text-onyx-900 tracking-tight">
              {category.name}
            </h1>
            <p className="text-xs text-onyx-700 mt-1">
              {totalCount}{" "}
              {totalCount === 1 ? "produto disponível" : "produtos disponíveis"}
              {totalPages > 1 ? ` (Página ${currentPage} de ${totalPages})` : ""}
            </p>
          </div>

          {/* Busca dentro da Categoria */}
          <form
            action={basePath}
            method="GET"
            className="flex items-center gap-2 w-full lg:w-auto"
          >
            {brandSlug && <input type="hidden" name="marca" value={brandSlug} />}
            {priceKey && <input type="hidden" name="preco" value={priceKey} />}
            {resolvedSearch.minPrice && (
              <input type="hidden" name="minPrice" value={resolvedSearch.minPrice} />
            )}
            {resolvedSearch.maxPrice && (
              <input type="hidden" name="maxPrice" value={resolvedSearch.maxPrice} />
            )}
            {sort !== "destaques" && (
              <input type="hidden" name="ordem" value={sort} />
            )}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder={`Buscar em ${category.name}...`}
                aria-label={`Buscar produtos em ${category.name}`}
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

        {/* Navegação Rápida entre Categorias */}
        <div className="flex flex-wrap gap-2 text-xs">
          {allCategories.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className={`px-3.5 py-1.5 rounded-full border transition-all ${
                c.slug === slug
                  ? "bg-marina-600 text-white border-marina-600 font-semibold"
                  : "bg-white text-onyx-800 border-silk-200 hover:border-marina-300"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Filtros de Marca, Faixa de Preço e Ordenação */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-silk-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-onyx-700 mr-1">
              Marca:
            </span>
            <Link
              href={buildCatalogUrl(basePath, currentQueryMap, {
                marca: undefined,
              })}
              className={`px-3 py-1 rounded-full border transition-all ${
                !brandSlug
                  ? "bg-onyx-900 text-marina-200 border-onyx-900 font-semibold"
                  : "bg-white text-onyx-800 border-silk-200 hover:border-marina-300"
              }`}
            >
              Todas
            </Link>
            {allBrands.map((b) => (
              <Link
                key={b.slug}
                href={buildCatalogUrl(basePath, currentQueryMap, {
                  marca: brandSlug === b.slug ? undefined : b.slug,
                })}
                className={`px-3 py-1 rounded-full border transition-all ${
                  brandSlug === b.slug
                    ? "bg-onyx-900 text-marina-200 border-onyx-900 font-semibold"
                    : "bg-white text-onyx-800 border-silk-200 hover:border-marina-300"
                }`}
              >
                {b.name}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-silk-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-onyx-700 mr-1">
                Faixa de Preço:
              </span>
              {PRICE_RANGES.map((range) => (
                <Link
                  key={range.key || "all"}
                  href={buildCatalogUrl(basePath, currentQueryMap, {
                    preco: range.key || undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                  })}
                  className={`px-3 py-1 rounded-full border transition-all ${
                    priceKey === range.key
                      ? "bg-marina-100 text-marina-800 border-marina-300 font-semibold"
                      : "bg-white text-onyx-700 border-silk-200 hover:border-marina-300"
                  }`}
                >
                  {range.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-onyx-700 mr-1">
                Ordenar:
              </span>
              {SORT_OPTIONS.map((opt) => (
                <Link
                  key={opt.key}
                  href={buildCatalogUrl(basePath, currentQueryMap, {
                    ordem: opt.key,
                  })}
                  className={`px-3 py-1 rounded-full border transition-all ${
                    sort === opt.key
                      ? "bg-onyx-950 text-white border-onyx-950 font-semibold"
                      : "bg-white text-onyx-700 border-silk-200 hover:border-marina-300"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="pt-3 border-t border-silk-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-onyx-700 font-medium">Filtros ativos:</span>
              {q && (
                <Link
                  href={buildCatalogUrl(basePath, currentQueryMap, {
                    q: undefined,
                  })}
                  className="inline-flex items-center gap-1 bg-marina-50 text-marina-800 border border-marina-200 px-2.5 py-1 rounded-full"
                >
                  <span>Busca: &quot;{q}&quot;</span>
                  <X className="w-3 h-3" />
                </Link>
              )}
              {brandObj && (
                <Link
                  href={buildCatalogUrl(basePath, currentQueryMap, {
                    marca: undefined,
                  })}
                  className="inline-flex items-center gap-1 bg-marina-50 text-marina-800 border border-marina-200 px-2.5 py-1 rounded-full"
                >
                  <span>Marca: {brandObj.name}</span>
                  <X className="w-3 h-3" />
                </Link>
              )}
              {(priceKey || resolvedSearch.minPrice || resolvedSearch.maxPrice) && (
                <Link
                  href={buildCatalogUrl(basePath, currentQueryMap, {
                    preco: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                  })}
                  className="inline-flex items-center gap-1 bg-marina-50 text-marina-800 border border-marina-200 px-2.5 py-1 rounded-full"
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
                href={basePath}
                className="text-marina-600 hover:text-marina-800 font-semibold underline ml-2"
              >
                Limpar Filtros
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Grid ou Estado Vazio */}
      {categoryProducts.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-silk-200 p-8">
          <ShoppingBag className="w-10 h-10 text-marina-500 mx-auto" />
          <h2 className="font-serif text-xl text-onyx-900">
            Nenhum produto encontrado nesta seleção
          </h2>
          <p className="text-xs text-onyx-700 max-w-sm mx-auto">
            Limpe o filtro de marca ou explore todo o catálogo da Mariane Cosméticos.
          </p>
          <div className="flex justify-center gap-3">
            {brandSlug && (
              <Link
                href={basePath}
                className="inline-block bg-marina-600 text-white px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-marina-700 transition-colors"
              >
                Ver toda a categoria
              </Link>
            )}
            <Link
              href="/produtos"
              className="inline-block bg-onyx-900 text-marina-200 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-marina-600 hover:text-white transition-colors"
            >
              Ver Catálogo Completo
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categoryProducts.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Paginação da categoria"
              className="pt-8 border-t border-silk-200 flex items-center justify-center gap-2"
            >
              {currentPage > 1 && (
                <Link
                  href={buildCatalogUrl(basePath, currentQueryMap, {
                    pagina: String(currentPage - 1),
                  })}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-silk-200 bg-white text-xs font-semibold text-onyx-800 hover:border-marina-400"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </Link>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Link
                    key={page}
                    href={buildCatalogUrl(basePath, currentQueryMap, {
                      pagina: String(page),
                    })}
                    className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center border ${
                      page === currentPage
                        ? "bg-marina-600 text-white border-marina-600"
                        : "bg-white text-onyx-800 border-silk-200 hover:border-marina-300"
                    }`}
                  >
                    {page}
                  </Link>
                )
              )}

              {currentPage < totalPages && (
                <Link
                  href={buildCatalogUrl(basePath, currentQueryMap, {
                    pagina: String(currentPage + 1),
                  })}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-silk-200 bg-white text-xs font-semibold text-onyx-800 hover:border-marina-400"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

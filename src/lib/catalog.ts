import { db, products, brands, categories, productImages } from "@/db";
import { eq, and, sql, asc, desc, inArray } from "drizzle-orm";

export interface CatalogFilterParams {
  q?: string;
  marca?: string;
  categoria?: string;
  preco?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  ordem?: string;
  pagina?: number | string;
  page?: number | string;
  limit?: number;
  pageSize?: number;
}

export function parsePriceRange(
  preco?: string,
  minParam?: string | number,
  maxParam?: string | number
): { minPrice?: number; maxPrice?: number; label?: string } {
  let minPrice =
    minParam !== undefined && minParam !== "" ? Number(minParam) : undefined;
  let maxPrice =
    maxParam !== undefined && maxParam !== "" ? Number(maxParam) : undefined;

  if (preco === "ate-100") {
    minPrice = 0;
    maxPrice = 100;
  } else if (preco === "100-200") {
    minPrice = 100;
    maxPrice = 200;
  } else if (preco === "acima-200") {
    minPrice = 200;
    maxPrice = undefined;
  }

  if (minPrice !== undefined && (Number.isNaN(minPrice) || minPrice < 0)) {
    minPrice = undefined;
  }
  if (maxPrice !== undefined && (Number.isNaN(maxPrice) || maxPrice <= 0)) {
    maxPrice = undefined;
  }

  return { minPrice, maxPrice };
}

export function buildCatalogUrl(
  basePathOrCurrent: string | Record<string, string | undefined>,
  currentOrOverrides: Record<string, string | undefined>,
  maybeOverrides?: Record<string, string | undefined>
): string {
  const basePath =
    typeof basePathOrCurrent === "string" ? basePathOrCurrent : "/produtos";
  const current =
    typeof basePathOrCurrent === "string"
      ? currentOrOverrides
      : basePathOrCurrent;
  const overrides =
    typeof basePathOrCurrent === "string"
      ? maybeOverrides || {}
      : currentOrOverrides;

  const merged: Record<string, string | undefined> = {
    ...current,
    ...overrides,
  };

  // Resetar para página 1 sempre que mudar filtro/busca/ordenação (exceto quando o próprio override é 'pagina')
  if (!("pagina" in overrides)) {
    delete merged.pagina;
  }

  const search = new URLSearchParams();
  for (const [key, val] of Object.entries(merged)) {
    if (
      val &&
      val.trim() !== "" &&
      !(key === "pagina" && val === "1") &&
      !(key === "ordem" && val === "destaques")
    ) {
      search.set(key, val.trim());
    }
  }

  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function normalizeText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export async function queryCatalogProducts(params: CatalogFilterParams) {
  const rawPage = Number(params.pagina ?? params.page ?? 1);
  const page = Math.max(1, Number.isNaN(rawPage) ? 1 : Math.floor(rawPage));
  const rawSize = Number(params.pageSize || params.limit || 12);
  const pageSize = Math.min(100, Math.max(1, Number.isNaN(rawSize) ? 12 : Math.floor(rawSize)));
  const offset = (page - 1) * pageSize;
  const sort = params.ordem || "destaques";
  const q = params.q?.trim() || "";

  const parsedPrices = parsePriceRange(
    params.preco,
    params.minPrice,
    params.maxPrice
  );

  const allBrands = await db.select().from(brands);
  const allCategories = await db.select().from(categories);

  const brandObj = params.marca
    ? allBrands.find((b) => b.slug === params.marca)
    : undefined;
  const catObj = params.categoria
    ? allCategories.find((c) => c.slug === params.categoria)
    : undefined;

  // Se o filtro de marca ou categoria foi passado na URL mas não existe no banco, retornar vazio
  if ((params.marca && !brandObj) || (params.categoria && !catObj)) {
    return {
      items: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      pageSize,
      allBrands,
      allCategories,
      brandObj,
      catObj,
    };
  }

  const effectivePriceExpr = sql<number>`CASE WHEN ${products.promoPrice} IS NOT NULL AND ${products.promoPrice} > 0 AND ${products.promoPrice} < ${products.price} THEN ${products.promoPrice} ELSE ${products.price} END`;
  const conditions = [];

  if (brandObj) {
    conditions.push(eq(products.brandId, brandObj.id));
  }
  if (catObj) {
    conditions.push(eq(products.categoryId, catObj.id));
  }
  if (parsedPrices.minPrice !== undefined) {
    conditions.push(sql`${effectivePriceExpr} >= ${parsedPrices.minPrice}`);
  }
  if (parsedPrices.maxPrice !== undefined) {
    conditions.push(sql`${effectivePriceExpr} <= ${parsedPrices.maxPrice}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const orderByClauses =
    sort === "menor_preco"
      ? [asc(effectivePriceExpr), asc(products.id)]
      : sort === "maior_preco"
      ? [desc(effectivePriceExpr), asc(products.id)]
      : sort === "mais_vendidos"
      ? [desc(products.isBestSeller), desc(products.isFeatured), asc(products.id)]
      : [desc(products.isFeatured), desc(products.isBestSeller), asc(products.id)];

  const brandsMap = new Map(allBrands.map((b) => [b.id, b.name]));

  // Quando não há busca textual livre com acentos, paginar diretamente no SQL via Drizzle
  if (!q) {
    const countRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);
    const totalCount = Number(countRows[0]?.count || 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const pagedRows = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(...orderByClauses)
      .limit(pageSize)
      .offset(offset);

    const productIds = pagedRows.map((p) => p.id);
    const imagesMap = new Map<string, string>();
    if (productIds.length > 0) {
      const imgs = await db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, productIds));
      for (const img of imgs) {
        if (!imagesMap.has(img.productId) || img.isPrimary === 1) {
          imagesMap.set(img.productId, img.url);
        }
      }
    }

    const items = pagedRows.map((p) => {
      const effectivePrice =
        p.promoPrice !== null && p.promoPrice > 0 && p.promoPrice < p.price
          ? p.promoPrice
          : p.price;
      return {
        ...p,
        effectivePrice,
        brandName: p.brandId ? brandsMap.get(p.brandId) || "Profissional" : "Profissional",
        imageUrl:
          imagesMap.get(p.id) ||
          "/products/fallback.webp",
      };
    });

    return {
      items,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
      allBrands,
      allCategories,
      brandObj,
      catObj,
    };
  }

  // Com busca textual (suporte total a acentuação PT-BR como "óleo", "máscara", "L'Oréal")
  const candidateRows = await db
    .select()
    .from(products)
    .where(whereClause)
    .orderBy(...orderByClauses);

  const normQ = normalizeText(q);
  const matchedRows = candidateRows.filter((p) => {
    const brandName = p.brandId ? brandsMap.get(p.brandId) || "" : "";
    return (
      normalizeText(p.name).includes(normQ) ||
      normalizeText(brandName).includes(normQ) ||
      (p.description ? normalizeText(p.description).includes(normQ) : false) ||
      (p.sku ? normalizeText(p.sku).includes(normQ) : false)
    );
  });

  const totalCount = matchedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pagedRows = matchedRows.slice(offset, offset + pageSize);

  const productIds = pagedRows.map((p) => p.id);
  const imagesMap = new Map<string, string>();
  if (productIds.length > 0) {
    const imgs = await db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds));
    for (const img of imgs) {
      if (!imagesMap.has(img.productId) || img.isPrimary === 1) {
        imagesMap.set(img.productId, img.url);
      }
    }
  }

  const items = pagedRows.map((p) => {
    const effectivePrice =
      p.promoPrice !== null && p.promoPrice > 0 && p.promoPrice < p.price
        ? p.promoPrice
        : p.price;
    return {
      ...p,
      effectivePrice,
      brandName: p.brandId ? brandsMap.get(p.brandId) || "Profissional" : "Profissional",
      imageUrl:
        imagesMap.get(p.id) ||
        "/products/fallback.webp",
    };
  });

  return {
    items,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
    allBrands,
    allCategories,
    brandObj,
    catObj,
  };
}


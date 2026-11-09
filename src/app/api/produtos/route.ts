import { NextResponse } from "next/server";
import { queryCatalogProducts, parsePriceRange } from "@/lib/catalog";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;
    const brand = searchParams.get("marca") || undefined;
    const category = searchParams.get("categoria") || undefined;
    const preco = searchParams.get("preco") || undefined;
    const ordem = searchParams.get("ordem") || undefined;
    const page = parseInt(
      searchParams.get("pagina") || searchParams.get("page") || "1",
      10
    );
    const limit = parseInt(searchParams.get("limit") || "24", 10);

    const { minPrice, maxPrice } = parsePriceRange(
      preco,
      searchParams.get("minPrice") || undefined,
      searchParams.get("maxPrice") || undefined
    );

    const { items, totalCount, totalPages, currentPage, pageSize } =
      await queryCatalogProducts({
        q,
        marca: brand,
        categoria: category,
        preco,
        minPrice,
        maxPrice,
        ordem,
        pagina: Number.isNaN(page) ? 1 : page,
        limit: Number.isNaN(limit) ? 24 : limit,
      });

    return NextResponse.json({
      success: true,
      total: totalCount,
      page: currentPage,
      pageSize,
      totalPages,
      data: items,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao consultar catálogo";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

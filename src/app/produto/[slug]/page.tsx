import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, products, brands, categories, productImages } from "@/db";
import { eq, ne, and } from "drizzle-orm";
import ProductDetailClient from "./ProductDetailClient";
import ProductCard from "@/components/ProductCard";

export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const productList = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (productList.length === 0) {
    return {
      title: "Produto não encontrado | Mariane Cosméticos",
    };
  }

  const product = productList[0];
  const currentPrice =
    product.promoPrice && product.promoPrice > 0 && product.promoPrice < product.price
      ? product.promoPrice
      : product.price;
  const pixPrice = (currentPrice * 0.95).toFixed(2);

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id));
  const primaryImage =
    images.find((i) => i.isPrimary === 1)?.url ||
    images[0]?.url ||
    "/logo.svg";

  const description =
    product.description?.slice(0, 155) ||
    `Compre ${product.name} na Mariane Cosméticos em Lages – SC por R$ ${pixPrice} no PIX (5% OFF) ou em até 10x sem juros.`;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/produto/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Mariane Cosméticos`,
      description,
      url: `https://marianecosmeticos.com.br/produto/${product.slug}`,
      siteName: "Mariane Cosméticos",
      locale: "pt_BR",
      type: "website",
      images: [
        {
          url: primaryImage,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const productList = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (productList.length === 0) {
    notFound();
  }

  const product = productList[0];

  // Buscar marca
  let brandName = "Profissional";
  let brandSlug = "";
  if (product.brandId) {
    const brandList = await db
      .select()
      .from(brands)
      .where(eq(brands.id, product.brandId))
      .limit(1);
    if (brandList.length > 0) {
      brandName = brandList[0].name;
      brandSlug = brandList[0].slug;
    }
  }

  // Buscar categoria
  let categoryName = "Tratamento";
  let categorySlug = "tratamento-mascaras";
  if (product.categoryId) {
    const catList = await db
      .select()
      .from(categories)
      .where(eq(categories.id, product.categoryId))
      .limit(1);
    if (catList.length > 0) {
      categoryName = catList[0].name;
      categorySlug = catList[0].slug;
    }
  }

  // Buscar imagens do produto
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id));

  const imageUrls = images.map((i) => i.url);
  if (imageUrls.length === 0) {
    imageUrls.push(
      "/products/fallback.webp"
    );
  }

  // Buscar produtos relacionados (mesma categoria ou marca)
  const relatedRaw = product.categoryId
    ? await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.categoryId, product.categoryId),
            ne(products.id, product.id)
          )
        )
        .limit(4)
    : [];

  const allBrands = await db.select().from(brands);
  const allImages = await db.select().from(productImages);
  const brandsMap = new Map(allBrands.map((b) => [b.id, b.name]));
  const imagesMap = new Map<string, string>();
  for (const img of allImages) {
    if (!imagesMap.has(img.productId) || img.isPrimary === 1) {
      imagesMap.set(img.productId, img.url);
    }
  }

  const relatedProducts = relatedRaw.map((rp) => ({
    ...rp,
    brandName: rp.brandId ? brandsMap.get(rp.brandId) || "Profissional" : "Profissional",
    imageUrl:
      imagesMap.get(rp.id) ||
      "/products/fallback.webp",
  }));

  const currentPrice =
    product.promoPrice && product.promoPrice > 0 && product.promoPrice < product.price
      ? product.promoPrice
      : product.price;

  // JSON-LD estruturado (Schema.org Product)
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: imageUrls,
    description:
      product.description ||
      `${product.name} - ${brandName} disponível na Mariane Cosméticos em Lages – SC.`,
    sku: product.sku || product.id,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers: {
      "@type": "Offer",
      url: `https://marianecosmeticos.com.br/produto/${product.slug}`,
      priceCurrency: "BRL",
      price: currentPrice.toFixed(2),
      availability:
        (product.stock ?? 15) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Mariane Cosméticos",
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-onyx-700 flex items-center gap-2 flex-wrap"
      >
        <Link href="/" className="hover:text-marina-600">
          Home
        </Link>
        <span>/</span>
        <Link
          href={`/categoria/${categorySlug}`}
          className="hover:text-marina-600"
        >
          {categoryName}
        </Link>
        {brandSlug && (
          <>
            <span>/</span>
            <Link
              href={`/produtos?marca=${brandSlug}`}
              className="hover:text-marina-600"
            >
              {brandName}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-onyx-900 font-semibold truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Main Product Layout */}
      <ProductDetailClient
        product={product}
        brandName={brandName}
        categoryName={categoryName}
        imageUrls={imageUrls}
      />

      {/* Produtos Relacionados */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-silk-200 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-marina-600 block mb-1">
                Complete seu Tratamento
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-onyx-950 tracking-tight">
                Produtos Relacionados
              </h2>
            </div>
            <Link
              href={`/categoria/${categorySlug}`}
              className="text-xs font-semibold uppercase tracking-wider text-onyx-900 hover:text-marina-600"
            >
              Ver mais em {categoryName}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id} {...rp} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

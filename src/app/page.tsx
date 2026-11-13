import React from "react";
import Image from "next/image";
import Link from "next/link";
import { db, products, brands, productImages } from "@/db";
import ProductCard from "@/components/ProductCard";
import StoreMapSection from "@/components/StoreMapSection";
import Hero, { HeroPanoramicBanner } from "@/components/home/Hero";
import {
  getDefaultHeroCarouselProducts,
  resolveHeroCarouselProducts,
} from "@/data/hero-products";
import BrandShowcase from "@/components/home/BrandShowcase";
import { SectionHeader, Button, Container } from "@/components/ui";
import { MessageCircle, ShoppingBag } from "lucide-react";

export const revalidate = 0;

async function getHomeData() {
  try {
    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        price: products.price,
        promoPrice: products.promoPrice,
        installmentCount: products.installmentCount,
        installmentValue: products.installmentValue,
        isFeatured: products.isFeatured,
        isBestSeller: products.isBestSeller,
        rating: products.rating,
        reviewCount: products.reviewCount,
        brandId: products.brandId,
        categoryId: products.categoryId,
      })
      .from(products)
      .limit(120);

    const allBrands = await db.select().from(brands);
    const allImages = await db.select().from(productImages);

    const brandsMap = new Map(allBrands.map((b) => [b.id, b.name]));
    const imagesMap = new Map<string, string>();
    for (const img of allImages) {
      if (!imagesMap.has(img.productId) || img.isPrimary === 1) {
        imagesMap.set(img.productId, img.url);
      }
    }

    const enrichedProducts = allProducts.map((p) => ({
      ...p,
      brandName: p.brandId ? brandsMap.get(p.brandId) || "Profissional" : "Profissional",
      imageUrl:
        imagesMap.get(p.id) ||
        "/products/fallback.webp",
    }));

    const bestSellers = enrichedProducts.filter((p) => p.isBestSeller === 1).slice(0, 8);
    const featured = enrichedProducts.filter((p) => p.isFeatured === 1).slice(0, 8);
    const madressenzaItems = enrichedProducts.filter((p) => p.brandId === "brand_madressenza").slice(0, 4);
    const allRecent = enrichedProducts.slice(0, 12);
    const heroProducts = resolveHeroCarouselProducts(enrichedProducts);

    return {
      bestSellers: bestSellers.length > 0 ? bestSellers : allRecent.slice(0, 4),
      featured: featured.length > 0 ? featured : allRecent.slice(4, 8),
      madressenzaItems,
      all: allRecent,
      heroProducts,
    };
  } catch (error) {
    console.error("Erro ao carregar dados da Home:", error);
    return {
      bestSellers: [],
      featured: [],
      madressenzaItems: [],
      all: [],
      heroProducts: getDefaultHeroCarouselProducts(),
    };
  }
}

export default async function HomePage() {
  const { bestSellers, heroProducts } = await getHomeData();

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section — renderiza <h1 principal e carrossel de produtos (HeroPanoramicBanner) */}
      <Hero products={heroProducts} />

      {/* 2. Marcas Oficiais & Curadoria Madressenza */}
      <BrandShowcase />

      {/* 3. Vitrine: Mais Vendidos & Destaques */}
      <section className="bg-silk-50/50 py-12 sm:py-16 lg:py-20 border-b border-silk-200/80">
        <Container>
          <SectionHeader
            title="Mais Vendidos &amp; Destaques"
            actionLabel="Ver Catálogo Completo"
            actionHref="/produtos?ordem=mais_vendidos"
          />

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {bestSellers.slice(0, 4).map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </Container>
      </section>

      {/* 3. Sobre a Loja Física & Localização em Lages – SC */}
      <StoreMapSection />

      {/* 4. Chamada Final */}
      <section className="py-10 sm:py-14 lg:py-16">
        <Container>
          <div className="bg-white rounded-3xl border border-marina-200/80 p-8 sm:p-12 text-center shadow-luxury-card space-y-6">
            <h2 className="font-serif text-2xl sm:text-4xl text-onyx-950 max-w-2xl mx-auto leading-tight">
              Pronta para cuidar da sua beleza?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Button href="/produtos" variant="primary" size="lg">
                <ShoppingBag className="w-4 h-4" />
                <span>Explorar Catálogo Completo</span>
              </Button>
              <Button
                href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Quero%20fazer%20um%20pedido."
                external
                variant="whatsapp"
                size="lg"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Falar no WhatsApp (49) 99125-1617</span>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

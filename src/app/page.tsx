import React from "react";
import Image from "next/image";
import Link from "next/link";
import { db, products, brands, productImages } from "@/db";
import ProductShowcase from "@/components/ProductShowcase";
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
    const promos = enrichedProducts
      .filter((p) => typeof p.promoPrice === "number" && p.promoPrice > 0 && p.promoPrice < p.price)
      .slice(0, 8);
    const madressenzaItems = enrichedProducts.filter((p) => p.brandId === "brand_madressenza").slice(0, 4);
    const allRecent = enrichedProducts.slice(0, 12);
    const heroProducts = resolveHeroCarouselProducts(enrichedProducts);

    // Combinar produtos variados por marca/destaque/promoção (~24 itens únicos) para a vitrine interativa
    const showcaseMap = new Map<string, (typeof enrichedProducts)[number]>();
    for (const item of [...bestSellers, ...promos, ...featured, ...madressenzaItems, ...enrichedProducts]) {
      if (!showcaseMap.has(item.id)) {
        showcaseMap.set(item.id, item);
      }
      if (showcaseMap.size >= 24) break;
    }

    return {
      bestSellers: bestSellers.length > 0 ? bestSellers : allRecent.slice(0, 4),
      featured: featured.length > 0 ? featured : allRecent.slice(4, 8),
      madressenzaItems,
      showcaseProducts: Array.from(showcaseMap.values()),
      all: allRecent,
      heroProducts,
    };
  } catch (error) {
    console.error("Erro ao carregar dados da Home:", error);
    return {
      bestSellers: [],
      featured: [],
      madressenzaItems: [],
      showcaseProducts: [],
      all: [],
      heroProducts: getDefaultHeroCarouselProducts(),
    };
  }
}

export default async function HomePage() {
  const { showcaseProducts, heroProducts } = await getHomeData();

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section — renderiza <h1 principal e carrossel de produtos (HeroPanoramicBanner) */}
      <Hero products={heroProducts} />

      {/* 2. Marcas Oficiais & Curadoria Madressenza */}
      <BrandShowcase />

      {/* 3. Vitrine: Mais Vendidos & Destaques */}
      <ProductShowcase products={showcaseProducts} />

      {/* 3. Sobre a Loja Física & Localização em Lages – SC */}
      <StoreMapSection />

      {/* 4. Chamada Final (apenas desktop — no mobile é redundante com a nav inferior + WhatsApp) */}
      <section className="hidden md:block pt-2 pb-10 sm:pt-4 sm:pb-12 lg:pb-14">
        <Container>
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-marina-200/80 py-10 px-6 sm:py-12 sm:px-10 text-center shadow-luxury-card">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-onyx-950 max-w-md mx-auto leading-tight tracking-tight [word-spacing:0.04em]">
              Pronta para cuidar da sua beleza?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-onyx-700 max-w-md mx-auto leading-relaxed [word-spacing:0.05em]">
              Atendimento personalizado pelo WhatsApp ou retire na loja em Lages.
            </p>
            <div className="mt-6 sm:mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto w-full">
              <Button
                href="/produtos"
                variant="primary"
                size="lg"
                fullWidth
                className="normal-case tracking-normal text-sm min-h-[48px] px-6 py-3 [word-spacing:0.06em]"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Ver catálogo</span>
              </Button>
              <Button
                href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Quero%20fazer%20um%20pedido."
                external
                variant="whatsapp"
                size="lg"
                fullWidth
                aria-label="Falar no WhatsApp (49) 99125-1617"
                title="Falar no WhatsApp (49) 99125-1617"
                className="normal-case tracking-normal text-sm min-h-[48px] px-6 py-3 [word-spacing:0.06em] !bg-emerald-700 hover:!bg-emerald-800 text-white"
              >
                <MessageCircle className="w-4 h-4 fill-white shrink-0" aria-hidden="true" />
                <span>Falar no WhatsApp</span>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

export interface HeroCarouselProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  priceCents: number;
  formattedPrice: string;
  image: string;
  alt: string;
  href: string;
}

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatHeroPriceFromCents(priceCents: number): string {
  return brlFormatter.format(priceCents / 100);
}

export const HERO_CURATED_PRODUCT_SLUGS: readonly string[] = [
  "difusor-aromas-madressenza-bergamota-ambar-250ml",
  "perfume-ambiente-spray-madressenza-lavanda-provence-200ml",
  "sabonete-liquido-madressenza-verbena-cha-branco-350ml",
  "agua-perfumada-tecidos-madressenza-flor-algodao-500ml",
  "loreal-absolut-repair-molecular-kit-caixa-serum-250ml-leave-in-100ml-linda-cosmeticos",
  "wella-crono-fusion500-enrich500-oil500-linda-cosmeticos",
  "truss-uso-obrigatorio-spray-reconstrutor-260ml",
  "brae-divine-mascara-hidratante-antifrizz-500g",
  "truss-uso-obrigatorio-sh-300ml-cond-300ml-masc-180ml-spray-reconstrutor-260ml",
  "kit-brae-revival-reconstrucao-total-sh-cond-masc",
  "locao-hidratante-corporal-madressenza-vanilla-250ml",
] as const;

interface SeedProductSnapshot {
  id: string;
  slug: string;
  name: string;
  brand: string;
  priceCents: number;
  image: string;
  alt: string;
}

const HERO_SEED_SNAPSHOTS: readonly SeedProductSnapshot[] = [
  {
    id: "prod_madressenza_1",
    slug: "difusor-aromas-madressenza-bergamota-ambar-250ml",
    name: "Difusor de Aromas Madressenza Bergamota & Âmbar 250ml",
    brand: "Madressenza",
    priceCents: 16990,
    image: "/products/madressenza/difusor-aromas-madressenza-bergamota-ambar-250ml.webp",
    alt: "Difusor de Aromas Madressenza Bergamota & Âmbar 250ml em frasco de vidro âmbar com varetas",
  },
  {
    id: "prod_madressenza_4",
    slug: "perfume-ambiente-spray-madressenza-lavanda-provence-200ml",
    name: "Perfume de Ambiente Spray Madressenza Lavanda Provence 200ml",
    brand: "Madressenza",
    priceCents: 12990,
    image: "/products/madressenza/perfume-ambiente-spray-madressenza-lavanda-provence-200ml.webp",
    alt: "Perfume de Ambiente Spray Madressenza Lavanda Provence 200ml em frasco de vidro com válvula dourada",
  },
  {
    id: "prod_madressenza_3",
    slug: "sabonete-liquido-madressenza-verbena-cha-branco-350ml",
    name: "Sabonete Líquido Luxo Madressenza Verbena & Chá Branco 350ml",
    brand: "Madressenza",
    priceCents: 9890,
    image: "/products/madressenza/sabonete-liquido-madressenza-verbena-cha-branco-350ml.webp",
    alt: "Sabonete Líquido Luxo Madressenza Verbena & Chá Branco 350ml com partículas iluminadoras",
  },
  {
    id: "prod_madressenza_2",
    slug: "agua-perfumada-tecidos-madressenza-flor-algodao-500ml",
    name: "Água Perfumada para Tecidos Madressenza Flor de Algodão 500ml",
    brand: "Madressenza",
    priceCents: 11990,
    image: "/products/madressenza/agua-perfumada-tecidos-madressenza-flor-algodao-500ml.webp",
    alt: "Água Perfumada para Tecidos Madressenza Flor de Algodão 500ml com válvula spray dourada",
  },
  {
    id: "prod_9",
    slug: "loreal-absolut-repair-molecular-kit-caixa-serum-250ml-leave-in-100ml-linda-cosmeticos",
    name: "Loreal Absolut Repair Molecular Kit Caixa Sérum 250ml + Leave-in 100ml",
    brand: "L'Oréal Professionnel",
    priceCents: 36756,
    image: "/products/loreal-professionnel/loreal-absolut-repair-molecular-kit-caixa-serum-250ml-leave-in-100ml-linda-cosmeticos.webp",
    alt: "Kit L'Oréal Professionnel Absolut Repair Molecular com Sérum 250ml e Leave-in 100ml",
  },
  {
    id: "prod_1",
    slug: "wella-crono-fusion500-enrich500-oil500-linda-cosmeticos",
    name: "Kit Wella Cronograma Capilar com Máscaras Fusion, Nutri-Enrich e Oil Reflections 500g",
    brand: "Wella Profissional",
    priceCents: 51291,
    image: "/products/wella-profissional/wella-crono-fusion500-enrich500-oil500-linda-cosmeticos.webp",
    alt: "Kit Wella Profissional Cronograma Capilar com Máscaras Fusion, Nutri-Enrich e Oil Reflections 500g",
  },
  {
    id: "prod_truss_6",
    slug: "truss-uso-obrigatorio-spray-reconstrutor-260ml",
    name: "Spray Reconstrutor Truss Uso Obrigatório 260ml",
    brand: "Truss",
    priceCents: 18990,
    image: "/products/truss/truss-uso-obrigatorio-spray-reconstrutor-260ml.webp",
    alt: "Spray Reconstrutor Truss Uso Obrigatório 260ml",
  },
  {
    id: "prod_brae_11",
    slug: "brae-divine-mascara-hidratante-antifrizz-500g",
    name: "Máscara Hidratante Antifrizz Braé Divine 500g",
    brand: "Braé",
    priceCents: 22990,
    image: "/products/brae/brae-divine-mascara-hidratante-antifrizz-500g.webp",
    alt: "Máscara Hidratante Antifrizz Braé Divine 500g",
  },
  {
    id: "prod_truss_18",
    slug: "truss-uso-obrigatorio-sh-300ml-cond-300ml-masc-180ml-spray-reconstrutor-260ml",
    name: "Kit Completo Truss Uso Obrigatório - Shampoo 300ml + Condicionador 300ml + Máscara 180ml + Spray Reconstrutor 260ml",
    brand: "Truss",
    priceCents: 57941,
    image: "/products/truss/truss-uso-obrigatorio-sh-300ml-cond-300ml-masc-180ml-spray-reconstrutor-260ml.webp",
    alt: "Kit Completo Truss Uso Obrigatório com Shampoo, Condicionador, Máscara e Spray Reconstrutor",
  },
  {
    id: "prod_brae_20",
    slug: "kit-brae-revival-reconstrucao-total-sh-cond-masc",
    name: "Kit Braé Revival Reconstrução Total — Shampoo 250ml + Condicionador 250ml + Máscara 500g",
    brand: "Braé",
    priceCents: 36990,
    image: "/products/brae/kit-brae-revival-reconstrucao-total.webp",
    alt: "Kit Braé Revival Reconstrução Total com Shampoo 250ml, Condicionador 250ml e Máscara 500g",
  },
  {
    id: "prod_madressenza_5",
    slug: "locao-hidratante-corporal-madressenza-vanilla-250ml",
    name: "Loção Hidratante Corporal Madressenza Vanilla & Caramelo 250ml",
    brand: "Madressenza",
    priceCents: 10990,
    image: "/products/madressenza/locao-hidratante-corporal-madressenza-vanilla-250ml.webp",
    alt: "Loção Hidratante Corporal Madressenza Vanilla & Caramelo 250ml sobre pedra travertino",
  },
];

export function getDefaultHeroCarouselProducts(): HeroCarouselProduct[] {
  return HERO_SEED_SNAPSHOTS.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    brand: item.brand,
    priceCents: item.priceCents,
    formattedPrice: formatHeroPriceFromCents(item.priceCents),
    image: item.image,
    alt: item.alt,
    href: `/produto/${item.slug}`,
  }));
}

export interface RawHeroProductRow {
  id: string;
  slug: string;
  name: string;
  price: number;
  promoPrice: number | null;
  brandName: string;
  imageUrl: string;
}

export function resolveHeroCarouselProducts(
  rows: RawHeroProductRow[]
): HeroCarouselProduct[] {
  if (!rows || rows.length === 0) {
    return getDefaultHeroCarouselProducts();
  }

  const fallbackBySlug = new Map(HERO_SEED_SNAPSHOTS.map((s) => [s.slug, s]));
  const rowBySlug = new Map(rows.map((r) => [r.slug, r]));

  return HERO_CURATED_PRODUCT_SLUGS.map((slug) => {
    const row = rowBySlug.get(slug);
    const snapshot = fallbackBySlug.get(slug)!;

    if (!row) {
      return {
        id: snapshot.id,
        slug: snapshot.slug,
        name: snapshot.name,
        brand: snapshot.brand,
        priceCents: snapshot.priceCents,
        formattedPrice: formatHeroPriceFromCents(snapshot.priceCents),
        image: snapshot.image,
        alt: snapshot.alt,
        href: `/produto/${snapshot.slug}`,
      };
    }

    const effectiveUnitPrice =
      typeof row.promoPrice === "number" && row.promoPrice > 0
        ? row.promoPrice
        : row.price;
    const effectiveCents = Math.round(effectiveUnitPrice * 100);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: row.brandName || snapshot.brand,
      priceCents: effectiveCents,
      formattedPrice: formatHeroPriceFromCents(effectiveCents),
      image: row.imageUrl || snapshot.image,
      alt: snapshot.alt || `${row.name} — ${row.brandName}`,
      href: `/produto/${row.slug}`,
    };
  });
}

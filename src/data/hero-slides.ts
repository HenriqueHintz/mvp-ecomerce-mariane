import {
  getDefaultHeroCarouselProducts,
  type HeroCarouselProduct,
} from "@/data/hero-products";

export type HeroSlideTone = "claro" | "escuro";
export type HeroSlidePlan = "A" | "B";

export interface HeroSlideFocalPoint {
  desktop: string;
  mobile: string;
}

export interface HeroSlideConfig {
  id: string;
  productId: string;
  desktop: string;
  mobile: string;
  sceneDesktop?: string;
  sceneMobile?: string;
  cutout?: string;
  tone: HeroSlideTone;
  focalPoint: HeroSlideFocalPoint;
  plan: HeroSlidePlan;
  sceneDescription: string;
  alt: string;
  href?: string;
}

export type HeroSlide = HeroSlideConfig;

export interface ResolvedHeroSlide extends HeroSlideConfig {
  productName: string;
  productBrand: string;
  productHref: string;
  alt: string;
}

export const HERO_CONTENT = {
  companyName: "Mariane Cosméticos",
  slogan: "Perfume que envolve, olhar que guarda, toque que desperta",
  headline: "Linda é a mulher que bem se quer",
  curation:
    "Curadoria oficial Madressenza, Wella Professionals, Truss, Braé e L'Oréal Professionnel.",
  primaryCta: {
    label: "Ver Catálogo",
    cleanLabel: "Ver Catálogo",
    href: "/produtos",
  },
  secondaryCta: {
    label: "Consultoria no WhatsApp",
    cleanLabel: "Consultoria no WhatsApp",
    href: "https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20comprar%20pelo%20WhatsApp.",
  },
} as const;

export const HERO_SLIDES: HeroSlideConfig[] = [
  {
    id: "slide-madressenza",
    productId: "prod_madressenza_1",
    desktop:
      "/hero/generated/difusor-aromas-madressenza-bergamota-ambar-250ml-desktop.webp",
    mobile:
      "/hero/generated/difusor-aromas-madressenza-bergamota-ambar-250ml-mobile.webp",
    tone: "claro",
    focalPoint: {
      desktop: "76% 52%",
      mobile: "50% 28%",
    },
    plan: "A",
    sceneDescription:
      "em cena de estúdio sobre mármore travertino claro com tecido de seda champanhe e luz natural matinal",
    alt: "Cena de estúdio sobre mármore travertino claro com tecido de seda champanhe e luz natural matinal",
  },
  {
    id: "slide-loreal",
    productId: "prod_9",
    desktop:
      "/hero/generated/loreal-absolut-repair-molecular-kit-caixa-serum-250ml-leave-in-100ml-linda-cosmeticos-desktop.webp",
    mobile:
      "/hero/generated/loreal-absolut-repair-molecular-kit-caixa-serum-250ml-leave-in-100ml-linda-cosmeticos-mobile.webp",
    sceneDesktop:
      "/hero/generated/loreal-absolut-repair-molecular-kit-caixa-serum-250ml-leave-in-100ml-linda-cosmeticos-scene-desktop.webp",
    sceneMobile:
      "/hero/generated/loreal-absolut-repair-molecular-kit-caixa-serum-250ml-leave-in-100ml-linda-cosmeticos-scene-mobile.webp",
    cutout:
      "/hero/generated/loreal-absolut-repair-molecular-kit-caixa-serum-250ml-leave-in-100ml-linda-cosmeticos-cutout.webp",
    tone: "escuro",
    focalPoint: {
      desktop: "75% 54%",
      mobile: "50% 26%",
    },
    plan: "B",
    sceneDescription:
      "em cena noturna de luxo sobre pedra obsidiana negra polida com reflexo espelhado e iluminação de borda dourada",
    alt: "Cena noturna de luxo sobre pedra obsidiana negra polida com reflexo espelhado e iluminação de borda dourada",
  },
  {
    id: "slide-wella",
    productId: "prod_1",
    desktop:
      "/hero/generated/wella-crono-fusion500-enrich500-oil500-linda-cosmeticos-desktop.webp",
    mobile:
      "/hero/generated/wella-crono-fusion500-enrich500-oil500-linda-cosmeticos-mobile.webp",
    sceneDesktop:
      "/hero/generated/wella-crono-fusion500-enrich500-oil500-linda-cosmeticos-scene-desktop.webp",
    sceneMobile:
      "/hero/generated/wella-crono-fusion500-enrich500-oil500-linda-cosmeticos-scene-mobile.webp",
    cutout:
      "/hero/generated/wella-crono-fusion500-enrich500-oil500-linda-cosmeticos-cutout.webp",
    tone: "claro",
    focalPoint: {
      desktop: "75% 50%",
      mobile: "50% 25%",
    },
    plan: "B",
    sceneDescription:
      "em cena de estúdio sobre bancada de pedra travertino creme e cortina de seda champanhe translúcida",
    alt: "Cena de estúdio sobre bancada de pedra travertino creme e cortina de seda champanhe translúcida",
  },
  {
    id: "slide-truss",
    productId: "prod_truss_6",
    desktop:
      "/hero/generated/truss-uso-obrigatorio-spray-reconstrutor-260ml-desktop.webp",
    mobile:
      "/hero/generated/truss-uso-obrigatorio-spray-reconstrutor-260ml-mobile.webp",
    sceneDesktop:
      "/hero/generated/truss-uso-obrigatorio-spray-reconstrutor-260ml-scene-desktop.webp",
    sceneMobile:
      "/hero/generated/truss-uso-obrigatorio-spray-reconstrutor-260ml-scene-mobile.webp",
    cutout:
      "/hero/generated/truss-uso-obrigatorio-spray-reconstrutor-260ml-cutout.webp",
    tone: "escuro",
    focalPoint: {
      desktop: "75% 50%",
      mobile: "50% 25%",
    },
    plan: "B",
    sceneDescription:
      "em cena de estúdio noturna sobre bancada de ardósia escura e fundo de veludo ameixa profundo",
    alt: "Cena de estúdio noturna sobre bancada de ardósia escura e fundo de veludo ameixa profundo",
  },
  {
    id: "slide-brae",
    productId: "prod_brae_11",
    desktop:
      "/hero/generated/brae-divine-mascara-hidratante-antifrizz-500g-desktop.webp",
    mobile:
      "/hero/generated/brae-divine-mascara-hidratante-antifrizz-500g-mobile.webp",
    sceneDesktop:
      "/hero/generated/brae-divine-mascara-hidratante-antifrizz-500g-scene-desktop.webp",
    sceneMobile:
      "/hero/generated/brae-divine-mascara-hidratante-antifrizz-500g-scene-mobile.webp",
    cutout:
      "/hero/generated/brae-divine-mascara-hidratante-antifrizz-500g-cutout.webp",
    tone: "claro",
    focalPoint: {
      desktop: "74% 52%",
      mobile: "50% 26%",
    },
    plan: "B",
    sceneDescription:
      "em cena de estúdio sobre superfície de mármore branco Carrara com tecido fluido de seda nude-champanhe",
    alt: "Cena de estúdio sobre superfície de mármore branco Carrara com tecido fluido de seda nude-champanhe",
  },
];

/**
 * Resolve dinamicamente nome, marca, link (/produto/[slug]) e alt descritivo
 * de cada slide a partir dos produtos reais do catálogo.
 */
export function resolveHeroSlides(
  catalogProducts?: HeroCarouselProduct[]
): ResolvedHeroSlide[] {
  const catalog =
    catalogProducts && catalogProducts.length > 0
      ? catalogProducts
      : getDefaultHeroCarouselProducts();
  const defaults = getDefaultHeroCarouselProducts();

  const byId = new Map<string, HeroCarouselProduct>();
  for (const item of defaults) {
    byId.set(item.id, item);
  }
  for (const item of catalog) {
    byId.set(item.id, item);
  }

  return HERO_SLIDES.map((slide) => {
    const product = byId.get(slide.productId);
    const productName = product?.name ?? slide.productId;
    const productBrand = product?.brand ?? "Mariane Cosméticos";
    const productHref = product?.href ?? "/produtos";
    const alt = `${productName} (${productBrand}) ${slide.sceneDescription}`;

    return {
      ...slide,
      productName,
      productBrand,
      productHref,
      alt,
    };
  });
}

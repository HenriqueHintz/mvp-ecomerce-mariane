export interface HeroSlide {
  id: string;
  desktop: string;
  mobile: string;
  alt: string;
  href?: string;
}

export const HERO_CONTENT = {
  headline: "Perfume que envolve, olhar que guarda, toque que desperta",
  curation: "Curadoria oficial Madressenza, Wella Professionals, Truss, Braé e L'Oréal Professionnel.",
  primaryCta: {
    label: "VER CATÁLOGO →",
    href: "/produtos",
  },
  secondaryCta: {
    label: "COMPRAR PELO WHATSAPP",
    href: "https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20comprar%20pelo%20WhatsApp.",
  },
} as const;

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    desktop: "/hero/slide-1-desktop.webp",
    mobile: "/hero/slide-1-mobile.webp",
    alt: "Mariane Cosméticos — Tratamento Capilar Profissional e Perfumaria Fina",
    href: "/produtos",
  },
  {
    id: "slide-2",
    desktop: "/hero/slide-2-desktop.webp",
    mobile: "/hero/slide-2-mobile.webp",
    alt: "Curadoria Oficial Madressenza, Wella Professionals, Truss, Braé e L'Oréal Professionnel",
    href: "/produtos?marca=madressenza",
  },
  {
    id: "slide-3",
    desktop: "/hero/slide-3-desktop.webp",
    mobile: "/hero/slide-3-mobile.webp",
    alt: "Mariane Cosméticos — Atendimento Personalizado em Lages – SC",
    href: "https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20atendimento%20personalizado.",
  },
];

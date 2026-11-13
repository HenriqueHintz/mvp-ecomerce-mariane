export type SceneTone = "claro" | "escuro";

export interface ShowcaseBrand {
  name: string;
  slug: string;
  href: string;
  /** Logo oficial (SVG/PNG com transparência), pintado via CSS mask. */
  logo: string;
  /** Proporção largura/altura do arquivo oficial (sem distorcer). */
  ratio: number;
  /** Altura ótica (px) no desktop, ajustada a olho para peso visual equivalente. */
  opticalHeight: number;
  /** Cor oficial da marca no estado ativo/hover. */
  originalColor: string;
  scene: string;
  tone: SceneTone;
}

const brand = (
  name: string,
  slug: string,
  logo: string,
  ratio: number,
  opticalHeight: number,
  originalColor: string,
  tone: SceneTone,
  scene = `/brands/scenes/${slug}-4x5.webp`,
): ShowcaseBrand => ({
  name,
  slug,
  href: `/produtos?marca=${slug}`,
  logo,
  ratio,
  opticalHeight,
  originalColor,
  scene,
  tone,
});

export const FEATURED_BRAND = brand(
  "Madressenza",
  "madressenza",
  "/brands/official/madressenza.png",
  1379 / 147,
  30,
  "#1A0918",
  "claro",
);

export const INDEX_BRANDS: ShowcaseBrand[] = [
  brand("Wella Profissional", "wella-profissional", "/brands/official/wella-profissional.svg", 91 / 52, 56, "#1A0918", "claro"),
  brand("L'Oréal Professionnel", "loreal-professionnel", "/brands/official/loreal-professionnel.svg", 681 / 264, 52, "#FAF7FB", "escuro"),
  brand("Truss", "truss", "/brands/official/truss.svg", 121 / 43, 40, "#FAF7FB", "escuro"),
  brand("Braé", "brae", "/brands/official/brae.svg", 114 / 24, 30, "#1A0918", "claro"),
  brand("Lola Cosmetics", "lola-cosmetics", "/brands/official/lola-cosmetics.png", 1, 56, "#1A0918", "claro"),
  brand("Amend", "amend", "/brands/official/amend.png", 1200 / 449, 52, "#1A0918", "claro"),
];

export const ALL_SHOWCASE_BRANDS: ShowcaseBrand[] = [FEATURED_BRAND, ...INDEX_BRANDS];

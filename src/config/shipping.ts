export type ShippingZone =
  | "lages"
  | "sc"
  | "sul"
  | "sudeste"
  | "centro_nordeste"
  | "norte";

export const SHIPPING_ZONES: Record<
  ShippingZone,
  { label: string; priceCents: number; etaMin: number; etaMax: number }
> = {
  lages: {
    label: "Entrega local — Lages",
    priceCents: 990,
    etaMin: 1,
    etaMax: 2,
  },
  sc: {
    label: "Santa Catarina",
    priceCents: 1690,
    etaMin: 2,
    etaMax: 4,
  },
  sul: {
    label: "Região Sul",
    priceCents: 2290,
    etaMin: 3,
    etaMax: 6,
  },
  sudeste: {
    label: "Região Sudeste",
    priceCents: 2690,
    etaMin: 4,
    etaMax: 8,
  },
  centro_nordeste: {
    label: "Centro-Oeste e Nordeste",
    priceCents: 3490,
    etaMin: 6,
    etaMax: 12,
  },
  norte: {
    label: "Região Norte",
    priceCents: 4290,
    etaMin: 8,
    etaMax: 15,
  },
}; // valores provisórios — confirmar com a loja

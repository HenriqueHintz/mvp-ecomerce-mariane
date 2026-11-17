import { ShippingZone } from "@/config/shipping";

/**
 * Remove tudo que não for dígito e devolve `null` se não sobrarem exatamente 8 dígitos.
 */
export function normalizeCep(input: string | null | undefined): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  return digits;
}

/**
 * Decide a região de entrega exclusivamente pela faixa numérica do CEP (prefixo de 5 dígitos).
 * Lages (88500–88529) é testada ANTES de Santa Catarina (88000–89999).
 * Nunca utiliza UF ou cidade vindas do navegador ou do ViaCEP.
 */
export function getShippingZone(cep: string | null | undefined): ShippingZone | null {
  const normalized = normalizeCep(cep);
  if (!normalized) return null;

  const prefix = Number(normalized.slice(0, 5));
  if (!Number.isInteger(prefix)) return null;

  // 1. Lages — SC (testado antes da faixa estadual de SC)
  if (prefix >= 88500 && prefix <= 88529) {
    return "lages";
  }

  // 2. Santa Catarina (demais municípios)
  if (prefix >= 88000 && prefix <= 89999) {
    return "sc";
  }

  // 3. Região Sul — PR (80000–87999) e RS (90000–99999)
  if (
    (prefix >= 80000 && prefix <= 87999) ||
    (prefix >= 90000 && prefix <= 99999)
  ) {
    return "sul";
  }

  // 4. Região Sudeste — SP (01000–19999), RJ (20000–28999), ES (29000–29999), MG (30000–39999)
  if (prefix >= 1000 && prefix <= 39999) {
    return "sudeste";
  }

  // 5. Centro-Oeste (70000–76799, 78000–78899, 79000–79999) e Nordeste (40000–65999)
  if (
    (prefix >= 40000 && prefix <= 65999) ||
    (prefix >= 70000 && prefix <= 76799) ||
    (prefix >= 78000 && prefix <= 78899) ||
    (prefix >= 79000 && prefix <= 79999)
  ) {
    return "centro_nordeste";
  }

  // 6. Região Norte (66000–69999, 76800–77999, 78900–78999)
  if (
    (prefix >= 66000 && prefix <= 69999) ||
    (prefix >= 76800 && prefix <= 77999) ||
    (prefix >= 78900 && prefix <= 78999)
  ) {
    return "norte";
  }

  return null;
}

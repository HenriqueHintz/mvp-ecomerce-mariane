/**
 * Mariane Cosméticos — Ponto Único da Verdade para a URL Canônica do Site
 *
 * Utiliza NEXT_PUBLIC_SITE_URL quando definido no ambiente (ex: Vercel em produção),
 * garantindo fallback para o domínio oficial do MVP e sanitização estrita sem barra final.
 */
export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mvp-ecomerce-mariane-ne8c.vercel.app"
).replace(/\/$/, "");

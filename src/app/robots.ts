import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Mariane Cosméticos — Robots.txt Configuration (MetadataRoute.Robots)
 *
 * Configura diretivas de indexação para buscadores gerais e agentes de IA (ChatGPT, Claude, Perplexity),
 * liberando o catálogo público e protegendo rotas transacionais e administrativas.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/checkout", "/carrinho", "/pedido"],
      },
      {
        userAgent: ["ChatGPT-User", "OAI-SearchBot", "Claude-User", "PerplexityBot"],
        allow: "/",
        disallow: ["/admin", "/api", "/checkout", "/carrinho", "/pedido"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

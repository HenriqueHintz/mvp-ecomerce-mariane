import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { db, products, categories } from "@/db";

export const revalidate = 3600; // Revalidação a cada 1 hora

/**
 * Mariane Cosméticos — Dynamic Sitemap (sitemaps.org)
 *
 * Gera dinamicamente o mapa completo de URLs indexáveis para buscadores e agentes de IA,
 * cobrindo páginas estáticas institucionais, catálogo e rotas dinâmicas de categorias e produtos.
 * Rotas administrativas e privadas (/admin, /checkout, /carrinho, /pedido, /api) são estritamente excluídas.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Rotas institucionais e vitrines públicas principais
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/produtos`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/sobre`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/atendimento`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/trocas-e-devolucoes`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/politica-de-privacidade`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Rotas dinâmicas de categorias
  const allCategories = await db.select({ slug: categories.slug }).from(categories);
  const categoryRoutes: MetadataRoute.Sitemap = allCategories.map((cat) => ({
    url: `${SITE_URL}/categoria/${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Rotas dinâmicas de produtos cadastrados no catálogo
  const allProducts = await db
    .select({ slug: products.slug, createdAt: products.createdAt })
    .from(products);

  const productRoutes: MetadataRoute.Sitemap = allProducts.map((prod) => {
    let lastMod = now;
    if (prod.createdAt) {
      const parsed = new Date(prod.createdAt);
      if (!isNaN(parsed.getTime())) {
        lastMod = parsed;
      }
    }

    return {
      url: `${SITE_URL}/produto/${prod.slug}`,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

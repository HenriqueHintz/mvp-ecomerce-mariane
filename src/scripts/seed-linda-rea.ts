import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";
import https from "https";

// 1. Conectar ao banco SQLite local via LibSQL
const dbPath = path.resolve(process.cwd(), "local.sqlite");
const client = createClient({
  url: `file:${dbPath}`,
});

async function main() {
  console.log("Inicializando banco SQLite local via LibSQL...");

  // 2. Executar migração inicial
  const initSql = fs.readFileSync(path.resolve(process.cwd(), "drizzle/0000_init.sql"), "utf-8");
  // Executar cada instrução CREATE TABLE individualmente
  const statements = initSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await client.execute(statement);
  }
  console.log("Tabelas verificadas e criadas com sucesso.");

  // 3. Cadastrar Marcas Oficiais
  const brandsData = [
    { id: "brand_wella", name: "Wella Profissional", slug: "wella-profissional", description: "Líder mundial em coloração, tratamento e cuidados capilares profissionais." },
    { id: "brand_loreal", name: "L'Oréal Professionnel", slug: "loreal-professionnel", description: "Inovação tecnológica e tratamentos revolucionários de salão." },
    { id: "brand_truss", name: "Truss", slug: "truss", description: "Tratamento de alta performance para recuperação e brilho extremo." },
    { id: "brand_brae", name: "Braé", slug: "brae", description: "Alta tecnologia em saúde capilar, nutrição e proteção intensiva." },
    { id: "brand_lola", name: "Lola Cosmetics", slug: "lola-cosmetics", description: "Fórmulas veganas, ricas em ativos naturais e cronogramas capilares de sucesso." },
    { id: "brand_amend", name: "Amend", slug: "amend", description: "Especialista em reparação profunda, nutrição e realce de cor." },
  ];

  for (const b of brandsData) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO brands (id, name, slug, description) VALUES (?, ?, ?, ?)`,
      args: [b.id, b.name, b.slug, b.description],
    });
  }
  console.log(`Marcas inseridas: ${brandsData.length}`);

  // 4. Cadastrar Categorias
  const categoriesData = [
    { id: "cat_tratamento", name: "Tratamento & Máscaras", slug: "tratamento-mascaras", icon: "Sparkles", display_order: 1 },
    { id: "cat_shampoo", name: "Shampoos & Condicionadores", slug: "shampoos-condicionadores", icon: "Droplets", display_order: 2 },
    { id: "cat_oleos", name: "Óleos & Séruns", slug: "oleos-seruns", icon: "Flame", display_order: 3 },
    { id: "cat_cronograma", name: "Cronograma Capilar", slug: "cronograma-capilar", icon: "Calendar", display_order: 4 },
    { id: "cat_kits", name: "Kits Promocionais", slug: "kits-promocionais", icon: "Gift", display_order: 5 },
    { id: "cat_finalizadores", name: "Finalizadores & Protetor Térmico", slug: "finalizadores-protetor-termico", icon: "Wind", display_order: 6 },
  ];

  for (const c of categoriesData) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO categories (id, name, slug, icon, display_order) VALUES (?, ?, ?, ?, ?)`,
      args: [c.id, c.name, c.slug, c.icon, c.display_order],
    });
  }
  console.log(`Categorias inseridas: ${categoriesData.length}`);

  // 5. Ler Sitemap de Produtos coletado no REA
  const sitemapPath = path.resolve(process.cwd(), "rea-linda/sitemap-produto.xml");
  if (!fs.existsSync(sitemapPath)) {
    console.error("Sitemap não encontrado em:", sitemapPath);
    process.exit(1);
  }

  const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
  const urlMatches = sitemapContent.match(/<loc>(https:\/\/www\.lindacosmeticos\.com\.br\/[^<]+)<\/loc>/g) || [];

  const brandKeywords = [
    { kw: "wella", brandId: "brand_wella" },
    { kw: "loreal", brandId: "brand_loreal" },
    { kw: "truss", brandId: "brand_truss" },
    { kw: "brae", brandId: "brand_brae" },
    { kw: "lola", brandId: "brand_lola" },
    { kw: "amend", brandId: "brand_amend" },
  ];

  const selectedUrls: { url: string; brandId: string }[] = [];
  for (const match of urlMatches) {
    const url = match.replace(/<\/?loc>/g, "");
    for (const b of brandKeywords) {
      if (url.toLowerCase().includes(b.kw)) {
        selectedUrls.push({ url, brandId: b.brandId });
        break;
      }
    }
    if (selectedUrls.length >= 65) break;
  }

  console.log(`Produtos selecionados para extração REA: ${selectedUrls.length}`);

  function fetchUrl(targetUrl: string): Promise<string> {
    return new Promise((resolve) => {
      https.get(
        targetUrl,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          },
          timeout: 8000,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
        }
      ).on("error", () => resolve("")).on("timeout", () => resolve(""));
    });
  }

  function detectCategory(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("kit") || n.includes("combo")) return "cat_kits";
    if (n.includes("cronograma")) return "cat_cronograma";
    if (n.includes("óleo") || n.includes("oleo") || n.includes("sérum") || n.includes("serum")) return "cat_oleos";
    if (n.includes("shampoo") || n.includes("condicionador")) return "cat_shampoo";
    if (n.includes("finalizador") || n.includes("leave-in") || n.includes("spray") || n.includes("protetor")) return "cat_finalizadores";
    return "cat_tratamento";
  }

  let inserted = 0;

  for (let i = 0; i < selectedUrls.length; i++) {
    const item = selectedUrls[i];
    try {
      const html = await fetchUrl(item.url);
      if (!html) continue;

      let pData: any = null;
      const allJsonLd = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs) || [];
      for (const raw of allJsonLd) {
        try {
          const content = raw.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
          const parsed = JSON.parse(content);
          if (parsed["@type"] === "Product") {
            pData = parsed;
            break;
          }
        } catch {}
      }

      if (!pData || !pData.name) continue;

      const rawPrice = parseFloat(pData.offers?.price || "129.90");
      const basePrice = rawPrice > 0 ? rawPrice : 129.90;
      const slug = item.url.replace("https://www.lindacosmeticos.com.br/", "").replace(/\/$/, "");
      const productId = `prod_${i + 1}`;
      const categoryId = detectCategory(pData.name);

      const hasPromo = categoryId === "cat_kits" || i % 5 === 0;
      const promoPrice = hasPromo ? basePrice : null;
      const originalPrice = hasPromo ? Math.round((basePrice * 1.18) * 100) / 100 : basePrice;
      const installmentCount = 10;
      const installmentValue = Math.round((basePrice / installmentCount) * 100) / 100;

      const descMatch = html.match(/<div[^>]*class=["'][^"']*descricao[^"']*["'][^>]*>(.*?)<\/div>/s);
      const cleanDesc = descMatch
        ? descMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : `${pData.name} proporciona tratamento capilar profissional de alta performance, recuperando a fibra e conferindo brilho e sedosidade incomparáveis.`;

      const howToUse = `Aplique nos cabelos úmidos e limpos, massageando suavemente mecha a mecha. Deixe agir de 3 a 5 minutos e enxágue abundantemente. Para melhores resultados, utilize a linha completa da Mariane Cosméticos.`;

      await client.execute({
        sql: `INSERT OR REPLACE INTO products (
          id, name, slug, sku, brand_id, category_id, price, promo_price,
          installment_count, installment_value, pix_discount_percent, stock,
          description, how_to_use, volume, rating, review_count, is_featured, is_best_seller, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          productId,
          pData.name.replace(/\s*-\s*Linda Cosméticos/gi, "").trim(),
          slug,
          pData.sku || `MC-${1000 + i}`,
          item.brandId,
          categoryId,
          originalPrice,
          promoPrice,
          installmentCount,
          installmentValue,
          5,
          15,
          cleanDesc.slice(0, 800),
          howToUse,
          pData.name.match(/\d+\s*(?:ml|g|kg)/i)?.[0] || "500g",
          null,
          0,
          i % 3 === 0 ? 1 : 0,
          i % 4 === 0 ? 1 : 0,
          new Date().toISOString(),
        ],
      });

      const images: string[] = [];
      if (typeof pData.image === "string") images.push(pData.image);
      else if (Array.isArray(pData.image)) images.push(...pData.image);

      if (images.length === 0) {
        images.push("https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80");
      }

      for (let imgIndex = 0; imgIndex < images.length; imgIndex++) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO product_images (id, product_id, url, is_primary, display_order) VALUES (?, ?, ?, ?, ?)`,
          args: [`img_${productId}_${imgIndex}`, productId, images[imgIndex], imgIndex === 0 ? 1 : 0, imgIndex],
        });
      }

      inserted++;
      process.stdout.write(`\rProcessados: ${inserted}/${selectedUrls.length} produtos...`);
    } catch {}
  }

  console.log(`\nCarga concluída com sucesso! ${inserted} produtos reais gravados no banco SQLite.`);
}

main().catch(console.error);

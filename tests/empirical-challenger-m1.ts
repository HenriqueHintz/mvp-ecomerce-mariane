import http from "node:http";
import fs from "node:fs";
import path from "node:path";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string) {
  results.push({
    name,
    passed: condition,
    details: condition ? details : `FAILED: ${details}`,
  });
  const icon = condition ? "✔" : "✖";
  console.log(`${icon} [${name}] ${details}`);
}

function fetchUrl(url: string): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

const BRANDS = [
  { slug: "madressenza", name: "Madressenza" },
  { slug: "wella-profissional", name: "Wella Profissional" },
  { slug: "loreal-professionnel", name: "L'Oréal Professionnel" },
  { slug: "truss", name: "Truss" },
  { slug: "brae", name: "Braé" },
  { slug: "lola-cosmetics", name: "Lola Cosmetics" },
  { slug: "amend", name: "Amend" },
];

async function runEmpiricalSuite() {
  console.log("==================================================================");
  console.log("   EMPIRICAL CHALLENGER STRESS SUITE — MARIANE COSMÉTICOS M1      ");
  console.log("==================================================================\n");

  // 1. Homepage live endpoint check
  console.log("--- 1. Live Dev Server Routes ---");
  const home = await fetchUrl("http://localhost:3001/");
  assert(home.statusCode === 200, "Homepage HTTP 200", `Status: ${home.statusCode}, Length: ${home.body.length} bytes`);

  const homeHtml = home.body.toString("utf8");

  // Exact Hero copy verification
  assert(
    homeHtml.includes("Linda é a mulher que bem se quer"),
    "Hero Headline Exact Copy",
    "Found exact string: 'Linda é a mulher que bem se quer' without curly quotes"
  );
  assert(
    homeHtml.includes("Curadoria oficial Madressenza, Wella Professionals, Truss, Braé e L&#x27;Oréal Professionnel.") ||
    homeHtml.includes("Curadoria oficial Madressenza, Wella Professionals, Truss, Braé e L'Oréal Professionnel."),
    "Hero Curation Line Exact Copy",
    "Found exact curation copy: 'Curadoria oficial Madressenza, Wella Professionals, Truss, Braé e L\\'Oréal Professionnel.'"
  );
  assert(
    homeHtml.includes("VER CATÁLOGO →") || homeHtml.includes("VER CATÁLOGO &rarr;"),
    "Hero Primary CTA Copy",
    "Found exact button text 'VER CATÁLOGO →'"
  );
  assert(
    homeHtml.includes("COMPRAR PELO WHATSAPP"),
    "Hero Secondary CTA Copy",
    "Found exact button text 'COMPRAR PELO WHATSAPP'"
  );

  // Negative invariants in src/app/page.tsx
  const pageTsxPath = path.resolve("src/app/page.tsx");
  const pageTsxCode = fs.readFileSync(pageTsxPath, "utf8");

  assert(!pageTsxCode.includes("HeroVisualCarousel"), "Negative Invariant: HeroVisualCarousel", "HeroVisualCarousel omitted from src/app/page.tsx");
  assert(!pageTsxCode.includes("Curadoria Oficial Mariane"), "Negative Invariant: Curadoria Oficial Mariane", "Curadoria Oficial Mariane omitted from src/app/page.tsx");
  assert(!pageTsxCode.includes("Destaques & Linhas em Alta"), "Negative Invariant: Destaques & Linhas em Alta", "Destaques & Linhas em Alta omitted from src/app/page.tsx");
  assert(!pageTsxCode.includes("Guia de Tratamento Capilar"), "Negative Invariant: Guia de Tratamento Capilar", "Guia de Tratamento Capilar omitted from src/app/page.tsx");

  // 2. Brand photo URLs on dev server
  console.log("\n--- 2. Brand Photo Live HTTP Endpoints ---");
  for (const b of BRANDS) {
    const brandUrl = `http://localhost:3001/brands/${b.slug}.webp`;
    const res = await fetchUrl(brandUrl);
    const contentType = res.headers["content-type"] || "";
    const is200 = res.statusCode === 200;
    const isWebp = contentType.includes("image/webp");
    const nonZero = res.body.length > 5000;
    assert(
      is200 && isWebp && nonZero,
      `Brand Image HTTP: ${b.slug}.webp`,
      `HTTP ${res.statusCode}, Content-Type: ${contentType}, Size: ${res.body.length} bytes`
    );

    // Verify WebP magic bytes: RIFF....WEBP
    const isRiff = res.body.toString("ascii", 0, 4) === "RIFF";
    const isWebpMagic = res.body.toString("ascii", 8, 12) === "WEBP";
    assert(
      isRiff && isWebpMagic,
      `WebP Magic Bytes: ${b.slug}.webp`,
      `RIFF header: ${isRiff}, WEBP magic: ${isWebpMagic}`
    );
  }

  // 3. Catalog routes for all 7 brands
  console.log("\n--- 3. Brand Catalog Live HTTP Routes ---");
  for (const b of BRANDS) {
    const routeUrl = `http://localhost:3001/produtos?marca=${b.slug}`;
    const res = await fetchUrl(routeUrl);
    assert(
      res.statusCode === 200,
      `Catalog Filter Route: ?marca=${b.slug}`,
      `HTTP ${res.statusCode}, Body length: ${res.body.length} bytes`
    );
  }

  // 4. Edge Cases and Concurrency Stress Tests
  console.log("\n--- 4. Edge Cases & Concurrency Stress Tests ---");
  // Invalid brand slug
  const invalidBrandRes = await fetchUrl("http://localhost:3001/produtos?marca=nonexistent_xyz_brand_123");
  assert(
    invalidBrandRes.statusCode === 200,
    "Invalid Brand Slug Handling",
    `Status ${invalidBrandRes.statusCode} (graceful fallback/empty state rendered without crashing)`
  );

  // Concurrency stress test: 28 simultaneous requests
  const startConc = Date.now();
  const promises: Promise<{ statusCode: number }>[] = [];
  for (let i = 0; i < 4; i++) {
    for (const b of BRANDS) {
      promises.push(fetchUrl(`http://localhost:3001/brands/${b.slug}.webp`));
    }
  }
  const concResults = await Promise.all(promises);
  const all200 = concResults.every((r) => r.statusCode === 200);
  const durConc = Date.now() - startConc;
  assert(
    all200 && concResults.length === 28,
    "Concurrent Image Requests (28 concurrent)",
    `All 28 concurrent requests returned HTTP 200 in ${durConc}ms`
  );

  // 5. Accessibility and Responsive Markup Inspection
  console.log("\n--- 5. Accessibility and Responsive Markup Inspection ---");
  const brandCarouselFile = path.resolve("src/components/BrandCarousel.tsx");
  const brandCarouselSource = fs.readFileSync(brandCarouselFile, "utf8");

  // Check alt texts
  assert(
    brandCarouselSource.includes("alt={b.alt}") || brandCarouselSource.includes("alt="),
    "Image Alt Attribute Present",
    "BrandCarousel sets dynamic alt attribute for each brand photo"
  );

  // Check responsive sizes attribute
  assert(
    brandCarouselSource.includes("sizes="),
    "Next.js Responsive Sizes Attribute",
    "BrandCarousel defines responsive sizes attribute for Next.js Image optimization"
  );

  // Check link roles / anchors
  assert(
    brandCarouselSource.includes("href={`/produtos?marca=${b.slug}`}") || brandCarouselSource.includes("href={`/produtos?marca="),
    "Brand Anchor Links Pattern",
    "Links point dynamically to /produtos?marca=${b.slug}"
  );

  // Check grid responsive classes
  assert(
    brandCarouselSource.includes("grid-cols-2") && brandCarouselSource.includes("lg:grid-cols-7"),
    "Responsive Grid Markup",
    "Grid defines 2 cols on mobile scaling up to 7 cols on large desktop"
  );

  // Summary
  console.log("\n==================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runEmpiricalSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

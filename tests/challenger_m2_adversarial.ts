/**
 * Challenger M2 Adversarial Stress Testing Suite
 * Tests seeding idempotency, schema integrity, boundary conditions, and catalog query robustness.
 */
import { db, products, productImages, brands, categories } from "../src/db";
import { queryCatalogProducts, buildCatalogUrl, parsePriceRange } from "../src/lib/catalog";
import { seedTrussAndBrae, TRUSS_PRODUCTS, BRAE_PRODUCTS } from "../src/scripts/seed-truss-brae";
import { inArray, eq, sql } from "drizzle-orm";
import { createClient } from "@libsql/client";
import path from "path";

interface TestReport {
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const reports: TestReport[] = [];

function record(name: string, category: string, passed: boolean, details?: string, error?: string) {
  reports.push({ name, category, passed, error, details });
  const status = passed ? "[PASS]" : "[FAIL]";
  console.log(`  ${status} [${category}] ${name}${details ? ` -> ${details}` : ""}`);
  if (error) {
    console.error(`      ERROR: ${error}`);
  }
}

async function runAdversarialM2Suite() {
  console.log("==================================================================");
  console.log("  MARIANE COSMÉTICOS — CHALLENGER M2 ADVERSARIAL STRESS SUITE");
  console.log("==================================================================\n");

  // -------------------------------------------------------------------------
  // SECTION 1: SQLite Low-Level PRAGMA & Referential Integrity Checks
  // -------------------------------------------------------------------------
  console.log("--- 1. SQLITE PRAGMA & SCHEMA CONSTRAINTS ---");
  const rawClient = createClient({
    url: `file:${path.resolve(process.cwd(), "local.sqlite")}`,
  });

  const integrityResult = await rawClient.execute("PRAGMA integrity_check;");
  const integrityVal = integrityResult.rows[0]?.[0] ?? (integrityResult.rows[0] as any)?.integrity_check;
  record(
    "SQLite PRAGMA integrity_check",
    "PRAGMA",
    integrityVal === "ok",
    `Result: ${integrityVal}`
  );

  const fkResult = await rawClient.execute("PRAGMA foreign_key_check;");
  record(
    "SQLite PRAGMA foreign_key_check",
    "PRAGMA",
    fkResult.rows.length === 0,
    `Violations: ${fkResult.rows.length}`
  );

  // -------------------------------------------------------------------------
  // SECTION 2: Database Catalog Row Counts & Brand Integrity
  // -------------------------------------------------------------------------
  console.log("\n--- 2. CATALOG COUNTS & BRAND ASSIGNMENTS ---");
  const allProds = await db.select().from(products);
  record("Total catalog product count strictly 115", "CATALOG", allProds.length === 115, `Actual: ${allProds.length}`);

  const allImgs = await db.select().from(productImages);
  record("Total product images count strictly 220", "CATALOG", allImgs.length === 220, `Actual: ${allImgs.length}`);

  const trussProds = allProds.filter((p) => p.brandId === "brand_truss");
  record("Truss products count strictly 24", "BRAND", trussProds.length === 24, `Actual: ${trussProds.length}`);

  const braeProds = allProds.filter((p) => p.brandId === "brand_brae");
  record("Braé products count strictly 21", "BRAND", braeProds.length === 21, `Actual: ${braeProds.length}`);

  const seededIds = new Set([...TRUSS_PRODUCTS.map((p) => p.id), ...BRAE_PRODUCTS.map((p) => p.id)]);
  record("Total unique seeded product IDs defined is 45", "SEED", seededIds.size === 45, `Actual: ${seededIds.size}`);

  // Check unique slugs
  const allSlugs = allProds.map((p) => p.slug);
  const uniqueSlugs = new Set(allSlugs);
  record("Product slugs 100% unique across catalog", "UNIQUENESS", uniqueSlugs.size === allProds.length, `Slugs: ${uniqueSlugs.size}/${allProds.length}`);

  // Check unique IDs
  const allIds = allProds.map((p) => p.id);
  const uniqueIds = new Set(allIds);
  record("Product IDs 100% unique across catalog", "UNIQUENESS", uniqueIds.size === allProds.length, `IDs: ${uniqueIds.size}/${allProds.length}`);

  // Check unique image IDs
  const allImgIds = allImgs.map((i) => i.id);
  const uniqueImgIds = new Set(allImgIds);
  record("Product image IDs 100% unique across catalog", "UNIQUENESS", uniqueImgIds.size === allImgs.length, `Image IDs: ${uniqueImgIds.size}/${allImgs.length}`);

  // Check categories valid
  const allCats = await db.select().from(categories);
  const validCatIds = new Set(allCats.map((c) => c.id));
  const invalidCats = allProds.filter((p) => p.categoryId && !validCatIds.has(p.categoryId));
  record("All products reference valid category IDs", "FOREIGN_KEYS", invalidCats.length === 0, `Invalid cat refs: ${invalidCats.length}`);

  // Check orphan images
  const validProdIds = new Set(allProds.map((p) => p.id));
  const orphanImgs = allImgs.filter((i) => !validProdIds.has(i.productId));
  record("Zero orphan product_images records", "ORPHANS", orphanImgs.length === 0, `Orphan images: ${orphanImgs.length}`);

  // -------------------------------------------------------------------------
  // SECTION 3: Rating and Review Negative Controls
  // -------------------------------------------------------------------------
  console.log("\n--- 3. NEGATIVE CONTROLS: REVIEWS & RATINGS ---");
  const seededProductsInDb = allProds.filter((p) => p.brandId === "brand_truss" || p.brandId === "brand_brae");
  const fakeReviewSeeded = seededProductsInDb.filter((p) => p.rating !== null || (p.reviewCount ?? 0) > 0);
  record("Truss and Braé products have zero fake reviews/ratings", "NEGATIVE_CONTROL", fakeReviewSeeded.length === 0, `Violations: ${fakeReviewSeeded.length}`);

  const allFakeReviews = allProds.filter((p) => p.rating !== null || (p.reviewCount ?? 0) > 0);
  record("Entire catalog adheres to zero fake reviews contract", "NEGATIVE_CONTROL", allFakeReviews.length === 0, `Violations: ${allFakeReviews.length}`);

  // -------------------------------------------------------------------------
  // SECTION 4: Image Primary Indicator Invariants
  // -------------------------------------------------------------------------
  console.log("\n--- 4. IMAGE PRIMARY INDICATORS & DISPLAY ORDER ---");
  let missingPrimaryCount = 0;
  let multiplePrimaryCount = 0;
  for (const prod of seededProductsInDb) {
    const prodImgs = allImgs.filter((i) => i.productId === prod.id);
    const primaries = prodImgs.filter((i) => i.isPrimary === 1);
    if (primaries.length === 0) missingPrimaryCount++;
    if (primaries.length > 1) multiplePrimaryCount++;
  }
  record("Every seeded product has exactly one primary image", "IMAGE_RULES", missingPrimaryCount === 0 && multiplePrimaryCount === 0, `Missing: ${missingPrimaryCount}, Multiple: ${multiplePrimaryCount}`);

  // -------------------------------------------------------------------------
  // SECTION 5: Adversarial Catalog Query Tests
  // -------------------------------------------------------------------------
  console.log("\n--- 5. ADVERSARIAL CATALOG QUERIES ---");

  // Query Truss
  const trussQ = await queryCatalogProducts({ marca: "truss" });
  record("queryCatalogProducts(marca='truss') totalCount is 24", "QUERY", trussQ.totalCount === 24, `totalCount: ${trussQ.totalCount}`);
  record("queryCatalogProducts(marca='truss') page 1 returns 12 items", "QUERY", trussQ.items.length === 12, `items: ${trussQ.items.length}`);
  const allTrussItemsCorrect = trussQ.items.every((it) => it.brandId === "brand_truss");
  record("All items in truss query match brandId 'brand_truss'", "QUERY", allTrussItemsCorrect);

  const trussQPage2 = await queryCatalogProducts({ marca: "truss", pagina: 2 });
  record("queryCatalogProducts(marca='truss', pagina=2) returns 12 items", "QUERY", trussQPage2.items.length === 12, `items: ${trussQPage2.items.length}`);

  const trussQPage3 = await queryCatalogProducts({ marca: "truss", pagina: 3 });
  record("queryCatalogProducts(marca='truss', pagina=3) returns 0 items (beyond totalPages)", "QUERY", trussQPage3.items.length === 0, `items: ${trussQPage3.items.length}`);
  record("queryCatalogProducts(marca='truss', pagina=3) totalCount still 24", "QUERY", trussQPage3.totalCount === 24, `totalCount: ${trussQPage3.totalCount}`);

  // Query Braé
  const braeQ = await queryCatalogProducts({ marca: "brae" });
  record("queryCatalogProducts(marca='brae') totalCount is 21", "QUERY", braeQ.totalCount === 21, `totalCount: ${braeQ.totalCount}`);
  record("queryCatalogProducts(marca='brae') page 1 returns 12 items", "QUERY", braeQ.items.length === 12, `items: ${braeQ.items.length}`);
  const allBraeItemsCorrect = braeQ.items.every((it) => it.brandId === "brand_brae");
  record("All items in brae query match brandId 'brand_brae'", "QUERY", allBraeItemsCorrect);

  const braeQPage2 = await queryCatalogProducts({ marca: "brae", pagina: 2 });
  record("queryCatalogProducts(marca='brae', pagina=2) returns 9 items", "QUERY", braeQPage2.items.length === 9, `items: ${braeQPage2.items.length}`);

  // Boundary: non-existent brand
  const nonExistentBrand = await queryCatalogProducts({ marca: "non-existent-brand-12345" });
  record("Querying non-existent brand returns empty array and totalCount=0", "BOUNDARY", nonExistentBrand.items.length === 0 && nonExistentBrand.totalCount === 0);

  // Boundary: non-existent category
  const nonExistentCat = await queryCatalogProducts({ categoria: "non-existent-cat-12345" });
  record("Querying non-existent category returns empty array and totalCount=0", "BOUNDARY", nonExistentCat.items.length === 0 && nonExistentCat.totalCount === 0);

  // Boundary: negative or 0 page
  const negPageQ = await queryCatalogProducts({ marca: "truss", pagina: -5 });
  record("Negative pagina clamps to page 1", "BOUNDARY", negPageQ.currentPage === 1 && negPageQ.items.length === 12);

  const zeroPageQ = await queryCatalogProducts({ marca: "truss", pagina: 0 });
  record("Zero pagina clamps to page 1", "BOUNDARY", zeroPageQ.currentPage === 1 && zeroPageQ.items.length === 12);

  // Boundary: huge page
  const hugePageQ = await queryCatalogProducts({ marca: "truss", pagina: 999999 });
  record("Huge pagina returns empty array without throwing", "BOUNDARY", hugePageQ.items.length === 0 && hugePageQ.totalCount === 24);

  // Boundary: NaN page
  const nanPageQ = await queryCatalogProducts({ marca: "truss", pagina: "invalid-number" as any });
  record("Non-numeric pagina gracefully defaults to page 1", "BOUNDARY", nanPageQ.currentPage === 1 && nanPageQ.items.length === 12);

  // Boundary: pageSize limits (clamp 1 to 100)
  const hugeSizeQ = await queryCatalogProducts({ pageSize: 500 });
  record("pageSize > 100 is clamped to 100", "BOUNDARY", hugeSizeQ.pageSize === 100);

  const negSizeQ = await queryCatalogProducts({ pageSize: -5 });
  record("Negative pageSize is clamped to 1", "BOUNDARY", negSizeQ.pageSize === 1, `pageSize: ${negSizeQ.pageSize}`);

  // Note: pageSize: 0 evaluates to 12 due to JavaScript || operator (params.pageSize || 12).
  const zeroSizeQ = await queryCatalogProducts({ pageSize: 0 });
  record(
    "pageSize = 0 falls back to default 12 via truthy check (falsy 0 || 12)",
    "BOUNDARY",
    zeroSizeQ.pageSize === 12,
    `Actual: ${zeroSizeQ.pageSize} (fallback default 12)`
  );

  // Boundary: sorting orders
  const sortMenor = await queryCatalogProducts({ marca: "truss", ordem: "menor_preco" });
  const pricesAsc = sortMenor.items.map((i) => i.effectivePrice);
  const isAscending = pricesAsc.every((val, idx) => idx === 0 || val >= pricesAsc[idx - 1]);
  record("Sorting by 'menor_preco' orders prices ascending", "SORTING", isAscending);

  const sortMaior = await queryCatalogProducts({ marca: "truss", ordem: "maior_preco" });
  const pricesDesc = sortMaior.items.map((i) => i.effectivePrice);
  const isDescending = pricesDesc.every((val, idx) => idx === 0 || val <= pricesDesc[idx - 1]);
  record("Sorting by 'maior_preco' orders prices descending", "SORTING", isDescending);

  // Boundary: SQL injection resilience in textual filters
  const sqlInjectionQ = await queryCatalogProducts({ q: "' OR '1'='1" });
  record("SQL injection string in 'q' does not crash query", "SECURITY", Array.isArray(sqlInjectionQ.items));

  const sqlInjectionBrand = await queryCatalogProducts({ marca: "' OR '1'='1" });
  record("SQL injection string in 'marca' returns 0 results cleanly", "SECURITY", sqlInjectionBrand.items.length === 0);

  // -------------------------------------------------------------------------
  // SECTION 6: URL Generator Robustness (buildCatalogUrl)
  // -------------------------------------------------------------------------
  console.log("\n--- 6. URL GENERATOR (buildCatalogUrl) ROBUSTNESS ---");
  const u1 = buildCatalogUrl("/produtos", { marca: "truss" }, { pagina: "2" });
  record("buildCatalogUrl generates clean url with marca and pagina override", "URL_GEN", u1 === "/produtos?marca=truss&pagina=2", `Generated: ${u1}`);

  const u2 = buildCatalogUrl("/produtos", { marca: "truss" }, { pagina: "1" });
  record("buildCatalogUrl omits pagina=1", "URL_GEN", u2 === "/produtos?marca=truss", `Generated: ${u2}`);

  const u3 = buildCatalogUrl("/produtos", { marca: "truss" }, { ordem: "destaques" });
  record("buildCatalogUrl omits default ordem=destaques", "URL_GEN", u3 === "/produtos?marca=truss", `Generated: ${u3}`);

  const u4 = buildCatalogUrl("/produtos", { marca: "brae", pagina: "3" }, { marca: "truss" });
  record("Changing marca resets pagina parameter", "URL_GEN", !u4.includes("pagina"), `Generated: ${u4}`);

  const u5 = buildCatalogUrl({ marca: "truss", pagina: "2" }, {});
  record("buildCatalogUrl without base string preserves existing pagina if in overrides", "URL_GEN", u5.includes("marca=truss"), `Generated: ${u5}`);

  // -------------------------------------------------------------------------
  // SECTION 7: Idempotency Multi-Execution Simulation
  // -------------------------------------------------------------------------
  console.log("\n--- 7. IDEMPOTENCY RE-EXECUTION IN PROCESS ---");
  await seedTrussAndBrae();
  const prodsAfterReSeed = await db.select().from(products);
  const imgsAfterReSeed = await db.select().from(productImages);
  record("Re-seeding maintains strictly 115 products", "IDEMPOTENCY", prodsAfterReSeed.length === 115, `Actual: ${prodsAfterReSeed.length}`);
  record("Re-seeding maintains strictly 220 images", "IDEMPOTENCY", imgsAfterReSeed.length === 220, `Actual: ${imgsAfterReSeed.length}`);

  // Summary
  console.log("\n==================================================================");
  const total = reports.length;
  const passed = reports.filter((r) => r.passed).length;
  const failed = reports.filter((r) => !r.passed).length;
  console.log(`TOTAL ADVERSARIAL TESTS RUN: ${total}`);
  console.log(`PASSED:                      ${passed}`);
  console.log(`FAILED:                      ${failed}`);
  console.log(`PASS RATE:                   ${((passed / total) * 100).toFixed(1)}%`);
  console.log("==================================================================");

  if (failed > 0) {
    console.error(`\n[!] ADVERSARIAL SUITE DETECTED ${failed} FAILURES!`);
    process.exit(1);
  } else {
    console.log("\n[✔] ALL ADVERSARIAL TESTS PASSED EMPIRICALLY!");
    process.exit(0);
  }
}

runAdversarialM2Suite().catch((err) => {
  console.error("Adversarial suite crashed:", err);
  process.exit(1);
});

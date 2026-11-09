/**
 * Challenger M3_1: Automated Image Link & Asset Header Adversarial Oracle
 * Milestone: M3 — Product Imagery Sourcing, Generation & Local Storage
 *
 * Verifies:
 * 1. Database Integrity: All 220 product_images rows in local.sqlite, 115 products, PRAGMA foreign_key_check.
 * 2. URL Format: 100% of URLs begin with '/products/', zero external URLs (http/https), zero path traversal/unsafe chars.
 * 3. Physical Disk Presence: Every single URL maps to a real physical file under public/.
 * 4. Fallback Asset: public/products/fallback.webp exists, size < 50 KB, exact 800x800 dimensions.
 * 5. WebP Binary Integrity: RIFF...WEBP magic bytes, chunk integrity, exact 1000x1000 dimensions for all 220 product images.
 * 6. File Size Budget: < 150 KB per product image, > 1 KB (no empty/stub files).
 * 7. Negative Controls: Zero Unsplash URLs in runtime source files, 1 primary image per product invariant.
 */

import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "..");
const DB_PATH = path.resolve(ROOT_DIR, "local.sqlite");
const PUBLIC_DIR = path.resolve(ROOT_DIR, "public");

let passed = 0;
let failures: string[] = [];

function recordPass(testName: string, detail?: string) {
  passed++;
  console.log(`  [PASS] ${testName}${detail ? ` -> ${detail}` : ""}`);
}

function recordFail(testName: string, error: string) {
  failures.push(`${testName}: ${error}`);
  console.log(`  [FAIL] ${testName} -> ${error}`);
}

export function parseWebPDimensions(buf: Buffer): { width: number; height: number; format: string } {
  if (buf.length < 30) throw new Error(`Buffer too small (${buf.length} bytes) to be valid WebP`);

  const riff = buf.subarray(0, 4).toString("ascii");
  const webp = buf.subarray(8, 12).toString("ascii");
  if (riff !== "RIFF" || webp !== "WEBP") {
    throw new Error(`Invalid magic header: ${riff}...${webp} (expected RIFF...WEBP)`);
  }

  const chunkType = buf.subarray(12, 16).toString("ascii");
  if (chunkType === "VP8 ") {
    // Lossy VP8 format
    const w = buf.readUInt16LE(26) & 0x3fff;
    const h = buf.readUInt16LE(28) & 0x3fff;
    return { width: w, height: h, format: "VP8 (lossy)" };
  } else if (chunkType === "VP8L") {
    // Lossless VP8L format
    const b0 = buf[21];
    const b1 = buf[22];
    const b2 = buf[23];
    const b3 = buf[24];
    const w = 1 + (((b1 & 0x3f) << 8) | b0);
    const h = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width: w, height: h, format: "VP8L (lossless)" };
  } else if (chunkType === "VP8X") {
    // Extended VP8X format
    const w = 1 + buf.readUIntLE(24, 3);
    const h = 1 + buf.readUIntLE(27, 3);
    return { width: w, height: h, format: "VP8X (extended)" };
  }

  throw new Error(`Unsupported or unrecognized WebP chunk type: '${chunkType}'`);
}

async function runM3ImageOracle() {
  console.log("==================================================================");
  console.log("  MARIANE COSMÉTICOS — CHALLENGER M3_1 IMAGE ORACLE & HARNESS");
  console.log("==================================================================");

  // -----------------------------------------------------------------------------
  // SECTION 1: DATABASE INTEGRITY & CONSTRAINTS
  // -----------------------------------------------------------------------------
  console.log("\n[SECTION 1] Database Referential Integrity & Schema Constraints");

  if (!fs.existsSync(DB_PATH)) {
    recordFail("Database File Presence", `Database not found at ${DB_PATH}`);
    return;
  }
  recordPass("Database File Presence", `Found ${DB_PATH}`);

  const client = createClient({ url: `file:${DB_PATH}` });

  // 1.1 PRAGMA foreign_key_check
  const fkResult = await client.execute("PRAGMA foreign_key_check");
  if (fkResult.rows.length === 0) {
    recordPass("PRAGMA foreign_key_check", "0 violations found");
  } else {
    recordFail("PRAGMA foreign_key_check", `${fkResult.rows.length} FK violations detected`);
  }

  // 1.2 Exact Product Count (115)
  const productCountRes = await client.execute("SELECT count(*) as cnt FROM products");
  const totalProducts = Number(productCountRes.rows[0].cnt);
  if (totalProducts === 115) {
    recordPass("Total Products Invariant", "Found exactly 115 products in catalog");
  } else {
    recordFail("Total Products Invariant", `Expected 115 products, found ${totalProducts}`);
  }

  // 1.3 Exact Product Images Count (220)
  const imageCountRes = await client.execute("SELECT count(*) as cnt FROM product_images");
  const totalImages = Number(imageCountRes.rows[0].cnt);
  if (totalImages === 220) {
    recordPass("Total Product Images Invariant", "Found exactly 220 product image rows in local.sqlite");
  } else {
    recordFail("Total Product Images Invariant", `Expected 220 image rows, found ${totalImages}`);
  }

  // 1.4 Primary Image Invariant (Exactly 1 primary image per product)
  const primaryInvariantRes = await client.execute(`
    SELECT p.id, p.slug, count(pi.id) as img_count, sum(pi.is_primary) as prim_count
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    GROUP BY p.id
    HAVING img_count = 0 OR prim_count != 1
  `);
  if (primaryInvariantRes.rows.length === 0) {
    recordPass("Primary Image Contract", "100% of 115 products have exactly 1 primary image (is_primary = 1)");
  } else {
    recordFail("Primary Image Contract", `${primaryInvariantRes.rows.length} products violate primary image invariant`);
  }

  // 1.5 Zero External URLs Invariant
  const externalUrlsRes = await client.execute(`
    SELECT count(*) as cnt FROM product_images WHERE url LIKE 'http://%' OR url LIKE 'https://%'
  `);
  const externalCount = Number(externalUrlsRes.rows[0].cnt);
  if (externalCount === 0) {
    recordPass("Zero External URLs Invariant", "0 external CDN/Unsplash URLs remain in product_images");
  } else {
    recordFail("Zero External URLs Invariant", `Found ${externalCount} external URLs in product_images`);
  }

  // 1.6 All URLs start with '/products/'
  const nonProductUrlsRes = await client.execute(`
    SELECT count(*) as cnt FROM product_images WHERE url NOT LIKE '/products/%'
  `);
  const nonProductCount = Number(nonProductUrlsRes.rows[0].cnt);
  if (nonProductCount === 0) {
    recordPass("Local URL Prefix Contract", "100% of 220 URLs strictly begin with '/products/'");
  } else {
    recordFail("Local URL Prefix Contract", `Found ${nonProductCount} URLs not starting with '/products/'`);
  }

  // -----------------------------------------------------------------------------
  // SECTION 2: PHYSICAL DISK ASSET PRESENCE & MAPPING
  // -----------------------------------------------------------------------------
  console.log("\n[SECTION 2] Physical Disk Asset Presence & Path Mapping");

  // Query all 220 image rows
  const allImagesRes = await client.execute(`
    SELECT pi.id, pi.product_id, pi.url, pi.is_primary, pi.display_order, p.slug as product_slug, b.slug as brand_slug
    FROM product_images pi
    JOIN products p ON pi.product_id = p.id
    JOIN brands b ON p.brand_id = b.id
    ORDER BY b.slug, p.slug, pi.display_order
  `);

  let missingDiskFiles = 0;
  let invalidPathChars = 0;

  for (const row of allImagesRes.rows) {
    const url = String(row.url);
    // Negative checks on URL string
    if (url.includes("..") || url.includes("//") || url.includes("?") || url.includes("#")) {
      invalidPathChars++;
      recordFail(`URL Path Safety (${row.id})`, `Unsafe characters in URL: ${url}`);
    }

    const relPath = url.replace(/^\//, "");
    const diskPath = path.resolve(PUBLIC_DIR, relPath);

    if (!fs.existsSync(diskPath)) {
      missingDiskFiles++;
      recordFail(`Disk File Missing (${row.id})`, `File not found on disk at: ${diskPath}`);
    }
  }

  if (invalidPathChars === 0) {
    recordPass("URL String Path Safety", "All 220 image URLs are clean relative paths without traversal/query params");
  }

  if (missingDiskFiles === 0) {
    recordPass("Physical Disk Mapping (220/220)", "All 220 database image URLs map directly to existing files in public/");
  }

  // -----------------------------------------------------------------------------
  // SECTION 3: FALLBACK ASSET VALIDATION
  // -----------------------------------------------------------------------------
  console.log("\n[SECTION 3] Universal Fallback Asset Validation");

  const fallbackPath = path.resolve(PUBLIC_DIR, "products", "fallback.webp");
  if (!fs.existsSync(fallbackPath)) {
    recordFail("Fallback Asset Presence", `public/products/fallback.webp not found`);
  } else {
    recordPass("Fallback Asset Presence", `Found at ${fallbackPath}`);

    const stat = fs.statSync(fallbackPath);
    const sizeKB = stat.size / 1024;

    // Check size budget < 50 KB and > 1 KB
    if (stat.size > 1024 && stat.size < 50 * 1024) {
      recordPass("Fallback Size Budget", `${stat.size} bytes (${sizeKB.toFixed(2)} KB < 50 KB ceiling)`);
    } else {
      recordFail("Fallback Size Budget", `Invalid size: ${stat.size} bytes (must be between 1 KB and 50 KB)`);
    }

    // Binary validation & dimensions
    const buf = fs.readFileSync(fallbackPath);
    try {
      const parsed = parseWebPDimensions(buf);
      if (parsed.width === 800 && parsed.height === 800) {
        recordPass("Fallback Dimensions", `800x800 px exact square (${parsed.format})`);
      } else {
        recordFail("Fallback Dimensions", `Expected 800x800 px, got ${parsed.width}x${parsed.height}`);
      }
    } catch (err: any) {
      recordFail("Fallback Header Parse", err.message);
    }
  }

  // -----------------------------------------------------------------------------
  // SECTION 4: BINARY HEADER, DIMENSIONS & FILE SIZE BUDGET ACROSS ALL 220 ASSETS
  // -----------------------------------------------------------------------------
  console.log("\n[SECTION 4] Binary Header, Exact Dimensions & Budget Checks (220 Product Assets)");

  let corruptedHeaders = 0;
  let wrongDimensions = 0;
  let oversizedFiles = 0;
  let undersizedFiles = 0;
  let minSize = Infinity;
  let maxSize = -Infinity;
  let totalBytes = 0;

  for (const row of allImagesRes.rows) {
    const url = String(row.url);
    const relPath = url.replace(/^\//, "");
    const diskPath = path.resolve(PUBLIC_DIR, relPath);

    if (!fs.existsSync(diskPath)) continue;

    const stat = fs.statSync(diskPath);
    const sz = stat.size;
    totalBytes += sz;
    if (sz < minSize) minSize = sz;
    if (sz > maxSize) maxSize = sz;

    // Size budget: < 150 KB (153,600 bytes), > 1 KB (1,024 bytes)
    if (sz >= 150 * 1024) {
      oversizedFiles++;
      recordFail(`File Size Ceiling (${row.product_slug})`, `${sz} bytes exceeds 150 KB budget`);
    }
    if (sz < 1024) {
      undersizedFiles++;
      recordFail(`File Size Floor (${row.product_slug})`, `${sz} bytes is below 1 KB stub threshold`);
    }

    // Binary inspection
    const buf = fs.readFileSync(diskPath);
    try {
      const parsed = parseWebPDimensions(buf);
      if (parsed.width !== 1000 || parsed.height !== 1000) {
        wrongDimensions++;
        recordFail(`Dimension Contract (${row.product_slug})`, `Expected 1000x1000, got ${parsed.width}x${parsed.height}`);
      }
    } catch (err: any) {
      corruptedHeaders++;
      recordFail(`Binary Corruption (${row.product_slug})`, err.message);
    }
  }

  if (corruptedHeaders === 0) {
    recordPass("Binary Header & Magic Bytes", "100% of 220 files have valid RIFF...WEBP magic bytes and parse cleanly");
  }

  if (wrongDimensions === 0) {
    recordPass("1000x1000 Dimension Contract", "100% of 220 product images strictly measure 1000x1000 px");
  }

  if (oversizedFiles === 0 && undersizedFiles === 0) {
    const avgKB = (totalBytes / 220 / 1024).toFixed(2);
    const minKB = (minSize / 1024).toFixed(2);
    const maxKB = (maxSize / 1024).toFixed(2);
    recordPass(
      "File Size Budget (< 150 KB)",
      `All 220 files strictly within budget [Min: ${minKB} KB, Max: ${maxKB} KB, Avg: ${avgKB} KB]`
    );
  }

  // -----------------------------------------------------------------------------
  // SECTION 5: DISK COHESION & DIRECTORY AUDIT
  // -----------------------------------------------------------------------------
  console.log("\n[SECTION 5] Disk Directory Audit across 7 Partner Brands");

  const brandDirs = ["amend", "brae", "lola-cosmetics", "loreal-professionnel", "madressenza", "truss", "wella-profissional"];
  let totalDiskAssets = 0;

  for (const b of brandDirs) {
    const dirPath = path.resolve(PUBLIC_DIR, "products", b);
    if (!fs.existsSync(dirPath)) {
      recordFail(`Brand Directory (${b})`, `Directory not found: ${dirPath}`);
      continue;
    }

    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".webp"));
    totalDiskAssets += files.length;
    recordPass(`Brand Directory (${b})`, `${files.length} WebP files present on disk`);
  }

  recordPass("Total Disk Assets", `Found ${totalDiskAssets} brand assets + 1 fallback on disk`);

  // -----------------------------------------------------------------------------
  // SECTION 6: RUNTIME CODEBASE NEGATIVE CONTROLS (UNSPLASH PURGE)
  // -----------------------------------------------------------------------------
  console.log("\n[SECTION 6] Runtime Codebase Unsplash Purge & Fallback Reference Check");

  const runtimeFiles = [
    "src/app/page.tsx",
    "src/components/ProductCard.tsx",
    "src/lib/catalog.ts",
    "src/app/produto/[slug]/page.tsx",
  ];

  let unsplashMatches = 0;
  for (const rel of runtimeFiles) {
    const fullPath = path.resolve(ROOT_DIR, rel);
    if (!fs.existsSync(fullPath)) {
      recordFail(`Runtime File Presence (${rel})`, "File not found");
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    if (content.includes("images.unsplash.com")) {
      unsplashMatches++;
      recordFail(`Unsplash URL Purge (${rel})`, "Found remaining reference to images.unsplash.com");
    } else {
      recordPass(`Unsplash URL Purge (${rel})`, "Zero references to images.unsplash.com");
    }

    // Verify /products/fallback.webp presence
    if (content.includes("/products/fallback.webp")) {
      recordPass(`Fallback Reference (${rel})`, "Correctly references '/products/fallback.webp'");
    }
  }

  // -----------------------------------------------------------------------------
  // SUMMARY REPORT & VERDICT
  // -----------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log("  CHALLENGER M3_1 IMAGE ORACLE SUMMARY REPORT");
  console.log("==================================================================");
  console.log(`Total Passed: ${passed} | Failures: ${failures.length}`);

  if (failures.length > 0) {
    console.log("\nVERDICT: REJECT");
    console.log("Failure details:");
    failures.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
    process.exit(1);
  } else {
    console.log("\nVERDICT: APPROVE");
    console.log("All empirical verification requirements satisfied without exceptions.");
  }
}

runM3ImageOracle().catch((err) => {
  console.error("FATAL ERROR in runM3ImageOracle:", err);
  process.exit(1);
});

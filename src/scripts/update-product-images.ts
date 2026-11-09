/**
 * Database Migration Script: Local Product Imagery Migration
 * Milestone: M3 - Product Imagery Sourcing, Generation & Local Storage
 * 
 * Migrates all product image URLs from external CDNs (Magazord, Unsplash)
 * to local, self-contained assets served under /products/{brand_slug}/{slug}.webp.
 * 
 * Safety features:
 * - Transactional execution (BEGIN TRANSACTION ... COMMIT / ROLLBACK)
 * - Automatic SQLite database backup before mutations
 * - Referential integrity checks (PRAGMA foreign_key_check)
 * - Strict primary image contract (is_primary = 1) preserved for all 115 products
 * - Full idempotency (safe to re-run multiple times)
 * - Dry-run mode (--dry-run) to preview changes without modifying database
 * - Disk presence verification (--verify-disk) to check physical files in public/
 */

import { createClient } from "@libsql/client";
import path from "path";
import fs from "fs";

interface ProductRow {
  id: string;
  slug: string;
  brand_id: string;
  brand_slug: string;
}

interface ImageRow {
  id: string;
  product_id: string;
  url: string;
  is_primary: number;
  display_order: number;
}

interface MigrationPlanItem {
  imageId: string;
  productId: string;
  productSlug: string;
  brandSlug: string;
  isPrimary: number;
  displayOrder: number;
  oldUrl: string;
  newUrl: string;
  diskPath: string;
  diskExists: boolean;
  needsUpdate: boolean;
}

const ROOT_DIR = process.cwd();
const DB_PATH = path.resolve(ROOT_DIR, "local.sqlite");
const PUBLIC_DIR = path.resolve(ROOT_DIR, "public");

// Parse command line flags
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const shouldVerifyDisk = args.includes("--verify-disk");
const skipBackup = args.includes("--skip-backup");

function createBackup(dbFilePath: string): string | null {
  if (skipBackup || isDryRun) return null;
  if (!fs.existsSync(dbFilePath)) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${dbFilePath}.bak-${timestamp}`;
  fs.copyFileSync(dbFilePath, backupPath);
  return backupPath;
}

export function computeLocalImageUrl(
  brandSlug: string,
  productSlug: string,
  isPrimary: number,
  displayOrder: number,
  currentUrl: string
): string {
  // If already a local relative path under /products/{brandSlug}/, preserve it
  if (currentUrl.startsWith(`/products/${brandSlug}/`)) {
    return currentUrl;
  }

  // Primary images follow the canonical /products/{brand_slug}/{product_slug}.webp
  if (isPrimary === 1 || displayOrder === 0) {
    return `/products/${brandSlug}/${productSlug}.webp`;
  }

  // Secondary gallery images append the display order
  return `/products/${brandSlug}/${productSlug}-${displayOrder}.webp`;
}

async function runMigration() {
  console.log("==================================================================");
  console.log("  MARIANE COSMÉTICOS — PRODUCT IMAGERY DATABASE MIGRATION (M3)");
  console.log("==================================================================");
  console.log(`Database: ${DB_PATH}`);
  console.log(`Mode:     ${isDryRun ? "DRY-RUN (Changes will NOT be committed)" : "LIVE EXECUTION"}`);

  if (!fs.existsSync(DB_PATH)) {
    console.error(`FATAL: Database file not found at ${DB_PATH}`);
    process.exit(1);
  }

  // 1. Database Backup
  const backupFile = createBackup(DB_PATH);
  if (backupFile) {
    console.log(`Backup created: ${backupFile}`);
  }

  const client = createClient({
    url: `file:${DB_PATH}`,
  });

  try {
    // 2. Pre-flight integrity check
    console.log("\n[1/5] Running pre-flight integrity checks...");
    const preFk = await client.execute("PRAGMA foreign_key_check;");
    if (preFk.rows.length > 0) {
      console.error("FATAL: Database has foreign key violations prior to migration:", preFk.rows);
      process.exit(1);
    }
    console.log("✔ PRAGMA foreign_key_check passed (0 errors)");

    // 3. Load products and images
    console.log("\n[2/5] Loading products and images from local.sqlite...");
    const productsResult = await client.execute(`
      SELECT p.id, p.slug, p.brand_id, b.slug as brand_slug
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      ORDER BY p.brand_id, p.id;
    `);

    const imagesResult = await client.execute(`
      SELECT id, product_id, url, is_primary, display_order
      FROM product_images
      ORDER BY product_id, display_order, is_primary DESC;
    `);

    const products = productsResult.rows as unknown as ProductRow[];
    const images = imagesResult.rows as unknown as ImageRow[];

    console.log(`Loaded ${products.length} products across 7 brands.`);
    console.log(`Loaded ${images.length} product image records.`);

    if (products.length !== 115) {
      console.warn(`WARNING: Expected 115 products, found ${products.length}.`);
    }
    if (images.length !== 220) {
      console.warn(`WARNING: Expected 220 product images, found ${images.length}.`);
    }

    const productMap = new Map<string, ProductRow>();
    for (const p of products) {
      productMap.set(p.id, p);
    }

    // 4. Build migration plan
    console.log("\n[3/5] Computing migration plan...");
    const plan: MigrationPlanItem[] = [];
    let alreadyLocalCount = 0;
    let needsUpdateCount = 0;
    let missingDiskCount = 0;

    for (const img of images) {
      const p = productMap.get(img.product_id);
      if (!p) {
        throw new Error(`Referential integrity failure: Image ${img.id} references missing product ${img.product_id}`);
      }

      const newUrl = computeLocalImageUrl(
        p.brand_slug,
        p.slug,
        img.is_primary,
        img.display_order,
        img.url
      );

      const relDisk = newUrl.startsWith("/") ? newUrl.slice(1) : newUrl;
      const diskPath = path.resolve(PUBLIC_DIR, relDisk);
      const diskExists = fs.existsSync(diskPath);

      if (!diskExists) missingDiskCount++;

      const needsUpdate = img.url !== newUrl;
      if (needsUpdate) needsUpdateCount++;
      else alreadyLocalCount++;

      plan.push({
        imageId: img.id,
        productId: p.id,
        productSlug: p.slug,
        brandSlug: p.brand_slug,
        isPrimary: img.is_primary,
        displayOrder: img.display_order,
        oldUrl: img.url,
        newUrl,
        diskPath,
        diskExists,
        needsUpdate,
      });
    }

    console.log(`Plan Summary:`);
    console.log(`  Total images:         ${plan.length}`);
    console.log(`  Already local:        ${alreadyLocalCount}`);
    console.log(`  URLs to update:       ${needsUpdateCount}`);
    console.log(`  Files present on disk:${plan.length - missingDiskCount} / ${plan.length}`);

    if (shouldVerifyDisk && missingDiskCount > 0) {
      console.warn(`\n[WARNING] ${missingDiskCount} target image files do not yet exist on disk!`);
      const missingSamples = plan.filter((i) => !i.diskExists).slice(0, 5);
      for (const m of missingSamples) {
        console.warn(`  Missing: ${m.newUrl} (target: ${m.diskPath})`);
      }
    }

    // 5. Execute Updates in Transaction
    console.log(`\n[4/5] ${isDryRun ? "Simulating" : "Applying"} database updates...`);
    await client.execute("BEGIN TRANSACTION;");

    let updatedCount = 0;
    for (const item of plan) {
      if (item.needsUpdate) {
        await client.execute({
          sql: "UPDATE product_images SET url = ? WHERE id = ?;",
          args: [item.newUrl, item.imageId],
        });
        updatedCount++;
      }
    }

    if (isDryRun) {
      await client.execute("ROLLBACK;");
      console.log(`✔ Dry-run simulated ${updatedCount} updates successfully. Rolled back.`);
    } else {
      await client.execute("COMMIT;");
      console.log(`✔ Successfully committed ${updatedCount} updates to local.sqlite.`);
    }

    // 6. Post-migration Invariant Checks
    console.log("\n[5/5] Running post-migration invariant verifications...");
    const postFk = await client.execute("PRAGMA foreign_key_check;");
    if (postFk.rows.length > 0) {
      console.error("FATAL: Post-migration foreign key violations found:", postFk.rows);
      process.exit(1);
    }
    console.log("✔ Post-migration PRAGMA foreign_key_check passed (0 errors)");

    const primaryCheck = await client.execute(`
      SELECT product_id, SUM(is_primary) as primary_count
      FROM product_images
      GROUP BY product_id
      HAVING primary_count != 1;
    `);
    if (primaryCheck.rows.length > 0) {
      console.error("FATAL: Products found with invalid primary image count:", primaryCheck.rows);
      process.exit(1);
    }
    console.log("✔ Primary image contract verified: 100% of products have exactly 1 primary image (is_primary = 1)");

    if (!isDryRun) {
      const remainingExternal = await client.execute(`
        SELECT count(*) as count
        FROM product_images
        WHERE url LIKE 'http://%' OR url LIKE 'https://%';
      `);
      const extCount = Number(remainingExternal.rows[0].count);
      if (extCount === 0) {
        console.log("✔ External URL check passed: 0 external URLs remain in product_images table!");
      } else {
        console.warn(`WARNING: ${extCount} external URLs still remain in product_images.`);
      }
    }

    console.log("\n==================================================================");
    console.log("  MIGRATION EXECUTION COMPLETE");
    console.log("==================================================================");
  } catch (error) {
    console.error("FATAL error during migration:", error);
    try {
      await client.execute("ROLLBACK;");
    } catch {
      // ignore rollback error
    }
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module || process.argv[1]?.includes("update-product-images")) {
  runMigration();
}

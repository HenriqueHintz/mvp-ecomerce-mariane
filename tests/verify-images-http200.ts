/**
 * Automated Image Verification Suite — HTTP 200 & MIME Type Integrity
 * Milestone: M4 — Image Verification Suite & E2E Validation
 * File: tests/verify-images-http200.ts
 *
 * Verifies 100% of product, hero, brand, and store branding image assets:
 * 1. Physical file existence and non-zero byte size on disk.
 * 2. Next.js server lifecycle management (reuses active port 3001 or spawns/teardown cleanly on Windows).
 * 3. Live HTTP GET requests returning status 200 OK (zero 404s, zero 500s).
 * 4. Content-Type header matching expected image MIME types.
 * 5. Non-empty response bodies (> 0 bytes) and valid binary magic bytes (RIFF/WEBP, PNG, SVG, ICO).
 */

import { spawn, execSync, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { createClient } from "@libsql/client";
import { HERO_SLIDES } from "../src/data/hero-slides";

const ROOT_DIR = path.resolve(__dirname, "..");
const PORT = process.env.PORT || "3001";
const BASE_URL = `http://localhost:${PORT}`;
const CONCURRENCY = 12;
const HEALTH_CHECK_URL = `${BASE_URL}/logo.svg`;
const STARTUP_TIMEOUT_MS = 45000;
const REQUEST_TIMEOUT_MS = 20000;
const RETRY_MAX_ATTEMPTS = 2;
const RETRY_BACKOFF_MS = 500;

export type ImageCategory =
  | "DB Products"
  | "Fallback"
  | "Hero Backgrounds"
  | "Brand Logos"
  | "Store Branding";

export interface ImageTarget {
  url: string;
  category: ImageCategory;
  expectedMime: string;
  diskPath: string;
}

export interface VerificationFailure {
  target: ImageTarget;
  phase: "Physical" | "HTTP" | "MIME" | "MagicBytes" | "Network";
  error: string;
  status?: number;
  receivedMime?: string;
  bytesReceived?: number;
}

let spawnedProcess: ChildProcess | null = null;
let spawnedByRunner = false;

// ======================================================================
// 1. Windows-Safe Process Lifecycle Management
// ======================================================================

export function killSpawnedServer(): void {
  if (!spawnedByRunner || !spawnedProcess || spawnedProcess.pid === undefined) return;
  const pid = spawnedProcess.pid;
  spawnedProcess = null;
  spawnedByRunner = false;

  console.log(`\n[Lifecycle] Shutting down spawned Next.js server (PID ${pid})...`);
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(-pid, "SIGTERM");
    }
    console.log(`[Lifecycle] Server process (PID ${pid}) cleanly terminated.`);
  } catch {
    // Process already exited or terminated
  }
}

process.on("exit", killSpawnedServer);
process.on("SIGINT", () => {
  console.log("\n[Runner] Interrupted by SIGINT");
  killSpawnedServer();
  process.exit(130);
});
process.on("SIGTERM", () => {
  console.log("\n[Runner] Interrupted by SIGTERM");
  killSpawnedServer();
  process.exit(143);
});
process.on("uncaughtException", (err) => {
  console.error("\n[Runner] Uncaught exception:", err);
  killSpawnedServer();
  process.exit(1);
});

async function isServerReady(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_CHECK_URL, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function prewarmAppRouterRoutes(): Promise<void> {
  const dynamicRoutes = ["/icon.svg", "/apple-icon.png"];
  process.stdout.write("[Lifecycle] Pre-warming App Router metadata routes... ");
  for (const route of dynamicRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`, {
        method: "GET",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (res.status === 200) {
        await res.arrayBuffer(); // drain response buffer
      }
    } catch {
      // Non-fatal during pre-warming; verifySingleTarget will catch and report if permanent
    }
  }
  // Brief 500ms settling pause to allow Next.js compiler worker threads to idle
  await new Promise((r) => setTimeout(r, 500));
  console.log("Ready.");
}

async function ensureServerRunning(): Promise<void> {
  if (await isServerReady()) {
    console.log(`[Lifecycle] Active server detected on ${BASE_URL} (reusing existing process)`);
    spawnedByRunner = false;
    await prewarmAppRouterRoutes();
    return;
  }

  console.log(`[Lifecycle] No server on ${BASE_URL}. Spawning Next.js dev server on port ${PORT}...`);
  spawnedByRunner = true;
  const isWin = process.platform === "win32";

  spawnedProcess = spawn(
    isWin ? "cmd.exe" : "npx",
    isWin ? ["/c", "npx", "next", "dev", "-p", String(PORT)] : ["next", "dev", "-p", String(PORT)],
    {
      cwd: ROOT_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT: String(PORT) },
    }
  );

  let serverOutput = "";
  spawnedProcess.stdout?.on("data", (chunk) => {
    serverOutput += chunk.toString();
    if (serverOutput.length > 4000) serverOutput = serverOutput.slice(-4000);
  });
  spawnedProcess.stderr?.on("data", (chunk) => {
    serverOutput += chunk.toString();
    if (serverOutput.length > 4000) serverOutput = serverOutput.slice(-4000);
  });

  const startTime = Date.now();
  process.stdout.write(`[Lifecycle] Polling readiness on ${HEALTH_CHECK_URL} `);

  while (Date.now() - startTime < STARTUP_TIMEOUT_MS) {
    if (await isServerReady()) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n[Lifecycle] Server is ready on ${BASE_URL} (${elapsed}s elapsed)`);
      await prewarmAppRouterRoutes();
      console.log("");
      return;
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 500));
  }

  killSpawnedServer();
  console.error(`\n[Lifecycle] ERROR: Server failed to start within ${STARTUP_TIMEOUT_MS / 1000}s.`);
  console.error(`[Lifecycle] Recent server output:\n${serverOutput}`);
  throw new Error(`Server failed to start on ${BASE_URL}`);
}

// ======================================================================
// 2. Target Manifest Gathering
// ======================================================================

function resolveDiskPath(url: string): string {
  if (url === "/icon.svg") {
    return path.join(ROOT_DIR, "src", "app", "icon.svg");
  }
  if (url === "/apple-icon.png") {
    return path.join(ROOT_DIR, "src", "app", "apple-icon.png");
  }
  const cleanPath = url.replace(/^\//, "");
  return path.join(ROOT_DIR, "public", cleanPath);
}

export async function collectAllTargets(): Promise<ImageTarget[]> {
  const targets: ImageTarget[] = [];

  // A. Database Products (220)
  const dbPath = path.join(ROOT_DIR, "local.sqlite");
  const client = createClient({ url: `file:${dbPath}` });
  const dbRes = await client.execute(
    "SELECT DISTINCT url FROM product_images WHERE url IS NOT NULL ORDER BY url ASC"
  );
  for (const row of dbRes.rows) {
    const url = String(row.url);
    targets.push({
      url,
      category: "DB Products",
      expectedMime: "image/webp",
      diskPath: resolveDiskPath(url),
    });
  }

  // B. Universal Fallback
  targets.push({
    url: "/products/fallback.webp",
    category: "Fallback",
    expectedMime: "image/webp",
    diskPath: resolveDiskPath("/products/fallback.webp"),
  });

  // C. Hero Carousel Slides (6)
  for (const slide of HERO_SLIDES) {
    targets.push({
      url: slide.desktop,
      category: "Hero Backgrounds",
      expectedMime: "image/webp",
      diskPath: resolveDiskPath(slide.desktop),
    });
    targets.push({
      url: slide.mobile,
      category: "Hero Backgrounds",
      expectedMime: "image/webp",
      diskPath: resolveDiskPath(slide.mobile),
    });
  }

  // D. Partner Brand Cards & Logos (14)
  const brandsDir = path.join(ROOT_DIR, "public", "brands");
  if (fs.existsSync(brandsDir)) {
    const brandFiles = fs.readdirSync(brandsDir).sort();
    for (const f of brandFiles) {
      if (f.endsWith(".webp")) {
        targets.push({
          url: `/brands/${f}`,
          category: "Brand Logos",
          expectedMime: "image/webp",
          diskPath: path.join(brandsDir, f),
        });
      } else if (f.endsWith(".png")) {
        targets.push({
          url: `/brands/${f}`,
          category: "Brand Logos",
          expectedMime: "image/png",
          diskPath: path.join(brandsDir, f),
        });
      }
    }
  }

  // E. Store Identity & Metadata Icons (9)
  const brandingList = [
    { url: "/favicon.ico", mime: "image/x-icon" },
    { url: "/logo.svg", mime: "image/svg+xml" },
    { url: "/logo-nav.png", mime: "image/png" },
    { url: "/logo-white.png", mime: "image/png" },
    { url: "/logo-mariane-banner.png", mime: "image/png" },
    { url: "/icon.svg", mime: "image/svg+xml" },
    { url: "/apple-icon.png", mime: "image/png" },
    { url: "/logo-horizontal.svg", mime: "image/svg+xml" },
    { url: "/logo-rect.svg", mime: "image/svg+xml" },
  ];
  for (const b of brandingList) {
    targets.push({
      url: b.url,
      category: "Store Branding",
      expectedMime: b.mime,
      diskPath: resolveDiskPath(b.url),
    });
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return targets.filter((t) => {
    if (seen.has(t.url)) return false;
    seen.add(t.url);
    return true;
  });
}

// ======================================================================
// 3. Header & Magic Bytes Validation
// ======================================================================

function matchesMime(receivedMime: string, expectedMime: string): boolean {
  const received = receivedMime.split(";")[0].trim().toLowerCase();
  const expected = expectedMime.split(";")[0].trim().toLowerCase();

  if (received === expected) return true;

  // ICO aliases
  if (
    (expected === "image/x-icon" || expected === "image/vnd.microsoft.icon") &&
    (received === "image/x-icon" || received === "image/vnd.microsoft.icon")
  ) {
    return true;
  }

  // App router icon route aliases
  if (
    expected === "image/svg+xml" &&
    (received === "image/svg+xml" || received === "image/x-icon")
  ) {
    return true;
  }

  return false;
}

function validateMagicBytes(buf: Buffer, expectedType: string): { valid: boolean; reason?: string } {
  if (buf.length < 4) {
    return { valid: false, reason: `Buffer too small (${buf.length} bytes)` };
  }

  if (expectedType === "image/webp") {
    if (buf.length < 12) return { valid: false, reason: "WebP buffer too small" };
    const riff = buf.subarray(0, 4).toString("ascii");
    const webp = buf.subarray(8, 12).toString("ascii");
    if (riff !== "RIFF" || webp !== "WEBP") {
      return { valid: false, reason: `Invalid WebP header: ${riff}...${webp} (expected RIFF...WEBP)` };
    }
    return { valid: true };
  }

  if (expectedType === "image/png") {
    if (buf.length < 8) return { valid: false, reason: "PNG buffer too small" };
    const isPng =
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a;
    if (!isPng) {
      return { valid: false, reason: "Invalid PNG signature header" };
    }
    return { valid: true };
  }

  if (expectedType === "image/svg+xml") {
    const text = buf.subarray(0, Math.min(buf.length, 1024)).toString("utf-8");
    if (!text.includes("<svg") && !text.includes("<?xml")) {
      return { valid: false, reason: "SVG does not contain <svg or <?xml header" };
    }
    return { valid: true };
  }

  if (expectedType === "image/x-icon" || expectedType === "image/vnd.microsoft.icon") {
    if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) {
      return { valid: true };
    }
    return { valid: false, reason: "Invalid ICO header (expected 0x00000100)" };
  }

  return { valid: true };
}

// ======================================================================
// 4. Verification Execution
// ======================================================================

async function verifySingleTarget(
  target: ImageTarget,
  maxRetries = RETRY_MAX_ATTEMPTS,
  backoffMs = RETRY_BACKOFF_MS
): Promise<VerificationFailure | null> {
  const fullUrl = `${BASE_URL}${target.url}`;
  let lastFailure: VerificationFailure | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Fresh AbortSignal on each attempt
      const res = await fetch(fullUrl, {
        method: "GET",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (res.status !== 200) {
        // Transient server error (5xx): retry if attempts remain
        if (res.status >= 500 && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
          continue;
        }
        // Deterministic error (404, 403, or exhausted 5xx) -> fast-fail without retry
        return {
          target,
          phase: "HTTP",
          status: res.status,
          error: `Expected HTTP 200, received HTTP ${res.status}`,
        };
      }

      const contentType = res.headers.get("content-type") || "";
      if (!matchesMime(contentType, target.expectedMime)) {
        return {
          target,
          phase: "MIME",
          status: res.status,
          receivedMime: contentType,
          error: `MIME mismatch: expected '${target.expectedMime}', received '${contentType}'`,
        };
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        return {
          target,
          phase: "HTTP",
          status: res.status,
          bytesReceived: 0,
          error: "Response body was 0 bytes (empty file)",
        };
      }

      const magicCheck = validateMagicBytes(buffer, target.expectedMime);
      if (!magicCheck.valid) {
        return {
          target,
          phase: "MagicBytes",
          status: res.status,
          bytesReceived: buffer.length,
          error: magicCheck.reason || "Magic bytes validation failed",
        };
      }

      return null; // Passed all checks!
    } catch (err: any) {
      lastFailure = {
        target,
        phase: "Network",
        error: `Network/fetch error: ${err.message || String(err)}`,
      };

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
        continue;
      }
    }
  }

  return lastFailure;
}

async function runVerificationPool(
  targets: ImageTarget[],
  concurrency: number
): Promise<{ passed: number; failures: VerificationFailure[] }> {
  const failures: VerificationFailure[] = [];
  let index = 0;
  let passedCount = 0;

  async function worker() {
    while (index < targets.length) {
      const current = index++;
      const target = targets[current];
      const failure = await verifySingleTarget(target);
      if (failure) {
        failures.push(failure);
      } else {
        passedCount++;
      }

      const totalDone = passedCount + failures.length;
      process.stdout.write(
        `\r[HTTP Pool] Verifying assets: ${totalDone}/${targets.length} (PASS: ${passedCount}, FAIL: ${failures.length})`
      );
    }
  }

  const workerCount = Math.min(concurrency, targets.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  process.stdout.write("\n");

  return { passed: passedCount, failures };
}

// ======================================================================
// 5. Main Test Runner Entrypoint
// ======================================================================

export async function runSuite(): Promise<number> {
  console.log("==================================================================");
  console.log("  MARIANE COSMÉTICOS — HTTP 200 IMAGE VERIFICATION SUITE");
  console.log("==================================================================");
  console.log(`Node: ${process.version} | Platform: ${process.platform} | Target: ${BASE_URL}`);
  console.log(`Concurrency: ${CONCURRENCY} | Startup Timeout: ${STARTUP_TIMEOUT_MS / 1000}s`);

  // 1. Gather Manifest
  console.log("\n--- STEP 1: GATHERING ASSET MANIFEST ---");
  const targets = await collectAllTargets();

  const categoryCounts: Record<ImageCategory, number> = {
    "DB Products": 0,
    Fallback: 0,
    "Hero Backgrounds": 0,
    "Brand Logos": 0,
    "Store Branding": 0,
  };
  for (const t of targets) {
    categoryCounts[t.category]++;
  }

  console.log(`  • DB Products:      ${categoryCounts["DB Products"]} URLs`);
  console.log(`  • Universal Fallback: ${categoryCounts["Fallback"]} URL`);
  console.log(`  • Hero Backgrounds:   ${categoryCounts["Hero Backgrounds"]} URLs`);
  console.log(`  • Brand Cards/Logos:  ${categoryCounts["Brand Logos"]} URLs`);
  console.log(`  • Store Branding:     ${categoryCounts["Store Branding"]} URLs`);
  console.log(`  • Total Unique Manifest: ${targets.length} image URLs`);

  // 2. Phase 1: Physical File Presence on Disk
  console.log("\n--- STEP 2: PHASE 1 — PHYSICAL DISK INTEGRITY CHECK ---");
  const physicalFailures: VerificationFailure[] = [];
  for (const t of targets) {
    if (!fs.existsSync(t.diskPath)) {
      physicalFailures.push({
        target: t,
        phase: "Physical",
        error: `File not found on disk: ${t.diskPath}`,
      });
    } else {
      const stat = fs.statSync(t.diskPath);
      if (stat.size === 0) {
        physicalFailures.push({
          target: t,
          phase: "Physical",
          error: `File is 0 bytes on disk: ${t.diskPath}`,
        });
      }
    }
  }

  if (physicalFailures.length > 0) {
    console.error(`  [FAIL] ${physicalFailures.length} files missing or empty on disk!`);
    for (const f of physicalFailures) {
      console.error(`    - [${f.target.category}] ${f.target.url} -> ${f.error}`);
    }
    return 1;
  }
  console.log(`  [PASS] 100% of ${targets.length} assets physically present and non-empty on disk.`);

  // 3. Phase 2: Live HTTP 200 Verification
  console.log("\n--- STEP 3: PHASE 2 — LIVE HTTP 200 ENDPOINT VERIFICATION ---");
  await ensureServerRunning();

  const startTime = Date.now();
  const { passed, failures } = await runVerificationPool(targets, CONCURRENCY);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // 4. Teardown if spawned by runner
  killSpawnedServer();

  // 5. Results Reporting
  console.log("\n==================================================================");
  console.log("  VERIFICATION RESULTS BY CATEGORY");
  console.log("==================================================================");

  const categoryResults: Record<ImageCategory, { total: number; pass: number; fail: number }> = {
    "DB Products": { total: 0, pass: 0, fail: 0 },
    Fallback: { total: 0, pass: 0, fail: 0 },
    "Hero Backgrounds": { total: 0, pass: 0, fail: 0 },
    "Brand Logos": { total: 0, pass: 0, fail: 0 },
    "Store Branding": { total: 0, pass: 0, fail: 0 },
  };

  const failedTargetsByUrl = new Map(failures.map((f) => [f.target.url, f]));

  for (const t of targets) {
    const stat = categoryResults[t.category];
    stat.total++;
    if (failedTargetsByUrl.has(t.url)) {
      stat.fail++;
    } else {
      stat.pass++;
    }
  }

  for (const [cat, res] of Object.entries(categoryResults)) {
    const statusMark = res.fail === 0 ? "[PASS]" : "[FAIL]";
    console.log(
      `  ${statusMark} ${cat.padEnd(18)} : ${res.pass}/${res.total} OK (${((res.pass / res.total) * 100).toFixed(1)}%)`
    );
  }

  console.log("------------------------------------------------------------------");
  console.log(`Total URLs Verified : ${targets.length}`);
  console.log(`Passed HTTP 200     : ${passed}`);
  console.log(`Failed / Errors     : ${failures.length}`);
  console.log(`Execution Duration  : ${duration}s`);
  console.log("==================================================================");

  if (failures.length > 0) {
    console.error(`\n❌ VERIFICATION FAILED: ${failures.length} asset(s) failed verification:\n`);
    for (const f of failures) {
      console.error(`  • [${f.target.category}] ${f.target.url}`);
      console.error(`    Phase : ${f.phase}`);
      console.error(`    Error : ${f.error}`);
      if (f.status) console.error(`    Status: HTTP ${f.status}`);
      if (f.receivedMime) console.error(`    Received MIME: ${f.receivedMime}`);
      if (f.bytesReceived !== undefined) console.error(`    Bytes : ${f.bytesReceived}`);
      console.error("");
    }
    return 1;
  }

  console.log(`\n✅ VERDICT: ALL ${targets.length} IMAGE ASSETS SERVED HTTP 200 WITH VALID MIME HEADERS!\n`);
  return 0;
}

if (require.main === module) {
  runSuite()
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((err) => {
      console.error("\nFatal error during image verification suite:", err);
      killSpawnedServer();
      process.exit(1);
    });
}

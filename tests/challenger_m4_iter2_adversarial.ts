import http from "node:http";
import { spawn, execSync, ChildProcess } from "node:child_process";
import path from "node:path";
import { createClient } from "@libsql/client";

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;
const ROOT_DIR = path.resolve(__dirname, "..");
const DB_PATH = path.join(ROOT_DIR, "local.sqlite");

interface TestTarget {
  category: string;
  url: string;
  expectedMime: string;
  brand?: string;
}

interface TestResult {
  target: TestTarget;
  passed: boolean;
  status?: number;
  mime?: string;
  bytes?: number;
  durationMs: number;
  error?: string;
}

let spawnedProcess: ChildProcess | null = null;

function checkPortFree(): boolean {
  try {
    const stdout = execSync(`powershell -Command "Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue"`, {
      encoding: "utf-8",
    });
    return stdout.trim().length === 0;
  } catch {
    return true; // Error usually means no connection found
  }
}

async function isServerReady(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/logo.svg`, { timeout: 1500 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServer(): Promise<boolean> {
  if (await isServerReady()) {
    console.log(`[Lifecycle] Server is already running on ${BASE_URL}`);
    return false; // Did not spawn
  }

  console.log(`[Lifecycle] Spawning Next.js dev server on port ${PORT}...`);
  const nextBin = path.join(ROOT_DIR, "node_modules", "next", "dist", "bin", "next");

  spawnedProcess = spawn(process.execPath, [nextBin, "dev", "-p", String(PORT)], {
    cwd: ROOT_DIR,
    stdio: ["pipe", "ignore", "ignore"],
    detached: false,
  });

  const start = Date.now();
  while (Date.now() - start < 40000) {
    if (await isServerReady()) {
      console.log(`[Lifecycle] Server ready in ${((Date.now() - start) / 1000).toFixed(1)}s`);
      // Warm up dynamic routes
      try {
        await Promise.all([
          fetch(`${BASE_URL}/icon.svg`, { signal: AbortSignal.timeout(15000) }).then((r) => r.arrayBuffer()),
          fetch(`${BASE_URL}/apple-icon.png`, { signal: AbortSignal.timeout(15000) }).then((r) => r.arrayBuffer()),
        ]);
        console.log(`[Lifecycle] Pre-warmed App Router metadata routes.`);
      } catch (err) {
        console.warn(`[Lifecycle] Note during pre-warming:`, err);
      }
      return true; // Spawned
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`Server failed to start on port ${PORT} within 40s`);
}

function stopServer() {
  if (spawnedProcess && spawnedProcess.pid) {
    console.log(`[Lifecycle] Terminating server PID ${spawnedProcess.pid}...`);
    try {
      execSync(`taskkill /pid ${spawnedProcess.pid} /T /F`, { stdio: "ignore" });
    } catch {
      // Ignored
    }
    spawnedProcess = null;
  }
}

function validateMagicBytes(buf: Buffer, mime: string): { valid: boolean; reason?: string } {
  if (buf.length < 4) {
    return { valid: false, reason: `Buffer too small: ${buf.length} bytes` };
  }

  if (mime === "image/webp") {
    if (buf.length < 12) return { valid: false, reason: "WebP buffer < 12 bytes" };
    const riff = buf.subarray(0, 4).toString("ascii");
    const webp = buf.subarray(8, 12).toString("ascii");
    if (riff !== "RIFF" || webp !== "WEBP") {
      return { valid: false, reason: `Invalid WebP header: RIFF='${riff}', WEBP='${webp}'` };
    }
    return { valid: true };
  }

  if (mime === "image/png") {
    if (buf.length < 8) return { valid: false, reason: "PNG buffer < 8 bytes" };
    const expected = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (!buf.subarray(0, 8).equals(expected)) {
      return { valid: false, reason: "Invalid PNG signature" };
    }
    return { valid: true };
  }

  if (mime === "image/svg+xml") {
    const text = buf.subarray(0, Math.min(1024, buf.length)).toString("utf-8");
    if (!text.includes("<svg") && !text.includes("<?xml")) {
      return { valid: false, reason: "Missing <svg or <?xml tag in SVG body" };
    }
    return { valid: true };
  }

  if (mime === "image/x-icon" || mime === "image/vnd.microsoft.icon") {
    if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) {
      return { valid: true };
    }
    return { valid: false, reason: "Invalid ICO header (expected 00 00 01 00)" };
  }

  return { valid: true };
}

function matchesMime(received: string, expected: string): boolean {
  const r = received.split(";")[0].trim().toLowerCase();
  const e = expected.split(";")[0].trim().toLowerCase();
  if (r === e) return true;
  if ((e === "image/x-icon" || e === "image/vnd.microsoft.icon") && (r === "image/x-icon" || r === "image/vnd.microsoft.icon")) {
    return true;
  }
  if (e === "image/svg+xml" && (r === "image/svg+xml" || r === "image/x-icon")) {
    return true;
  }
  return false;
}

async function auditTarget(target: TestTarget, timeoutMs = 8000): Promise<TestResult> {
  const url = `${BASE_URL}${target.url}`;
  const t0 = performance.now();

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const durationMs = performance.now() - t0;
    const contentType = res.headers.get("content-type") || "";

    if (res.status !== 200) {
      return {
        target,
        passed: false,
        status: res.status,
        mime: contentType,
        durationMs,
        error: `Expected HTTP 200, got ${res.status}`,
      };
    }

    if (!matchesMime(contentType, target.expectedMime)) {
      return {
        target,
        passed: false,
        status: res.status,
        mime: contentType,
        durationMs,
        error: `MIME mismatch: expected '${target.expectedMime}', got '${contentType}'`,
      };
    }

    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    if (buf.length === 0) {
      return {
        target,
        passed: false,
        status: res.status,
        mime: contentType,
        bytes: 0,
        durationMs,
        error: `Received empty body (0 bytes)`,
      };
    }

    const magic = validateMagicBytes(buf, target.expectedMime);
    if (!magic.valid) {
      return {
        target,
        passed: false,
        status: res.status,
        mime: contentType,
        bytes: buf.length,
        durationMs,
        error: `Magic bytes validation failed: ${magic.reason}`,
      };
    }

    return {
      target,
      passed: true,
      status: res.status,
      mime: contentType,
      bytes: buf.length,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = performance.now() - t0;
    return {
      target,
      passed: false,
      durationMs,
      error: `Network/Fetch error: ${err.message || String(err)}`,
    };
  }
}

async function gatherSampleTargets(): Promise<TestTarget[]> {
  const targets: TestTarget[] = [];
  const client = createClient({ url: `file:${DB_PATH}` });

  const brands = [
    "madressenza",
    "wella-profissional",
    "loreal-professionnel",
    "truss",
    "brae",
    "lola-cosmetics",
    "amend",
  ];

  // 1. Sample product images from each of the 7 brands (3 per brand)
  for (const brandSlug of brands) {
    const res = await client.execute({
      sql: `
        SELECT pi.url
        FROM product_images pi
        JOIN products p ON pi.product_id = p.id
        JOIN brands b ON p.brand_id = b.id
        WHERE b.slug = ?
        ORDER BY p.name ASC
        LIMIT 3
      `,
      args: [brandSlug],
    });
    for (const row of res.rows) {
      targets.push({
        category: `Product (${brandSlug})`,
        brand: brandSlug,
        url: String(row.url),
        expectedMime: "image/webp",
      });
    }
  }

  // 2. Fallback image
  targets.push({
    category: "Fallback",
    url: "/products/fallback.webp",
    expectedMime: "image/webp",
  });

  // 3. Hero backgrounds (all 6)
  const heroUrls = [
    "/hero/slide-1-desktop.webp",
    "/hero/slide-1-mobile.webp",
    "/hero/slide-2-desktop.webp",
    "/hero/slide-2-mobile.webp",
    "/hero/slide-3-desktop.webp",
    "/hero/slide-3-mobile.webp",
  ];
  for (const u of heroUrls) {
    targets.push({
      category: "Hero Backgrounds",
      url: u,
      expectedMime: "image/webp",
    });
  }

  // 4. Brand logos (all 14)
  for (const b of brands) {
    targets.push({
      category: "Brand Logos (WebP)",
      url: `/brands/${b}.webp`,
      expectedMime: "image/webp",
    });
    targets.push({
      category: "Brand Logos (PNG)",
      url: `/brands/${b}.png`,
      expectedMime: "image/png",
    });
  }

  // 5. Store branding (9 items)
  const storeBranding = [
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
  for (const s of storeBranding) {
    targets.push({
      category: "Store Branding",
      url: s.url,
      expectedMime: s.mime,
    });
  }

  return targets;
}

async function stressConcurrentIconRoutes(): Promise<{ success: boolean; details: string }> {
  console.log("\n==================================================================");
  console.log("  CONCURRENCY STRESS TEST: /icon.svg & /apple-icon.png");
  console.log("==================================================================");

  // 50 concurrent requests simultaneously: 25 to /icon.svg and 25 to /apple-icon.png
  const count = 50;
  console.log(`Bursting ${count} concurrent requests (25x /icon.svg, 25x /apple-icon.png)...`);

  const requests: Promise<TestResult>[] = [];
  const t0 = performance.now();

  for (let i = 0; i < count; i++) {
    const isSvg = i % 2 === 0;
    const target: TestTarget = isSvg
      ? { category: "Stress /icon.svg", url: "/icon.svg", expectedMime: "image/svg+xml" }
      : { category: "Stress /apple-icon.png", url: "/apple-icon.png", expectedMime: "image/png" };

    requests.push(auditTarget(target, 5000));
  }

  const results = await Promise.all(requests);
  const duration = performance.now() - t0;

  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  console.log(`Completed in ${duration.toFixed(1)}ms`);
  console.log(`Passed: ${passed.length}/${count} | Failed: ${failed.length}/${count}`);

  if (failed.length > 0) {
    for (const f of failed) {
      console.error(`  FAIL [${f.target.url}]: ${f.error} (${f.durationMs.toFixed(1)}ms)`);
    }
    return {
      success: false,
      details: `${failed.length} of ${count} concurrent requests failed!`,
    };
  }

  const avgLat = (results.reduce((acc, r) => acc + r.durationMs, 0) / count).toFixed(1);
  const maxLat = Math.max(...results.map((r) => r.durationMs)).toFixed(1);
  const minLat = Math.min(...results.map((r) => r.durationMs)).toFixed(1);

  console.log(`  Latency: avg=${avgLat}ms, min=${minLat}ms, max=${maxLat}ms`);
  console.log(`  Zero timeout aborts! 100% HTTP 200 and valid MIME.`);

  return {
    success: true,
    details: `50/50 passed (avg ${avgLat}ms, max ${maxLat}ms)`,
  };
}

async function main() {
  console.log("==================================================================");
  console.log("  CHALLENGER M4 ITERATION 2: ADVERSARIAL ORACLE HARNESS");
  console.log("==================================================================");

  let spawned = false;
  try {
    spawned = await ensureServer();

    // 1. Gather all sampled targets across all categories
    const targets = await gatherSampleTargets();
    console.log(`\nGathered ${targets.length} sample targets across categories:`);
    const catMap = new Map<string, number>();
    for (const t of targets) {
      catMap.set(t.category, (catMap.get(t.category) || 0) + 1);
    }
    for (const [cat, count] of catMap.entries()) {
      console.log(`  - ${cat}: ${count} targets`);
    }

    console.log("\n--- AUDITING ALL SAMPLE TARGETS (STATUS, MIME, MAGIC BYTES) ---");
    const results: TestResult[] = [];
    for (const target of targets) {
      const res = await auditTarget(target);
      results.push(res);
      const mark = res.passed ? "✓ PASS" : "✗ FAIL";
      console.log(
        `  ${mark} [${target.category}] ${target.url} -> ${res.status} | ${res.mime} | ${res.bytes} bytes (${res.durationMs.toFixed(1)}ms)`
      );
      if (!res.passed) {
        console.error(`     Error: ${res.error}`);
      }
    }

    const failed = results.filter((r) => !r.passed);
    if (failed.length > 0) {
      console.error(`\n❌ SAMPLE AUDIT FAILED with ${failed.length} failure(s)!`);
      process.exitCode = 1;
      return;
    }
    console.log(`\n✓ All ${results.length} sampled targets passed with HTTP 200, valid MIME, and valid magic bytes!`);

    // 2. High concurrency stress test on dynamic icon routes
    const stress = await stressConcurrentIconRoutes();
    if (!stress.success) {
      console.error(`\n❌ CONCURRENCY STRESS FAILED: ${stress.details}`);
      process.exitCode = 1;
      return;
    }

    console.log("\n==================================================================");
    console.log("  ADVERSARIAL CHALLENGE VERDICT: 100% EMPIRICAL PASS");
    console.log("==================================================================");
  } finally {
    if (spawned) {
      stopServer();
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Check port cleanup
  const portFree = checkPortFree();
  console.log(`\nPort 3001 free check: ${portFree ? "FREE (OK)" : "STILL BOUND (WARNING)"}`);
  if (!portFree && spawned) {
    console.error("Port 3001 was not freed!");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal unhandled error in adversarial challenger harness:", err);
  stopServer();
  process.exit(1);
});

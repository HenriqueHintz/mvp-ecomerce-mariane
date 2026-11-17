/**
 * Autonomous Live HTTP Verification Script for AI Readiness
 * Project: Mariane Cosméticos
 * File: tests/verify-ai-readiness-live.ts
 *
 * Validates real HTTP responses against a live server (localhost:3001 or Vercel preview):
 * - Content Negotiation (Accept: text/markdown, Accept: text/html, Vary: Accept)
 * - Agent-Friendly 404 (status 404, Markdown body >= 20 chars, links to sitemap/llms.txt/produtos)
 * - Discovery Endpoints (/sitemap.xml, /robots.txt, /llms.txt)
 * - Permanent 308 Redirects (/about -> /sobre, /contact -> /atendimento, etc.)
 * - Trust Anchor Page (/sobre >= 500 chars)
 * - JSON-LD Structured Data Schema Validation on Home
 *
 * Usage:
 *   npx tsx tests/verify-ai-readiness-live.ts [--url=http://localhost:3001] [--bail]
 */

const args = process.argv.slice(2);
let targetUrl = (process.env.TEST_URL || "http://localhost:3001").replace(/\/$/, "");
let bail = false;

for (const arg of args) {
  if (arg.startsWith("--url=")) {
    targetUrl = arg.split("=")[1].replace(/\/$/, "");
  } else if (arg === "--bail") {
    bail = true;
  } else if (arg === "--help" || arg === "-h") {
    console.log(`
Mariane Cosméticos — AI Readiness Live HTTP Verification

Usage:
  npx tsx tests/verify-ai-readiness-live.ts [options]

Options:
  --url=<URL>    Target base URL (default: http://localhost:3001 or TEST_URL env)
  --bail         Stop execution on first failure
  --help         Show this help message
`);
    process.exit(0);
  }
}

interface LiveCheck {
  id: string;
  name: string;
  run: () => Promise<void>;
}

const checks: LiveCheck[] = [];

function registerCheck(id: string, name: string, run: () => Promise<void>) {
  checks.push({ id, name, run });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// --------------------------------------------------------------------------
// 1. Content Negotiation: Home with Accept: text/markdown
// --------------------------------------------------------------------------
registerCheck("LIVE-1", "GET / with Accept: text/markdown returns 200, markdown content & Vary: Accept", async () => {
  const res = await fetch(`${targetUrl}/`, {
    headers: {
      Accept: "text/markdown",
    },
  });

  assert(res.status === 200, `Expected status 200, got ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  assert(
    contentType.includes("text/markdown"),
    `Expected Content-Type to include text/markdown, got: ${contentType}`
  );

  const vary = res.headers.get("vary") || "";
  assert(
    vary.toLowerCase().includes("accept"),
    `Expected Vary header to include 'Accept', got: ${vary}`
  );

  const text = await res.text();
  assert(
    text.includes("# Mariane Cosméticos") || text.startsWith("# "),
    "Expected Markdown body to start with or contain '# Mariane Cosméticos'"
  );
});

// --------------------------------------------------------------------------
// 2. Content Negotiation: Home with Accept: text/html
// --------------------------------------------------------------------------
registerCheck("LIVE-2", "GET / with Accept: text/html returns 200, HTML content & Vary: Accept", async () => {
  const res = await fetch(`${targetUrl}/`, {
    headers: {
      Accept: "text/html",
    },
  });

  assert(res.status === 200, `Expected status 200, got ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  assert(
    contentType.includes("text/html"),
    `Expected Content-Type to include text/html, got: ${contentType}`
  );

  const vary = res.headers.get("vary") || "";
  assert(
    vary.toLowerCase().includes("accept"),
    `Expected Vary header to include 'Accept', got: ${vary}`
  );

  const text = await res.text();
  assert(
    text.includes("<html") || text.includes("<!DOCTYPE html>"),
    "Expected HTML body to contain standard HTML markup"
  );
});

// --------------------------------------------------------------------------
// 3. Agent-Friendly 404 in Markdown
// --------------------------------------------------------------------------
registerCheck("LIVE-3", "GET non-existent route with Accept: text/markdown returns 404 with helpful Markdown body", async () => {
  const probeUrl = `${targetUrl}/__ai-probe-404-check-${Date.now()}`;
  const res = await fetch(probeUrl, {
    headers: {
      Accept: "text/markdown",
    },
  });

  assert(res.status === 404, `Expected status 404, got ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  assert(
    contentType.includes("text/markdown"),
    `Expected Content-Type to include text/markdown, got: ${contentType}`
  );

  const text = await res.text();
  assert(
    text.length >= 20,
    `Expected 404 Markdown body length >= 20 chars, got: ${text.length}`
  );
  assert(text.includes("/sitemap.xml"), "Expected 404 Markdown body to link to /sitemap.xml");
  assert(text.includes("/llms.txt"), "Expected 404 Markdown body to link to /llms.txt");
  assert(text.includes("/produtos"), "Expected 404 Markdown body to link to /produtos");
});

// --------------------------------------------------------------------------
// 4. Metadata Route: /sitemap.xml
// --------------------------------------------------------------------------
registerCheck("LIVE-4", "GET /sitemap.xml returns valid XML sitemap with canonical URLs", async () => {
  const res = await fetch(`${targetUrl}/sitemap.xml`);
  assert(res.status === 200, `Expected status 200, got ${res.status}`);

  const contentType = res.headers.get("content-type") || "";
  assert(
    contentType.includes("xml"),
    `Expected Content-Type to include xml, got: ${contentType}`
  );

  const text = await res.text();
  assert(text.includes("<urlset"), "Expected sitemap XML to contain <urlset");
  assert(text.includes("/produtos"), "Expected sitemap to list /produtos");
  assert(text.includes("/sobre"), "Expected sitemap to list /sobre");
  assert(text.includes("/produto/"), "Expected sitemap to list dynamic product URLs");
  assert(!text.includes("/admin"), "Sitemap must not expose /admin");
  assert(!text.includes("/checkout"), "Sitemap must not expose /checkout");
});

// --------------------------------------------------------------------------
// 5. Metadata Route: /robots.txt
// --------------------------------------------------------------------------
registerCheck("LIVE-5", "GET /robots.txt contains Sitemap directive, Disallow rules & AI bot allowances", async () => {
  const res = await fetch(`${targetUrl}/robots.txt`);
  assert(res.status === 200, `Expected status 200, got ${res.status}`);

  const text = await res.text();
  assert(text.includes("Sitemap:"), "Expected robots.txt to contain Sitemap directive");
  assert(text.includes("Disallow: /admin"), "Expected Disallow for /admin");
  assert(text.includes("Disallow: /checkout"), "Expected Disallow for /checkout");
  assert(text.includes("Disallow: /carrinho"), "Expected Disallow for /carrinho");
  assert(
    text.includes("ChatGPT-User") ||
      text.includes("PerplexityBot") ||
      text.includes("User-agent: *"),
    "Expected robots.txt to define rules accommodating AI crawlers or universal access"
  );
});

// --------------------------------------------------------------------------
// 6. AI Agent Guidelines: /llms.txt
// --------------------------------------------------------------------------
registerCheck("LIVE-6", "GET /llms.txt conforms to llmstxt.org standard", async () => {
  const res = await fetch(`${targetUrl}/llms.txt`);
  assert(res.status === 200, `Expected status 200, got ${res.status}`);

  const text = await res.text();
  assert(text.includes("# Mariane Cosméticos"), "Expected '# Mariane Cosméticos'");
  assert(text.includes("## Quando usar"), "Expected section '## Quando usar'");
  assert(text.includes("## Como usar"), "Expected section '## Como usar'");
  assert(text.includes("## Páginas principais"), "Expected section '## Páginas principais'");
  assert(text.toLowerCase().includes("madressenza"), "Expected reference to Madressenza");
  assert(text.includes("Lages"), "Expected reference to Lages");
  assert(
    /checkout|pagamento/i.test(text),
    "Expected explicit clarification that agents do not execute checkout/payments"
  );
});

// --------------------------------------------------------------------------
// 7. Permanent 308 Redirects
// --------------------------------------------------------------------------
registerCheck("LIVE-7", "GET /about, /contact, /privacy, /trocas return HTTP 308 permanent redirects", async () => {
  const redirectPairs = [
    { from: "/about", to: "/sobre" },
    { from: "/contact", to: "/atendimento" },
    { from: "/privacy", to: "/politica-de-privacidade" },
    { from: "/trocas", to: "/trocas-e-devolucoes" },
  ];

  for (const pair of redirectPairs) {
    const res = await fetch(`${targetUrl}${pair.from}`, {
      redirect: "manual",
    });

    assert(
      res.status === 308,
      `Expected status 308 for ${pair.from}, got ${res.status}`
    );
    const location = res.headers.get("location") || "";
    assert(
      location.endsWith(pair.to) || location === pair.to,
      `Expected Location for ${pair.from} to end with ${pair.to}, got: ${location}`
    );
  }
});

// --------------------------------------------------------------------------
// 8. Trust Anchor Page: /sobre
// --------------------------------------------------------------------------
registerCheck("LIVE-8", "GET /sobre renders server-rendered HTML with >= 500 characters & verified credentials", async () => {
  const res = await fetch(`${targetUrl}/sobre`);
  assert(res.status === 200, `Expected status 200, got ${res.status}`);

  const text = await res.text();
  const plainText = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  assert(
    plainText.length >= 500,
    `Expected /sobre content length >= 500 characters, got: ${plainText.length}`
  );
  assert(text.includes("Lages"), "Expected /sobre to mention Lages");
  assert(text.toLowerCase().includes("madressenza"), "Expected /sobre to mention Madressenza");
});

// --------------------------------------------------------------------------
// 9. Schema.org JSON-LD Structured Data on Home
// --------------------------------------------------------------------------
registerCheck("LIVE-9", "GET / HTML contains valid JSON-LD @graph with Store, Organization & PostalAddress", async () => {
  const res = await fetch(`${targetUrl}/`, {
    headers: {
      Accept: "text/html",
    },
  });

  const text = await res.text();
  const ldJsonRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches: string[] = [];
  let match;
  while ((match = ldJsonRegex.exec(text)) !== null) {
    matches.push(match[1]);
  }

  assert(
    matches.length > 0,
    "Expected at least one <script type='application/ld+json'> in Home HTML"
  );

  let foundStore = false;
  let foundOrg = false;
  let foundAddress = false;

  for (const jsonStr of matches) {
    try {
      const parsed = JSON.parse(jsonStr.trim());
      const items = parsed["@graph"] ? parsed["@graph"] : [parsed];

      for (const item of items) {
        const type = Array.isArray(item["@type"]) ? item["@type"].join(",") : item["@type"] || "";
        if (type.includes("Store") || type.includes("HealthAndBeautyBusiness")) {
          foundStore = true;
          if (item.address && item.address.addressLocality === "Lages") {
            foundAddress = true;
          }
        }
        if (type.includes("Organization")) {
          foundOrg = true;
          if (item.contactPoint) {
            assert(!item.contactPoint.email, "ContactPoint must not contain fictional email");
          }
        }
      }
    } catch {
      // Ignore non-parseable blocks
    }
  }

  assert(foundStore, "Expected JSON-LD Store / HealthAndBeautyBusiness schema on Home");
  assert(foundOrg, "Expected JSON-LD Organization schema on Home");
  assert(foundAddress, "Expected JSON-LD PostalAddress with Lages on Home");
});

// --------------------------------------------------------------------------
// 10. Dynamic Not-Found Status (404 on invalid product & category slugs)
// --------------------------------------------------------------------------
registerCheck("LIVE-10", "GET /produto/slug-inexistente & /categoria/slug-inexistente return real HTTP 404", async () => {
  for (const p of ["/produto/slug-inexistente-xyz", "/categoria/slug-inexistente-xyz"]) {
    const res = await fetch(`${targetUrl}${p}`, {
      headers: { Accept: "text/html" },
    });
    assert(res.status === 404, `Expected HTTP 404 for ${p}, got ${res.status}`);
  }
});

// --------------------------------------------------------------------------
// 11. Home Raw HTML Content Ratio (>= 5% and >= 500 text chars without JS)
// --------------------------------------------------------------------------
registerCheck("LIVE-11", "Home raw HTML content-to-markup ratio >= 5% without JS", async () => {
  const res = await fetch(`${targetUrl}/`, { headers: { Accept: "text/html" } });
  const raw = await res.text();
  const noNonContent = raw.replace(/<(script|style|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const text = noNonContent
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const rawBytes = Buffer.byteLength(raw, "utf-8");
  const textBytes = Buffer.byteLength(text, "utf-8");
  const ratio = (textBytes / rawBytes) * 100;
  assert(text.length >= 500, `Expected >= 500 visible text chars, got ${text.length}`);
  assert(ratio >= 5.0, `Expected content ratio >= 5.0%, got ${ratio.toFixed(2)}% (${textBytes}/${rawBytes} bytes)`);
});

// --------------------------------------------------------------------------
// Main Runner Execution
// --------------------------------------------------------------------------
async function main() {
  console.log("\n==================================================================");
  console.log("   MARIANE COSMÉTICOS — LIVE HTTP AI READINESS VERIFICATION");
  console.log("==================================================================");
  console.log(`Target URL:       ${targetUrl}`);
  console.log(`Total Checks:     ${checks.length}`);
  console.log("------------------------------------------------------------------\n");

  // Health probe before running checks
  try {
    const probe = await fetch(`${targetUrl}/`, {
      method: "GET",
      signal: AbortSignal.timeout(6000),
    });
    console.log(`[Health Probe] Target server is reachable (HTTP ${probe.status}). Running suite...\n`);
  } catch (err: any) {
    console.error(`\x1b[31m[Health Probe FAILED]\x1b[0m Cannot connect to server at ${targetUrl}:`);
    console.error(`  ${err.message}`);
    console.error(`\nPlease ensure the Next.js application is running on port 3001:`);
    console.error(`  npm run dev (or npm start)`);
    console.error(`Or specify a running target with --url=https://<your-preview-url>\n`);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;
  const startTime = Date.now();

  for (const check of checks) {
    const checkStart = Date.now();
    try {
      await check.run();
      const durationMs = Date.now() - checkStart;
      passed++;
      console.log(`  \x1b[32m✔ PASS\x1b[0m [${check.id}] ${check.name} \x1b[90m(${durationMs}ms)\x1b[0m`);
    } catch (err: any) {
      const durationMs = Date.now() - checkStart;
      failed++;
      console.log(`  \x1b[31m✖ FAIL\x1b[0m [${check.id}] ${check.name} \x1b[90m(${durationMs}ms)\x1b[0m`);
      console.log(`     \x1b[33mError: ${err.message}\x1b[0m`);

      if (bail) {
        console.log("\n[Runner] Bail triggered on first failure.");
        break;
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log("\n------------------------------------------------------------------");
  console.log("   LIVE HTTP TEST SUMMARY");
  console.log("------------------------------------------------------------------");
  console.log(`Total Checks Run: ${passed + failed} / ${checks.length}`);
  console.log(`\x1b[32mPassed:\x1b[0m           ${passed}`);
  console.log(`\x1b[31mFailed:\x1b[0m           ${failed}`);
  console.log(`Pass Rate:        ${((passed / (passed + failed || 1)) * 100).toFixed(1)}%`);
  console.log(`Total Duration:   ${(totalDuration / 1000).toFixed(2)}s`);
  console.log("------------------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal live verification error:", err);
  process.exit(1);
});

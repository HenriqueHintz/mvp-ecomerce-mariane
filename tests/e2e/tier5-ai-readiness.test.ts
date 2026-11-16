import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { describe, test, expect } from "./framework";
import { db, products } from "@/db";

const ROOT_DIR = path.resolve(__dirname, "../..");

describe("Tier 5 - AI Readiness & Agentic Capabilities", () => {
  // =========================================================================
  // Test 5.1: Canonical Domain & Zero Hardcoded References (R0)
  // Authoritative Source: ORIGINAL_REQUEST.md §R0, PROJECT.md Feature #1, #2
  // =========================================================================
  describe("Feature 5.1: Canonical Domain & Zero Hardcoded References", () => {
    test(
      "5.1 Canonical Domain & Zero Hardcoded References (R0)",
      async () => {
        // 1. Verify src/lib/site.ts exists
        const sitePath = path.join(ROOT_DIR, "src", "lib", "site.ts");
        expect(fs.existsSync(sitePath)).toBe(true, "Expected src/lib/site.ts to exist");

        // 2. Import SITE_URL dynamically and validate sanitization
        const { SITE_URL } = await import(pathToFileURL(sitePath).href);
        expect(typeof SITE_URL).toBe("string", "Expected SITE_URL to be a string");
        expect(SITE_URL.startsWith("http")).toBe(true, "Expected SITE_URL to start with http:// or https://");
        expect(SITE_URL.endsWith("/")).toBe(false, "Expected SITE_URL to be sanitized without a trailing slash");

        // 3. Scan all active code files in src/ for legacy domain references
        const legacyDomain = "marianecosmeticos.com.br";
        const foundOccurrences: { file: string; line: number; text: string }[] = [];

        function scanDir(dir: string) {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              scanDir(full);
            } else if (
              entry.isFile() &&
              (entry.name.endsWith(".ts") ||
                entry.name.endsWith(".tsx") ||
                entry.name.endsWith(".js") ||
                entry.name.endsWith(".jsx"))
            ) {
              const content = fs.readFileSync(full, "utf-8");
              if (content.includes(legacyDomain)) {
                const lines = content.split("\n");
                lines.forEach((lineText, idx) => {
                  if (lineText.includes(legacyDomain)) {
                    foundOccurrences.push({
                      file: path.relative(ROOT_DIR, full),
                      line: idx + 1,
                      text: lineText.trim(),
                    });
                  }
                });
              }
            }
          }
        }

        scanDir(path.join(ROOT_DIR, "src"));

        const count = foundOccurrences.length;
        expect(
          count,
          `Expected 0 occurrences of ${legacyDomain} in active src/, but found ${count}:\n` +
            foundOccurrences
              .map((o) => `  ${o.file}:${o.line} -> ${o.text}`)
              .slice(0, 10)
              .join("\n")
        ).toBe(0);

        // 4. Verify WhatsApp link generators in ProductDetailClient.tsx and CartContext.tsx
        const productDetailPath = path.join(
          ROOT_DIR,
          "src",
          "app",
          "produto",
          "[slug]",
          "ProductDetailClient.tsx"
        );
        if (fs.existsSync(productDetailPath)) {
          const pdContent = fs.readFileSync(productDetailPath, "utf-8");
          expect(pdContent.includes("SITE_URL")).toBe(
            true,
            "Expected ProductDetailClient.tsx to use SITE_URL for product links"
          );
          expect(pdContent.includes(legacyDomain)).toBe(
            false,
            "Expected ProductDetailClient.tsx not to contain legacy domain"
          );
        }

        const cartContextPath = path.join(ROOT_DIR, "src", "context", "CartContext.tsx");
        if (fs.existsSync(cartContextPath)) {
          const cartContent = fs.readFileSync(cartContextPath, "utf-8");
          expect(cartContent.includes(legacyDomain)).toBe(
            false,
            "Expected CartContext.tsx not to contain legacy domain"
          );
        }
      },
      {
        tier: 5,
        milestone: "E2E",
        authoritativeSource: "ORIGINAL_REQUEST.md §R0, PROJECT.md Feature #1, #2",
      }
    );
  });

  // =========================================================================
  // Test 5.2: llms.txt Route Handler & Content Compliance (R6)
  // Authoritative Source: ORIGINAL_REQUEST.md §R6, PROJECT.md Feature #6, llmstxt.org
  // =========================================================================
  describe("Feature 5.2: llms.txt Route Handler & Content Compliance", () => {
    test(
      "5.2 llms.txt Route Handler & Content Compliance (R6)",
      async () => {
        const routePath = path.join(ROOT_DIR, "src", "app", "llms.txt", "route.ts");
        expect(fs.existsSync(routePath)).toBe(true, "Expected src/app/llms.txt/route.ts to exist");

        const mod = await import(pathToFileURL(routePath).href);
        expect(typeof mod.GET).toBe("function", "Expected src/app/llms.txt/route.ts to export GET handler");

        const response: Response = await mod.GET();
        expect(response.status).toBe(200, "Expected GET /llms.txt to return HTTP status 200");

        const contentType = response.headers.get("content-type") || "";
        expect(
          contentType.includes("text/markdown") || contentType.includes("text/plain"),
          `Expected Content-Type to be text/markdown or text/plain, got: ${contentType}`
        ).toBe(true);

        const body = await response.text();
        expect(body.includes("# Mariane Cosméticos")).toBe(
          true,
          "Expected body to contain '# Mariane Cosméticos'"
        );
        expect(body.includes("## Quando usar")).toBe(
          true,
          "Expected body to contain section '## Quando usar'"
        );
        expect(body.includes("## Como usar")).toBe(
          true,
          "Expected body to contain section '## Como usar'"
        );
        expect(body.includes("## Páginas principais")).toBe(
          true,
          "Expected body to contain section '## Páginas principais'"
        );

        // Check credentials and policies
        expect(body.toLowerCase().includes("madressenza")).toBe(
          true,
          "Expected body to cite Madressenza"
        );
        expect(/Lages/i.test(body)).toBe(
          true,
          "Expected body to cite official city Lages"
        );
        expect(/5549991251617|\(49\)\s*99125-1617/.test(body)).toBe(
          true,
          "Expected body to include official WhatsApp phone"
        );
        expect(/checkout|pagamento/i.test(body)).toBe(
          true,
          "Expected body to explicitly clarify checkout/payment scope for agents"
        );
        expect(body.includes("marianecosmeticos.com.br")).toBe(
          false,
          "Expected body not to contain legacy broken domain"
        );
      },
      {
        tier: 5,
        milestone: "E2E",
        authoritativeSource: "ORIGINAL_REQUEST.md §R6, PROJECT.md Feature #6, llmstxt.org",
      }
    );
  });

  // =========================================================================
  // Test 5.3: sitemap.xml Metadata Route (R5)
  // Authoritative Source: ORIGINAL_REQUEST.md §R5, PROJECT.md Feature #4, sitemaps.org
  // =========================================================================
  describe("Feature 5.3: sitemap.xml Metadata Route", () => {
    test(
      "5.3 sitemap.xml Metadata Route (R5)",
      async () => {
        const sitemapPath = path.join(ROOT_DIR, "src", "app", "sitemap.ts");
        expect(fs.existsSync(sitemapPath)).toBe(true, "Expected src/app/sitemap.ts to exist");

        const mod = await import(pathToFileURL(sitemapPath).href);
        const sitemapFn = mod.default || mod.sitemap;
        expect(typeof sitemapFn).toBe("function", "Expected sitemap.ts to export default function");

        const entries = await sitemapFn();
        expect(Array.isArray(entries)).toBe(true, "Expected sitemap to return an array of URL entries");
        expect(entries.length).toBeGreaterThan(5, "Expected sitemap to contain at least 6 URLs");

        const urls = entries.map((e: any) => e.url);

        // Dynamic SITE_URL prefix check
        const sitePath = path.join(ROOT_DIR, "src", "lib", "site.ts");
        const { SITE_URL } = await import(pathToFileURL(sitePath).href);
        for (const entry of entries) {
          expect(typeof entry.url).toBe("string", "Each sitemap entry must have a string url");
          expect(
            entry.url.startsWith(SITE_URL),
            `URL ${entry.url} must start with SITE_URL (${SITE_URL})`
          ).toBe(true);
          expect(entry.lastModified !== undefined).toBe(
            true,
            `URL ${entry.url} must have lastModified defined`
          );
        }

        // Required static routes
        const expectedStatic = [
          SITE_URL,
          `${SITE_URL}/produtos`,
          `${SITE_URL}/sobre`,
          `${SITE_URL}/atendimento`,
          `${SITE_URL}/trocas-e-devolucoes`,
          `${SITE_URL}/politica-de-privacidade`,
        ];
        for (const staticUrl of expectedStatic) {
          const match = urls.some((u: string) => u === staticUrl || u === `${staticUrl}/`);
          expect(match).toBe(true, `Expected sitemap to include static route: ${staticUrl}`);
        }

        // Dynamic products from DB
        const dbProducts = await db.select().from(products).limit(5);
        for (const prod of dbProducts) {
          const expectedProdUrl = `${SITE_URL}/produto/${prod.slug}`;
          const hasProd = urls.some((u: string) => u === expectedProdUrl);
          expect(hasProd).toBe(
            true,
            `Expected sitemap to include database product: ${expectedProdUrl}`
          );
        }

        // Private routes excluded
        const disallowedPrefixes = ["/admin", "/checkout", "/carrinho", "/pedido", "/api"];
        for (const u of urls) {
          for (const dis of disallowedPrefixes) {
            expect(u.includes(dis)).toBe(
              false,
              `Disallowed route ${dis} found in sitemap: ${u}`
            );
          }
        }
      },
      {
        tier: 5,
        milestone: "E2E",
        authoritativeSource: "ORIGINAL_REQUEST.md §R5, PROJECT.md Feature #4, sitemaps.org",
      }
    );
  });

  // =========================================================================
  // Test 5.4: robots.txt Metadata Route (R5)
  // Authoritative Source: ORIGINAL_REQUEST.md §R5, PROJECT.md Feature #5
  // =========================================================================
  describe("Feature 5.4: robots.txt Metadata Route", () => {
    test(
      "5.4 robots.txt Metadata Route (R5)",
      async () => {
        const robotsPath = path.join(ROOT_DIR, "src", "app", "robots.ts");
        expect(fs.existsSync(robotsPath)).toBe(true, "Expected src/app/robots.ts to exist");

        const mod = await import(pathToFileURL(robotsPath).href);
        const robotsFn = mod.default || mod.robots;
        expect(typeof robotsFn).toBe("function", "Expected robots.ts to export default function");

        const robotsData = await robotsFn();
        expect(typeof robotsData).toBe("object", "Expected robots() to return an object");

        const sitePath = path.join(ROOT_DIR, "src", "lib", "site.ts");
        const { SITE_URL } = await import(pathToFileURL(sitePath).href);
        expect(robotsData.sitemap).toBe(
          `${SITE_URL}/sitemap.xml`,
          `Expected sitemap to point to ${SITE_URL}/sitemap.xml`
        );

        // Verify rules
        const rules = Array.isArray(robotsData.rules) ? robotsData.rules : [robotsData.rules];
        expect(rules.length).toBeGreaterThan(0, "Expected at least one robots rule");

        // Collect all disallow paths and userAgents
        const allDisallows: string[] = [];
        const allUserAgents: string[] = [];
        for (const r of rules) {
          if (Array.isArray(r.userAgent)) allUserAgents.push(...r.userAgent);
          else if (r.userAgent) allUserAgents.push(r.userAgent);

          if (Array.isArray(r.disallow)) allDisallows.push(...r.disallow);
          else if (r.disallow) allDisallows.push(r.disallow);
        }

        // Disallowed private paths
        const requiredDisallows = ["/admin", "/api", "/checkout", "/carrinho", "/pedido"];
        for (const p of requiredDisallows) {
          const match = allDisallows.some((d) => d.startsWith(p));
          expect(match).toBe(true, `Expected robots.txt to disallow path starting with ${p}`);
        }

        // AI Crawlers explicit allowance or representation
        const aiAgents = ["ChatGPT-User", "OAI-SearchBot", "Claude-User", "PerplexityBot"];
        const includesAi = aiAgents.some(
          (agent) => allUserAgents.includes(agent) || allUserAgents.includes("*")
        );
        expect(includesAi).toBe(true, "Expected robots.txt rules to accommodate AI crawlers");
      },
      {
        tier: 5,
        milestone: "E2E",
        authoritativeSource: "ORIGINAL_REQUEST.md §R5, PROJECT.md Feature #5",
      }
    );
  });

  // =========================================================================
  // Test 5.5: JSON-LD Structured Data Schema Validation (R4)
  // Authoritative Source: ORIGINAL_REQUEST.md §R4, PROJECT.md Feature #17, #18, schema.org
  // =========================================================================
  describe("Feature 5.5: JSON-LD Structured Data Schema Validation", () => {
    test(
      "5.5 JSON-LD Structured Data Schema Validation (R4)",
      async () => {
        // 1. Home page schema check
        const homePagePath = path.join(ROOT_DIR, "src", "app", "page.tsx");
        expect(fs.existsSync(homePagePath)).toBe(true, "Expected src/app/page.tsx to exist");
        const homeCode = fs.readFileSync(homePagePath, "utf-8");

        expect(homeCode.includes("application/ld+json")).toBe(
          true,
          "Expected Home page to render application/ld+json"
        );
        expect(homeCode.includes("@graph")).toBe(
          true,
          "Expected Home JSON-LD to contain @graph"
        );

        // Verify presence of required Schema entities in Home
        expect(/HealthAndBeautyBusiness|Store/.test(homeCode)).toBe(
          true,
          "Expected Store / HealthAndBeautyBusiness schema"
        );
        expect(homeCode.includes("Organization")).toBe(
          true,
          "Expected Organization schema"
        );
        expect(homeCode.includes("WebSite")).toBe(
          true,
          "Expected WebSite schema"
        );
        expect(homeCode.includes("PostalAddress")).toBe(
          true,
          "Expected PostalAddress schema"
        );
        expect(homeCode.includes("Rua Blumenau")).toBe(
          true,
          "Expected address to contain 'Rua Blumenau'"
        );
        expect(homeCode.includes("88505-300")).toBe(
          true,
          "Expected postalCode '88505-300'"
        );
        expect(homeCode.includes("Lages")).toBe(
          true,
          "Expected addressLocality 'Lages'"
        );
        expect(/5549991251617|\+55-49-99125-1617/.test(homeCode)).toBe(
          true,
          "Expected contactPoint telephone '+55-49-99125-1617'"
        );

        // Crucial check: verify contactPoint does NOT invent a fictitious corporate email
        const ldJsonMatches =
          homeCode.match(/<script[\s\S]*?application\/ld\+json[\s\S]*?>([\s\S]*?)<\/script>/gi) || [];
        for (const scriptTag of ldJsonMatches) {
          expect(scriptTag.includes("@marianecosmeticos.com.br")).toBe(
            false,
            "Must not invent fake contact email"
          );
          expect(scriptTag.includes("@exemplo.com")).toBe(
            false,
            "Must not use placeholder email"
          );
        }

        // 2. Product detail page schema check
        const prodPagePath = path.join(ROOT_DIR, "src", "app", "produto", "[slug]", "page.tsx");
        expect(fs.existsSync(prodPagePath)).toBe(true, "Expected product detail page to exist");
        const prodCode = fs.readFileSync(prodPagePath, "utf-8");

        expect(prodCode.includes('"@type": "Product"') || prodCode.includes('"@type":"Product"')).toBe(
          true,
          "Product page JSON-LD must specify Product type"
        );
        expect(prodCode.includes('"priceCurrency": "BRL"') || prodCode.includes('"priceCurrency":"BRL"')).toBe(
          true,
          "Product page JSON-LD must use BRL currency"
        );
        expect(prodCode.includes("offers")).toBe(
          true,
          "Product page JSON-LD must define offers"
        );
        expect(prodCode.includes("seller")).toBe(
          true,
          "Product page JSON-LD must reference store as seller"
        );
      },
      {
        tier: 5,
        milestone: "E2E",
        authoritativeSource: "ORIGINAL_REQUEST.md §R4, PROJECT.md Feature #17, #18, schema.org",
      }
    );
  });

  // =========================================================================
  // Test 5.6: 404 Friendly Page & Markdown Error Handling (R2)
  // Authoritative Source: ORIGINAL_REQUEST.md §R2, PROJECT.md Feature #11, #12
  // =========================================================================
  describe("Feature 5.6: 404 Friendly Page & Markdown Error Handling", () => {
    test(
      "5.6 404 Friendly Page & Markdown Error Handling (R2)",
      async () => {
        // 1. Visual 404 page
        const notFoundPath = path.join(ROOT_DIR, "src", "app", "not-found.tsx");
        expect(fs.existsSync(notFoundPath)).toBe(true, "Expected src/app/not-found.tsx to exist");
        const notFoundCode = fs.readFileSync(notFoundPath, "utf-8");

        expect(notFoundCode.includes('href="/"')).toBe(
          true,
          "Expected not-found.tsx to link to Home ('/')"
        );
        expect(notFoundCode.includes('href="/produtos"')).toBe(
          true,
          "Expected not-found.tsx to link to Products ('/produtos')"
        );
        expect(notFoundCode.includes('href="/atendimento"')).toBe(
          true,
          "Expected not-found.tsx to link to Customer Service ('/atendimento')"
        );

        // 2. notFound() invocation in dynamic product and category pages
        const prodPagePath = path.join(ROOT_DIR, "src", "app", "produto", "[slug]", "page.tsx");
        const prodCode = fs.readFileSync(prodPagePath, "utf-8");
        expect(prodCode.includes("notFound()")).toBe(
          true,
          "Product page must call notFound() when slug is invalid"
        );

        const catPagePath = path.join(ROOT_DIR, "src", "app", "categoria", "[slug]", "page.tsx");
        const catCode = fs.readFileSync(catPagePath, "utf-8");
        expect(catCode.includes("notFound()")).toBe(
          true,
          "Category page must call notFound() when category is invalid"
        );

        // 3. Markdown route handler error handling (R2: >= 20 chars with sitemap, llms.txt, produtos)
        const mdRoutePath1 = path.join(ROOT_DIR, "src", "app", "api", "markdown", "[...path]", "route.ts");
        const mdRoutePath2 = path.join(ROOT_DIR, "src", "app", "api", "markdown", "route.ts");
        const mdRouteExists = fs.existsSync(mdRoutePath1) || fs.existsSync(mdRoutePath2);
        expect(mdRouteExists).toBe(true, "Expected markdown API route handler to exist");

        const mdFile = fs.existsSync(mdRoutePath1) ? mdRoutePath1 : mdRoutePath2;
        const mdCode = fs.readFileSync(mdFile, "utf-8");
        expect(mdCode.includes("404")).toBe(
          true,
          "Markdown route handler must handle 404 status"
        );
        expect(mdCode.includes("/sitemap.xml")).toBe(
          true,
          "Markdown 404 body must link to /sitemap.xml"
        );
        expect(mdCode.includes("/llms.txt")).toBe(
          true,
          "Markdown 404 body must link to /llms.txt"
        );
        expect(mdCode.includes("/produtos")).toBe(
          true,
          "Markdown 404 body must link to /produtos"
        );
      },
      {
        tier: 5,
        milestone: "E2E",
        authoritativeSource: "ORIGINAL_REQUEST.md §R2, PROJECT.md Feature #11, #12",
      }
    );
  });

  // =========================================================================
  // Test 5.7: Content Negotiation & Admin Middleware Protection (R1)
  // Authoritative Source: ORIGINAL_REQUEST.md §R1, PROJECT.md Feature #7, #9, RFC 9110
  // =========================================================================
  describe("Feature 5.7: Content Negotiation & Admin Middleware Protection", () => {
    test(
      "5.7 Content Negotiation & Admin Middleware Protection (R1)",
      () => {
        const middlewarePath = path.join(ROOT_DIR, "src", "middleware.ts");
        expect(fs.existsSync(middlewarePath)).toBe(true, "Expected src/middleware.ts to exist");
        const content = fs.readFileSync(middlewarePath, "utf-8");

        // Admin authentication protection preserved
        expect(content.includes("/admin/:path*")).toBe(
          true,
          "Middleware matcher must preserve /admin/:path*"
        );
        expect(content.includes("/api/admin/:path*")).toBe(
          true,
          "Middleware matcher must preserve /api/admin/:path*"
        );
        expect(/cookie|token|auth|session/i.test(content)).toBe(
          true,
          "Middleware must enforce session/token authentication for admin"
        );

        // Content negotiation for text/markdown
        expect(content.includes("text/markdown")).toBe(
          true,
          "Middleware must detect Accept: text/markdown"
        );
        expect(content.includes("Vary")).toBe(
          true,
          "Middleware must set or forward Vary header"
        );
        expect(content.includes("Accept")).toBe(
          true,
          "Middleware must include Accept in Vary header"
        );

        // Exclusion of private routes from markdown rewrite
        expect(content.includes("/admin")).toBe(
          true,
          "Middleware must exclude /admin from markdown rewrites"
        );
        expect(content.includes("/checkout")).toBe(
          true,
          "Middleware must exclude /checkout from markdown rewrites"
        );
        expect(content.includes("/carrinho")).toBe(
          true,
          "Middleware must exclude /carrinho from markdown rewrites"
        );
      },
      {
        tier: 5,
        milestone: "E2E",
        authoritativeSource: "ORIGINAL_REQUEST.md §R1, PROJECT.md Feature #7, #9, RFC 9110 §12.5.5",
      }
    );
  });

  // =========================================================================
  // Test 5.8: Trust Anchor Pages & Character Count (R7)
  // Authoritative Source: ORIGINAL_REQUEST.md §R7, PROJECT.md Feature #13
  // =========================================================================
  describe("Feature 5.8: Trust Anchor Pages & Character Count", () => {
    test(
      "5.8 Trust Anchor Pages & Character Count (R7)",
      () => {
        // 1. Route files existence
        const routes = [
          { name: "/sobre", file: path.join(ROOT_DIR, "src", "app", "sobre", "page.tsx") },
          { name: "/atendimento", file: path.join(ROOT_DIR, "src", "app", "atendimento", "page.tsx") },
          {
            name: "/politica-de-privacidade",
            file: path.join(ROOT_DIR, "src", "app", "politica-de-privacidade", "page.tsx"),
          },
          {
            name: "/trocas-e-devolucoes",
            file: path.join(ROOT_DIR, "src", "app", "trocas-e-devolucoes", "page.tsx"),
          },
        ];

        for (const r of routes) {
          expect(fs.existsSync(r.file)).toBe(true, `Expected trust anchor page ${r.name} to exist at ${r.file}`);
        }

        // 2. /sobre content checks (>= 500 characters, official credentials, [CONFIRMAR] marker)
        const sobreCode = fs.readFileSync(routes[0].file, "utf-8");
        const sobreText = sobreCode.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
        expect(
          sobreText.length >= 500,
          `Expected /sobre content to have at least 500 characters, got: ${sobreText.length}`
        ).toBe(true);

        expect(/Lages/i.test(sobreCode)).toBe(
          true,
          "Expected /sobre to mention store location Lages"
        );
        expect(/Madressenza/i.test(sobreCode)).toBe(
          true,
          "Expected /sobre to cite Madressenza curation"
        );
        expect(sobreCode.includes("[CONFIRMAR]")).toBe(
          true,
          "Expected unverified historical facts in /sobre to be marked [CONFIRMAR]"
        );

        // 3. /atendimento content >= 500 chars
        const atendimentoCode = fs.readFileSync(routes[1].file, "utf-8");
        const atendimentoText = atendimentoCode.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
        expect(
          atendimentoText.length >= 500,
          `Expected /atendimento content to have at least 500 characters, got: ${atendimentoText.length}`
        ).toBe(true);

        // 4. /politica-de-privacidade content >= 500 chars
        const privacidadeCode = fs.readFileSync(routes[2].file, "utf-8");
        const privacidadeText = privacidadeCode.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
        expect(
          privacidadeText.length >= 500,
          `Expected /politica-de-privacidade content to have at least 500 characters, got: ${privacidadeText.length}`
        ).toBe(true);
      },
      {
        tier: 5,
        milestone: "E2E",
        authoritativeSource: "ORIGINAL_REQUEST.md §R7, PROJECT.md Feature #13",
      }
    );
  });

  // =========================================================================
  // Test 5.9: Permanent 308 Redirects in next.config.ts (R7)
  // Authoritative Source: ORIGINAL_REQUEST.md §R7, PROJECT.md Feature #8
  // =========================================================================
  describe("Feature 5.9: Permanent 308 Redirects in next.config.ts", () => {
    test(
      "5.9 Permanent 308 Redirects in next.config.ts (R7)",
      async () => {
        const configPath = path.join(ROOT_DIR, "next.config.ts");
        expect(fs.existsSync(configPath)).toBe(true, "Expected next.config.ts to exist");

        const mod = await import(pathToFileURL(configPath).href);
        const nextConfig = mod.default || mod;
        expect(typeof nextConfig.redirects).toBe(
          "function",
          "Expected next.config.ts to define redirects() function"
        );

        const redirects = await nextConfig.redirects();
        expect(Array.isArray(redirects)).toBe(true, "Expected redirects() to return an array");

        const requiredRedirects: { source: string; destination: string; permanent: boolean }[] = [
          { source: "/about", destination: "/sobre", permanent: true },
          { source: "/contact", destination: "/atendimento", permanent: true },
          { source: "/contato", destination: "/atendimento", permanent: true },
          { source: "/privacy", destination: "/politica-de-privacidade", permanent: true },
          { source: "/privacidade", destination: "/politica-de-privacidade", permanent: true },
          { source: "/trocas", destination: "/trocas-e-devolucoes", permanent: true },
          { source: "/devolucoes", destination: "/trocas-e-devolucoes", permanent: true },
          { source: "/returns", destination: "/trocas-e-devolucoes", permanent: true },
        ];

        for (const req of requiredRedirects) {
          const match = redirects.find((r: any) => r.source === req.source);
          expect(match !== undefined).toBe(true, `Missing redirect for source: ${req.source}`);
          expect(match.destination).toBe(req.destination, `Redirect ${req.source} destination mismatch`);
          expect(match.permanent).toBe(true, `Redirect ${req.source} must be permanent (HTTP 308)`);
        }
      },
      {
        tier: 5,
        milestone: "E2E",
        authoritativeSource: "ORIGINAL_REQUEST.md §R7, PROJECT.md Feature #8",
      }
    );
  });

  // =========================================================================
  // Test 5.10: Footer Navigation Trust Links (R7)
  // Authoritative Source: ORIGINAL_REQUEST.md §R7, PROJECT.md Feature #14, #16
  // =========================================================================
  describe("Feature 5.10: Footer Navigation Trust Links", () => {
    test(
      "5.10 Footer Navigation Trust Links (R7)",
      () => {
        const footerPath = path.join(ROOT_DIR, "src", "components", "Footer.tsx");
        expect(fs.existsSync(footerPath)).toBe(true, "Expected src/components/Footer.tsx to exist");

        const footerCode = fs.readFileSync(footerPath, "utf-8");

        // Required trust anchor links
        const requiredLinks = [
          "/sobre",
          "/atendimento",
          "/trocas-e-devolucoes",
          "/politica-de-privacidade",
        ];

        for (const href of requiredLinks) {
          const hasLink =
            footerCode.includes(`href="${href}"`) || footerCode.includes(`href={'${href}'}`);
          expect(hasLink).toBe(
            true,
            `Expected Footer.tsx to include visible link with href="${href}"`
          );
        }

        // Heading hierarchy check: footer should use h3 for section headers, not h4
        expect(footerCode.includes("<h4")).toBe(
          false,
          "Footer section headings should be h3, not h4, for strict sequence"
        );
      },
      {
        tier: 5,
        milestone: "E2E",
        authoritativeSource: "ORIGINAL_REQUEST.md §R7, PROJECT.md Feature #14, #16",
      }
    );
  });
});

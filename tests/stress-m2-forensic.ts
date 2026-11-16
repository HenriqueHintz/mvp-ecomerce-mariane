import { NextRequest } from "next/server";
import { GET } from "@/app/api/markdown/route";
import { middleware } from "@/middleware";
import { db, products, categories, brands } from "@/db";
import { eq } from "drizzle-orm";
import { SITE_URL } from "@/lib/site";
import nextConfig from "../next.config";

async function runForensicAudit() {
  console.log("==================================================================");
  console.log("   MARIANE COSMÉTICOS — M2 FORENSIC INTEGRITY & ADVERSARIAL STRESS");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, desc: string, detail?: string) {
    if (cond) {
      console.log(`  \x1b[32m✔ PASS\x1b[0m ${desc}`);
      passed++;
    } else {
      console.error(`  \x1b[31m✖ FAIL\x1b[0m ${desc}${detail ? ` -> ${detail}` : ""}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // Phase 1: Dynamic Database & ORM Integrity in src/app/api/markdown/route.ts
  // --------------------------------------------------------------------------
  console.log("[Phase 1] Dynamic Database Integrity in Markdown Route Handler");

  // 1.1 Home /
  const reqHome = new NextRequest("http://localhost:3000/api/markdown?path=/");
  const resHome = await GET(reqHome);
  assert(resHome.status === 200, "Home returns HTTP 200");
  assert(
    (resHome.headers.get("content-type") || "").includes("text/markdown"),
    "Home returns Content-Type text/markdown; charset=utf-8"
  );
  assert(
    (resHome.headers.get("vary") || "").toLowerCase().includes("accept"),
    "Home returns Vary: Accept header"
  );
  const bodyHome = await resHome.text();
  assert(bodyHome.includes("# Mariane Cosméticos"), "Home body includes '# Mariane Cosméticos'");
  assert(bodyHome.includes(SITE_URL), "Home body uses dynamic SITE_URL");

  // Check that categories from DB are included
  const dbCategories = await db.select().from(categories).limit(5);
  for (const cat of dbCategories) {
    assert(
      bodyHome.includes(cat.name) && bodyHome.includes(`/categoria/${cat.slug}`),
      `Home dynamically lists category from DB: ${cat.name}`
    );
  }

  // 1.2 Catálogo /produtos
  const reqCat = new NextRequest("http://localhost:3000/api/markdown?path=/produtos");
  const resCat = await GET(reqCat);
  assert(resCat.status === 200, "Catalog /produtos returns HTTP 200");
  const bodyCat = await resCat.text();
  assert(bodyCat.includes("# Catálogo de Produtos"), "Catalog body includes '# Catálogo de Produtos'");

  // 1.3 Dynamic Product from DB
  const [dbProd] = await db.select().from(products).limit(1);
  const reqProd = new NextRequest(`http://localhost:3000/api/markdown?path=/produto/${dbProd.slug}`);
  const resProd = await GET(reqProd);
  assert(resProd.status === 200, `Product /produto/${dbProd.slug} returns HTTP 200`);
  const bodyProd = await resProd.text();
  assert(bodyProd.includes(dbProd.name), `Product markdown contains actual DB product name: ${dbProd.name}`);
  assert(bodyProd.includes("R$"), "Product markdown contains price formatted in BRL");
  assert(bodyProd.includes("PIX (5% OFF)"), "Product markdown contains 5% PIX price calculation");
  assert(bodyProd.includes("Até 10x de"), "Product markdown contains 10x installment calculation");
  assert(bodyProd.includes(`${SITE_URL}/produto/${dbProd.slug}`), "Product markdown contains canonical URL");

  // 1.4 Non-existent Product -> 404
  const reqProd404 = new NextRequest("http://localhost:3000/api/markdown?path=/produto/inexistente-forensic-probe-999");
  const resProd404 = await GET(reqProd404);
  assert(resProd404.status === 404, "Non-existent product returns HTTP 404");
  assert(
    (resProd404.headers.get("content-type") || "").includes("text/markdown"),
    "404 response has Content-Type text/markdown"
  );
  assert(
    (resProd404.headers.get("vary") || "").toLowerCase().includes("accept"),
    "404 response has Vary: Accept"
  );
  const bodyProd404 = await resProd404.text();
  assert(bodyProd404.length >= 20, `404 body has >= 20 chars (actual: ${bodyProd404.length})`);
  assert(bodyProd404.includes("/sitemap.xml"), "404 body links to /sitemap.xml");
  assert(bodyProd404.includes("/llms.txt"), "404 body links to /llms.txt");
  assert(bodyProd404.includes("/produtos"), "404 body links to /produtos");

  // 1.5 Non-existent Category -> 404
  const reqCat404 = new NextRequest("http://localhost:3000/api/markdown?path=/categoria/inexistente-cat-probe-888");
  const resCat404 = await GET(reqCat404);
  assert(resCat404.status === 404, "Non-existent category returns HTTP 404");

  // 1.6 Trust Anchor /sobre
  const reqSobre = new NextRequest("http://localhost:3000/api/markdown?path=/sobre");
  const resSobre = await GET(reqSobre);
  assert(resSobre.status === 200, "Markdown /sobre returns HTTP 200");
  const bodySobre = await resSobre.text();
  assert(bodySobre.length >= 500, `Markdown /sobre has >= 500 chars (actual: ${bodySobre.length})`);
  assert(bodySobre.includes("Madressenza"), "Markdown /sobre mentions Madressenza");
  assert(bodySobre.includes("Lages"), "Markdown /sobre mentions Lages");

  // --------------------------------------------------------------------------
  // Phase 2: Middleware Protection & Negotiation Integrity
  // --------------------------------------------------------------------------
  console.log("\n[Phase 2] Middleware Protection & Negotiation Integrity");

  // 2.1 Standard HTML request receives Vary: Accept
  const reqNormal = new NextRequest("http://localhost:3000/", {
    headers: { Accept: "text/html" },
  });
  const resNormal = await middleware(reqNormal);
  assert(
    (resNormal.headers.get("vary") || "").toLowerCase().includes("accept"),
    "Standard HTML request returns Vary: Accept"
  );

  // 2.2 Markdown request rewrites to /api/markdown?path=/
  const reqMd = new NextRequest("http://localhost:3000/produtos", {
    headers: { Accept: "text/markdown" },
  });
  const resMd = await middleware(reqMd);
  const rewriteHeader = resMd.headers.get("x-middleware-rewrite") || "";
  assert(
    rewriteHeader.includes("/api/markdown") && rewriteHeader.includes("path=%2Fprodutos"),
    "Public markdown request rewrites to /api/markdown?path=%2Fprodutos"
  );
  assert(
    (resMd.headers.get("vary") || "").toLowerCase().includes("accept"),
    "Rewritten markdown request preserves Vary: Accept"
  );

  // 2.3 Unauthenticated /admin/pedidos redirects to /admin/login
  const reqAdmin = new NextRequest("http://localhost:3000/admin/pedidos", {
    headers: { Accept: "text/markdown" }, // Even with Accept: text/markdown!
  });
  const resAdmin = await middleware(reqAdmin);
  assert(
    resAdmin.status === 307 || resAdmin.status === 308 || Boolean(resAdmin.headers.get("location")?.includes("/admin/login")),
    "Unauthenticated /admin request redirects to /admin/login (NOT rewritten to markdown)"
  );

  // 2.4 Unauthenticated /api/admin/pedidos returns 401 Problem Details
  const reqApiAdmin = new NextRequest("http://localhost:3000/api/admin/pedidos");
  const resApiAdmin = await middleware(reqApiAdmin);
  assert(resApiAdmin.status === 401, "Unauthenticated /api/admin/ request returns 401");
  assert(
    (resApiAdmin.headers.get("content-type") || "").includes("application/problem+json"),
    "/api/admin/ 401 returns RFC 7807 problem+json"
  );

  // 2.5 Private routes excluded from markdown rewrite (/checkout, /carrinho, /pedido)
  for (const priv of ["/checkout", "/carrinho", "/pedido/token-xyz"]) {
    const reqPriv = new NextRequest(`http://localhost:3000${priv}`, {
      headers: { Accept: "text/markdown" },
    });
    const resPriv = await middleware(reqPriv);
    const rewrite = resPriv.headers.get("x-middleware-rewrite") || "";
    assert(
      !rewrite.includes("/api/markdown"),
      `Private route ${priv} is strictly excluded from markdown rewrite`
    );
  }

  // --------------------------------------------------------------------------
  // Phase 3: Permanent 308 Redirects Integrity in next.config.ts
  // --------------------------------------------------------------------------
  console.log("\n[Phase 3] Permanent 308 Redirects in next.config.ts");
  const redirects = await (nextConfig.redirects ? nextConfig.redirects() : []);
  const expectedRedirects = [
    { source: "/about", destination: "/sobre" },
    { source: "/contact", destination: "/atendimento" },
    { source: "/contato", destination: "/atendimento" },
    { source: "/privacy", destination: "/politica-de-privacidade" },
    { source: "/privacidade", destination: "/politica-de-privacidade" },
    { source: "/trocas", destination: "/trocas-e-devolucoes" },
    { source: "/devolucoes", destination: "/trocas-e-devolucoes" },
    { source: "/returns", destination: "/trocas-e-devolucoes" },
  ];

  for (const exp of expectedRedirects) {
    const match = redirects.find((r: any) => r.source === exp.source);
    assert(
      match !== undefined && match.destination === exp.destination && match.permanent === true,
      `Redirect ${exp.source} -> ${exp.destination} with permanent: true (308)`
    );
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log("\n------------------------------------------------------------------");
  console.log(`Total Checks Run: ${passed + failed}`);
  console.log(`Passed:           ${passed}`);
  console.log(`Failed:           ${failed}`);
  console.log("------------------------------------------------------------------");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runForensicAudit().catch((err) => {
  console.error("Forensic audit error:", err);
  process.exit(1);
});

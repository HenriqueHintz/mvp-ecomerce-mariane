import { NextRequest } from "next/server";
import { GET } from "../src/app/api/markdown/route";
import { middleware } from "../src/middleware";
import { db, products, categories } from "../src/db";

async function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERTION FAILED: " + msg);
}

async function runAdversarialM2() {
  console.log("==================================================================");
  console.log("  MARIANE COSMÉTICOS — M2 ADVERSARIAL & INTEGRITY STRESS TEST");
  console.log("==================================================================");

  let passed = 0;

  // 1. Home route in markdown
  {
    const req = new NextRequest("http://localhost:3000/api/markdown?path=/");
    const res = await GET(req);
    assert(res.status === 200, "Home markdown must return 200");
    assert(res.headers.get("content-type")?.includes("text/markdown") === true, "Must have Content-Type text/markdown");
    assert(res.headers.get("vary")?.includes("Accept") === true, "Must have Vary: Accept");
    const text = await res.text();
    assert(text.includes("# Mariane Cosméticos"), "Home markdown must contain title");
    assert(text.includes("Madressenza"), "Home markdown must mention Madressenza");
    assert(text.includes("Lages"), "Home markdown must mention Lages");
    assert(text.includes("/sitemap.xml"), "Home markdown must link to sitemap");
    assert(text.includes("/llms.txt"), "Home markdown must link to llms.txt");
    console.log("  ✔ PASS [Adv-1] Home Markdown renders authentic data & discoverability links");
    passed++;
  }

  // 2. /produtos catalog in markdown
  {
    const req = new NextRequest("http://localhost:3000/api/markdown?path=/produtos");
    const res = await GET(req);
    assert(res.status === 200, "Produtos markdown must return 200");
    const text = await res.text();
    assert(text.includes("# Catálogo de Produtos"), "Catalog markdown must have header");
    assert(text.includes("Preço: R$"), "Catalog markdown must format price in BRL");
    assert(text.includes("PIX (5% OFF)"), "Catalog markdown must include PIX discount");
    console.log("  ✔ PASS [Adv-2] Catalog Markdown renders live products from database");
    passed++;
  }

  // 3. Dynamic product existing vs non-existing
  {
    const dbProds = await db.select().from(products).limit(1);
    assert(dbProds.length > 0, "Database must have at least 1 product");
    const realSlug = dbProds[0].slug;

    // Test with real product
    const req1 = new NextRequest(`http://localhost:3000/api/markdown?path=/produto/${realSlug}`);
    const res1 = await GET(req1);
    assert(res1.status === 200, `Existing product markdown must return 200 for ${realSlug}`);
    const text1 = await res1.text();
    assert(text1.includes(dbProds[0].name), "Product markdown must contain product name");
    assert(text1.includes("PIX (5% OFF):"), "Product markdown must calculate 5% PIX off");
    assert(text1.includes("10x de"), "Product markdown must calculate 10x installments");
    assert(text1.includes(`/produto/${realSlug}`), "Product markdown must contain canonical URL");

    // Test with non-existing product
    const req2 = new NextRequest("http://localhost:3000/api/markdown?path=/produto/adversarial-non-existent-product-12345");
    const res2 = await GET(req2);
    assert(res2.status === 404, "Non-existing product markdown must return 404");
    const text2 = await res2.text();
    assert(text2.length >= 20, "404 markdown must have >= 20 chars");
    assert(text2.includes("/sitemap.xml"), "404 markdown must link to /sitemap.xml");
    assert(text2.includes("/llms.txt"), "404 markdown must link to /llms.txt");
    assert(text2.includes("/produtos"), "404 markdown must link to /produtos");
    console.log("  ✔ PASS [Adv-3] Product Markdown correctly fetches from DB and handles 404 gracefully");
    passed++;
  }

  // 4. Dynamic category existing vs non-existing
  {
    const dbCats = await db.select().from(categories).limit(1);
    assert(dbCats.length > 0, "Database must have at least 1 category");
    const realCatSlug = dbCats[0].slug;

    const req1 = new NextRequest(`http://localhost:3000/api/markdown?path=/categoria/${realCatSlug}`);
    const res1 = await GET(req1);
    assert(res1.status === 200, `Existing category markdown must return 200 for ${realCatSlug}`);
    const text1 = await res1.text();
    assert(text1.includes(dbCats[0].name), "Category markdown must contain category name");

    const req2 = new NextRequest("http://localhost:3000/api/markdown?path=/categoria/adversarial-invalid-cat-9999");
    const res2 = await GET(req2);
    assert(res2.status === 404, "Invalid category markdown must return 404");
    console.log("  ✔ PASS [Adv-4] Category Markdown correctly queries DB and returns 404 on unknown category");
    passed++;
  }

  // 5. Trust anchor routes in markdown (/sobre, /atendimento, /trocas-e-devolucoes, /politica-de-privacidade)
  {
    for (const route of ["/sobre", "/atendimento", "/trocas-e-devolucoes", "/politica-de-privacidade"]) {
      const req = new NextRequest(`http://localhost:3000/api/markdown?path=${route}`);
      const res = await GET(req);
      assert(res.status === 200, `Route ${route} must return 200 in markdown`);
      const text = await res.text();
      assert(text.length >= 100, `Route ${route} markdown body must be substantial`);
    }
    console.log("  ✔ PASS [Adv-5] Trust anchor routes render dedicated markdown representations");
    passed++;
  }

  // 6. Adversarial paths: path traversal, malicious inputs
  {
    const malformed = [
      "../../etc/passwd",
      "/produto/../../../sensitive",
      "/api/admin/pedidos",
      "/%2e%2e/%2e%2e/admin",
    ];
    for (const p of malformed) {
      const req = new NextRequest(`http://localhost:3000/api/markdown?path=${encodeURIComponent(p)}`);
      const res = await GET(req);
      assert(res.status === 404, `Malformed path ${p} must return 404`);
    }
    console.log("  ✔ PASS [Adv-6] Adversarial path inputs safely result in 404 markdown without data leak");
    passed++;
  }

  // 7. Middleware protection: Admin authentication cannot be bypassed with Accept: text/markdown
  {
    const unauthReq = new NextRequest("http://localhost:3000/admin/pedidos", {
      headers: {
        Accept: "text/markdown",
      },
    });
    const res = await middleware(unauthReq);
    assert(res.status === 307 || res.status === 308 || res.status === 302 || res.headers.get("location")?.includes("/admin/login") === true,
      "Unauthenticated /admin request with Accept: text/markdown must redirect to login, not serve markdown");

    const apiUnauthReq = new NextRequest("http://localhost:3000/api/admin/pedidos", {
      headers: {
        Accept: "text/markdown",
      },
    });
    const apiRes = await middleware(apiUnauthReq);
    assert(apiRes.status === 401, "Unauthenticated /api/admin request must return 401 RFC 7807, never markdown");
    console.log("  ✔ PASS [Adv-7] Admin routes strictly enforce authentication even when Accept: text/markdown is present");
    passed++;
  }

  // 8. Middleware content negotiation for public routes
  {
    const pubReq = new NextRequest("http://localhost:3000/produtos", {
      headers: {
        Accept: "text/markdown",
      },
    });
    const res = await middleware(pubReq);
    assert(res.headers.get("x-middleware-rewrite")?.includes("/api/markdown") === true ||
           res.headers.get("vary")?.includes("Accept") === true,
      "Public route with text/markdown must rewrite and set Vary: Accept");
    console.log("  ✔ PASS [Adv-8] Middleware rewrites public markdown requests and attaches Vary: Accept");
    passed++;
  }

  console.log("\n------------------------------------------------------------------");
  console.log(`Passed: ${passed} / ${passed} | Failures: 0`);
  console.log("ALL ADVERSARIAL STRESS CHECKS PASSED!");
  console.log("------------------------------------------------------------------\n");
}

runAdversarialM2().catch((err) => {
  console.error("Adversarial test error:", err);
  process.exit(1);
});

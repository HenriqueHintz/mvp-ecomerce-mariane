import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { SITE_URL } from "@/lib/site";

async function runM3ForensicStress() {
  console.log("==================================================================");
  console.log("   MARIANE COSMÉTICOS — M3 FORENSIC INTEGRITY & SCHEMA STRESS");
  console.log("==================================================================\n");

  const ROOT_DIR = path.resolve(__dirname, "..");
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
  // Phase 1: W3C Valid DOM & Semantic Heading Hierarchy (R3)
  // --------------------------------------------------------------------------
  console.log("[Phase 1] W3C Valid DOM & Heading Hierarchy");

  // 1.1 StoreMapSection: No block or heading tags inside <button>
  const storeMapPath = path.join(ROOT_DIR, "src", "components", "StoreMapSection.tsx");
  const storeMapCode = fs.readFileSync(storeMapPath, "utf-8");
  const buttonTags = storeMapCode.match(/<button[\s\S]*?<\/button>/gi) || [];
  for (let i = 0; i < buttonTags.length; i++) {
    const btn = buttonTags[i];
    assert(!btn.includes("<h3"), `StoreMapSection button #${i + 1} does not contain <h3>`);
    assert(!btn.includes("<p"), `StoreMapSection button #${i + 1} does not contain <p>`);
    assert(!btn.includes("<div"), `StoreMapSection button #${i + 1} does not contain <div>`);
  }

  // 1.2 Home Page Server-Rendered Text Content (>= 500 chars across sections, without layout bloat)
  const homePath = path.join(ROOT_DIR, "src", "app", "page.tsx");
  const homeCode = fs.readFileSync(homePath, "utf-8");
  assert(!homeCode.includes("apresentacao-titulo"), "Home does not inject unrequested presentation section");
  assert(homeCode.includes("Pronta para cuidar da sua beleza?"), "Home renders Chamada Final section");
  assert(storeMapCode.includes("Venha nos visitar em Lages"), "Home renders StoreMapSection");
  assert(storeMapCode.includes("Rua Blumenau, Nº 623"), "Home StoreMap includes official physical store address");
  assert(storeMapCode.includes("(49) 99125-1617"), "Home StoreMap includes official WhatsApp contact");
  assert(!fs.existsSync(path.join(ROOT_DIR, "src", "app", "produto", "[slug]", "loading.tsx")), "Product route omits streaming loading.tsx so notFound returns HTTP 404");
  assert(!fs.existsSync(path.join(ROOT_DIR, "src", "app", "categoria", "[slug]", "loading.tsx")), "Category route omits streaming loading.tsx so notFound returns HTTP 404");

  // --------------------------------------------------------------------------
  // Phase 2: Schema.org JSON-LD Structured Data on Home (R4)
  // --------------------------------------------------------------------------
  console.log("\n[Phase 2] Schema.org JSON-LD Structured Data on Home");

  assert(homeCode.includes('type="application/ld+json"'), "Home renders <script type='application/ld+json'>");
  assert(homeCode.includes("@graph"), "Home JSON-LD uses @graph collection");

  // Verify Schema types
  assert(homeCode.includes('"Store"') && homeCode.includes('"HealthAndBeautyBusiness"'), "Store & HealthAndBeautyBusiness types present");
  assert(homeCode.includes('"Organization"'), "Organization type present");
  assert(homeCode.includes('"WebSite"'), "WebSite type present");
  assert(homeCode.includes('"PostalAddress"'), "PostalAddress type present");
  assert(homeCode.includes('"ItemList"'), "ItemList type present for featured products");
  assert(homeCode.includes('"SearchAction"'), "SearchAction present for catalog search");

  // Verify mandatory NAP & Brand values
  assert(homeCode.includes("Rua Blumenau, 623"), "JSON-LD contains Street Address 'Rua Blumenau, 623'");
  assert(homeCode.includes("88505-300"), "JSON-LD contains Postal Code '88505-300'");
  assert(homeCode.includes("Lages"), "JSON-LD contains Locality 'Lages'");
  assert(homeCode.includes("+55-49-99125-1617"), "JSON-LD contains Phone '+55-49-99125-1617'");
  assert(homeCode.includes("Linda é a mulher que bem se quer"), "JSON-LD contains official Slogan");
  assert(homeCode.includes("https://www.instagram.com/mariane_cosmeticos_01/"), "JSON-LD contains Instagram sameAs link");

  // Verify no fake emails
  const homeLdJsonMatches = homeCode.match(/<script[\s\S]*?application\/ld\+json[\s\S]*?>([\s\S]*?)<\/script>/gi) || [];
  for (const scriptTag of homeLdJsonMatches) {
    assert(!scriptTag.includes("@marianecosmeticos.com.br"), "Home JSON-LD has zero fictitious corporate email");
    assert(!scriptTag.includes("@exemplo.com"), "Home JSON-LD has zero placeholder email");
  }

  // --------------------------------------------------------------------------
  // Phase 3: Product Detail Page JSON-LD (R4)
  // --------------------------------------------------------------------------
  console.log("\n[Phase 3] Product Detail Page JSON-LD");

  const prodPagePath = path.join(ROOT_DIR, "src", "app", "produto", "[slug]", "page.tsx");
  const prodCode = fs.readFileSync(prodPagePath, "utf-8");

  assert(prodCode.includes('"@type": "Product"'), "Product page JSON-LD defines Product type");
  assert(prodCode.includes('"priceCurrency": "BRL"'), "Product page JSON-LD uses BRL currency");
  assert(prodCode.includes("offers"), "Product page JSON-LD defines offers");
  assert(prodCode.includes("seller"), "Product page JSON-LD defines seller");
  assert(prodCode.includes("priceValidUntil"), "Product page JSON-LD defines priceValidUntil");
  assert(prodCode.includes("sku"), "Product page JSON-LD defines sku");
  assert(prodCode.includes("brand"), "Product page JSON-LD defines brand");
  assert(prodCode.includes("absoluteImages"), "Product page JSON-LD resolves absolute image URLs");

  // --------------------------------------------------------------------------
  // Phase 4: Title & Search Optimization (R8)
  // --------------------------------------------------------------------------
  console.log("\n[Phase 4] Title & Search Optimization (R8)");

  const layoutPath = path.join(ROOT_DIR, "src", "app", "layout.tsx");
  const layoutCode = fs.readFileSync(layoutPath, "utf-8");

  const expectedTitle = "Mariane Cosméticos — Cosméticos Profissionais e Perfumaria Madressenza em Lages – SC";
  assert(layoutCode.includes(expectedTitle), "Layout defines exact canonical Home title");
  assert(homeCode.includes(expectedTitle), "Home metadata defines exact canonical Home title");

  // 4.2 External Dependencies Report
  const externalReportPath = path.join(ROOT_DIR, "docs", "relatorio-pendencias-externas.md");
  assert(fs.existsSync(externalReportPath), "docs/relatorio-pendencias-externas.md exists");
  const reportCode = fs.readFileSync(externalReportPath, "utf-8");
  assert(reportCode.includes("Google Search Console"), "Report covers Google Search Console");
  assert(reportCode.includes("Google Business Profile"), "Report covers Google Business Profile");
  assert(reportCode.includes("sitemap.xml"), "Report covers sitemap submission");
  assert(reportCode.includes("marianecosmeticos.com.br"), "Report covers custom domain activation");
  assert(reportCode.includes("308"), "Report covers 308 permanent redirect");

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

runM3ForensicStress().catch((err) => {
  console.error("M3 Forensic stress error:", err);
  process.exit(1);
});

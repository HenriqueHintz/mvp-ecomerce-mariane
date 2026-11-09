import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, test, expect } from "./framework";
import { db, products, brands, categories } from "@/db";
import { eq } from "drizzle-orm";

const ROOT_DIR = path.resolve(__dirname, "../..");

describe("Tier 1 - Feature Coverage", () => {
  // =========================================================================
  // Core Feature 1: Logo & Favicon Assets
  // Authoritative Source: ORIGINAL_REQUEST.md §R1, PROJECT.md Feature #1, #2, #3
  // =========================================================================
  describe("Core Feature 1: Logo & Favicon Assets", () => {
    test(
      "1.1 Exact Vector SVG Logo file or component exists with valid viewBox",
      () => {
        const svgPath = path.join(ROOT_DIR, "public", "logo.svg");
        const logoCompPath = path.join(ROOT_DIR, "src", "components", "Logo.tsx");
        const exists = fs.existsSync(svgPath) || fs.existsSync(logoCompPath);
        expect(exists).toBe(true, "Expected either public/logo.svg or src/components/Logo.tsx to exist");

        let content = "";
        if (fs.existsSync(svgPath)) {
          content = fs.readFileSync(svgPath, "utf-8");
        } else if (fs.existsSync(logoCompPath)) {
          content = fs.readFileSync(logoCompPath, "utf-8");
        }

        expect(content.toLowerCase()).toContain("<svg", "Expected valid <svg element");
        expect(content.toLowerCase()).toContain("viewbox", "Expected SVG to define viewBox for crisp scalability");
      },
      { tier: 1, milestone: "M1", authoritativeSource: "ORIGINAL_REQUEST.md §R1" }
    );

    test(
      "1.2 Logo component references official Mariane Cosméticos assets (/logo-nav.png, /logo-white.png, /logo-mariane-banner.png)",
      () => {
        const logoCompPath = path.join(ROOT_DIR, "src", "components", "Logo.tsx");
        const content = fs.readFileSync(logoCompPath, "utf-8");

        expect(content).toContain("/logo-nav.png", "Expected Logo.tsx to use /logo-nav.png for dark tone");
        expect(content).toContain("/logo-white.png", "Expected Logo.tsx to use /logo-white.png for light tone");
        expect(content).toContain("/logo-mariane-banner.png", "Expected Logo.tsx to use /logo-mariane-banner.png for badge variant");
      },
      { tier: 1, milestone: "M1", authoritativeSource: "docs/DESIGN.md §2" }
    );

    test(
      "1.3 Logo SVG and component contain official 'Mariane Cosméticos' branding",
      () => {
        const svgPath = path.join(ROOT_DIR, "public", "logo.svg");
        const logoCompPath = path.join(ROOT_DIR, "src", "components", "Logo.tsx");
        const svgContent = fs.readFileSync(svgPath, "utf-8");
        const compContent = fs.readFileSync(logoCompPath, "utf-8");

        expect(svgContent).toMatch(/Mariane\s+Cosm[eé]ticos/i, "Expected logo.svg to display 'Mariane Cosméticos'");
        expect(compContent).toMatch(/Mariane\s+Cosm[eé]ticos/i, "Expected Logo.tsx to default to 'Mariane Cosméticos'");
      },
      { tier: 1, milestone: "M1", authoritativeSource: "docs/DESIGN.md §1, §2" }
    );

    test(
      "1.4 Logo SVG contains 'COSMÉTICOS' lettering",
      () => {
        const svgPath = path.join(ROOT_DIR, "public", "logo.svg");
        const logoCompPath = path.join(ROOT_DIR, "src", "components", "Logo.tsx");
        let content = "";
        if (fs.existsSync(svgPath)) content += fs.readFileSync(svgPath, "utf-8");
        if (fs.existsSync(logoCompPath)) content += fs.readFileSync(logoCompPath, "utf-8");

        const cosmeticosRegex = /cosm[eé]ticos/i;
        expect(content).toMatch(cosmeticosRegex, "Expected logo SVG to display 'COSMÉTICOS'");
      },
      { tier: 1, milestone: "M1", authoritativeSource: "docs/DESIGN.md §1" }
    );

    test(
      "1.5 App icon SVG incorporates official Mariane silhouette and Madressenza credential",
      () => {
        const svgPath = path.join(ROOT_DIR, "public", "logo.svg");
        const appIconPath = path.join(ROOT_DIR, "src", "app", "icon.svg");
        const svgContent = fs.readFileSync(svgPath, "utf-8");
        const iconContent = fs.readFileSync(appIconPath, "utf-8");

        expect(svgContent).toMatch(/Madressenza/i, "Expected logo.svg to reference official Madressenza credential");
        expect(iconContent).toMatch(/Mariane\s+Cosm[eé]ticos/i, "Expected src/app/icon.svg to identify Mariane Cosméticos");
      },
      { tier: 1, milestone: "M1", authoritativeSource: "docs/DESIGN.md §2" }
    );

    test(
      "1.6 Favicon or app icon asset exists in public/ or src/app/",
      () => {
        const faviconIco = path.join(ROOT_DIR, "public", "favicon.ico");
        const appIconSvg = path.join(ROOT_DIR, "src", "app", "icon.svg");
        const appIconPng = path.join(ROOT_DIR, "src", "app", "icon.png");
        const publicLogo = path.join(ROOT_DIR, "public", "logo.svg");

        const exists =
          fs.existsSync(faviconIco) ||
          fs.existsSync(appIconSvg) ||
          fs.existsSync(appIconPng) ||
          fs.existsSync(publicLogo);

        expect(exists).toBe(true, "Expected favicon or icon asset in public/ or src/app/");
      },
      { tier: 1, milestone: "M1", authoritativeSource: "ORIGINAL_REQUEST.md §R1, PROJECT.md Feature #3" }
    );
  });

  // =========================================================================
  // Core Feature 2: Header & Navigation
  // Authoritative Source: ORIGINAL_REQUEST.md §R1, §R2, PROJECT.md Feature #6
  // =========================================================================
  describe("Core Feature 2: Header & Navigation", () => {
    test(
      "2.1 Header contains store branding anchor linking to homepage '/'",
      () => {
        const headerPath = path.join(ROOT_DIR, "src", "components", "Header.tsx");
        const headerCode = fs.readFileSync(headerPath, "utf-8");

        expect(headerCode).toContain('href="/"', "Header must link brand logo to '/'");
      },
      { tier: 1, milestone: "M2", authoritativeSource: "PROJECT.md Feature #6" }
    );

    test(
      "2.2 Header omits top product search bar and displays official brand credentials",
      () => {
        const headerPath = path.join(ROOT_DIR, "src", "components", "Header.tsx");
        const headerCode = fs.readFileSync(headerPath, "utf-8");

        expect(headerCode.includes('type="text"')).toBe(false, "Header must not render a top search text input");
        expect(headerCode).toContain("Revendedora Oficial Madressenza", "Header must display official Madressenza credential");
      },
      { tier: 1, milestone: "M2", authoritativeSource: "PROJECT.md Feature #6" }
    );

    test(
      "2.3 Header renders navigation links covering Todos os Produtos and official partner brands",
      () => {
        const headerPath = path.join(ROOT_DIR, "src", "components", "Header.tsx");
        const headerCode = fs.readFileSync(headerPath, "utf-8");

        expect(headerCode).toContain("/produtos", "Header must link to Todos os Produtos");
        expect(headerCode).toContain("/produtos?marca=madressenza", "Header must link to Madressenza brand");
        expect(headerCode).toContain("/produtos?marca=wella-profissional", "Header must link to Wella Profissional brand");
        expect(headerCode).toContain("/produtos?marca=loreal-professionnel", "Header must link to L'Oréal Professionnel brand");
      },
      { tier: 1, milestone: "M2", authoritativeSource: "PROJECT.md Feature #6" }
    );

    test(
      "2.4 Header provides customer service WhatsApp action link",
      () => {
        const headerPath = path.join(ROOT_DIR, "src", "components", "Header.tsx");
        const headerCode = fs.readFileSync(headerPath, "utf-8");

        expect(headerCode).toMatch(/wa\.me\/\d+/i, "Header must link to WhatsApp customer service");
      },
      { tier: 1, milestone: "M2", authoritativeSource: "PROJECT.md Feature #6" }
    );

    test(
      "2.5 Header includes shopping bag button displaying dynamic item counter badge",
      () => {
        const headerPath = path.join(ROOT_DIR, "src", "components", "Header.tsx");
        const headerCode = fs.readFileSync(headerPath, "utf-8");

        expect(headerCode).toContain("totalItems", "Header must consume totalItems from CartContext");
        expect(headerCode).toContain("setIsCartOpen", "Header bag button must toggle setIsCartOpen");
      },
      { tier: 1, milestone: "M2", authoritativeSource: "PROJECT.md Feature #6" }
    );
  });

  // =========================================================================
  // Core Feature 3: Footer & Brand Identity
  // Authoritative Source: ORIGINAL_REQUEST.md §R3, PROJECT.md Feature #7, #9, #10
  // =========================================================================
  describe("Core Feature 3: Footer & Brand Identity", () => {
    test(
      "3.1 Footer displays official brand slogan 'Linda é a mulher que bem se quer'",
      () => {
        const footerPath = path.join(ROOT_DIR, "src", "components", "Footer.tsx");
        const footerCode = fs.readFileSync(footerPath, "utf-8");

        const sloganRegex = /Linda\s+[eé]\s+a\s+mulher\s+que\s+bem\s+se\s+quer/i;
        expect(footerCode).toMatch(sloganRegex, "Footer must display official slogan: 'Linda é a mulher que bem se quer'");
      },
      { tier: 1, milestone: "M2", authoritativeSource: "ORIGINAL_REQUEST.md §R3, PROJECT.md Feature #9" }
    );

    test(
      "3.2 Footer displays official store location 'Rua Blumenau, Nº 623 — Lages - SC'",
      () => {
        const footerPath = path.join(ROOT_DIR, "src", "components", "Footer.tsx");
        const footerCode = fs.readFileSync(footerPath, "utf-8");

        const streetRegex = /Rua\s+Blumenau,\s*N[º°]\s*623/i;
        const cityRegex = /Lages\s*[-–]\s*SC/i;
        expect(footerCode).toMatch(streetRegex, "Footer must display official street: 'Rua Blumenau, Nº 623'");
        expect(footerCode).toMatch(cityRegex, "Footer must display official city: 'Lages - SC'");
      },
      { tier: 1, milestone: "M2", authoritativeSource: "ORIGINAL_REQUEST.md §R3, PROJECT.md Feature #10" }
    );

    test(
      "3.3 Footer contains official Instagram link to @mariane_cosmeticos_01",
      () => {
        const footerPath = path.join(ROOT_DIR, "src", "components", "Footer.tsx");
        const footerCode = fs.readFileSync(footerPath, "utf-8");

        const instaRegex = /instagram\.com\/mariane_cosmeticos_01/i;
        expect(footerCode).toMatch(instaRegex, "Footer must link to official Instagram profile @mariane_cosmeticos_01");
      },
      { tier: 1, milestone: "M2", authoritativeSource: "ORIGINAL_REQUEST.md §R3, PROJECT.md Feature #7" }
    );

    test(
      "3.4 Footer contains official WhatsApp link with phone 5549991251617",
      () => {
        const footerPath = path.join(ROOT_DIR, "src", "components", "Footer.tsx");
        const footerCode = fs.readFileSync(footerPath, "utf-8");

        const waRegex = /wa\.me\/5549991251617/i;
        expect(footerCode).toMatch(waRegex, "Footer must link to real WhatsApp phone 5549991251617");
      },
      { tier: 1, milestone: "M2", authoritativeSource: "PROJECT.md Feature #10" }
    );

    test(
      "3.5 Footer renders trust and safety indicators (Frete Grátis, 10x Sem Juros, Site Seguro)",
      () => {
        const footerPath = path.join(ROOT_DIR, "src", "components", "Footer.tsx");
        const footerCode = fs.readFileSync(footerPath, "utf-8");

        expect(footerCode.toLowerCase()).toContain("frete grátis", "Footer must highlight Frete Grátis");
        expect(footerCode.toLowerCase()).toContain("sem juros", "Footer must highlight parcelamento sem juros");
        expect(footerCode.toLowerCase()).toContain("seguro", "Footer must highlight site seguro");
      },
      { tier: 1, milestone: "M2", authoritativeSource: "PROJECT.md Feature #7" }
    );
  });

  // =========================================================================
  // Core Feature 4: Hero Banner & Brand Showcase / Vitrines
  // Authoritative Source: ORIGINAL_REQUEST.md §R2, PROJECT.md Feature #11, #12, #13
  // =========================================================================
  describe("Core Feature 4: Hero Banner & Brand Showcase / Vitrines", () => {
    test(
      "4.1 Hero section renders Sephora-inspired editorial stage without HeroVisualCarousel card carousel",
      () => {
        const homePath = path.join(ROOT_DIR, "src", "app", "page.tsx");
        const homeCode = fs.readFileSync(homePath, "utf-8");

        expect(homeCode).toMatch(/<section/i, "HomePage must define a hero section");
        expect(homeCode).toMatch(/<h1/i, "Hero section must render an authoritative h1 headline");
        expect(homeCode.includes("HeroVisualCarousel")).toBe(false, "Hero section must not use HeroVisualCarousel");
        expect(homeCode).toContain("HeroPanoramicBanner", "Hero section must include HeroPanoramicBanner panoramic product carousel");
        expect(homeCode.includes("Curadoria Oficial Mariane")).toBe(false, "Hero section must omit Curadoria Oficial Mariane per user direction");
        expect(homeCode.includes("Destaques & Linhas em Alta")).toBe(false, "Hero section must omit Destaques & Linhas em Alta per user direction");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "ORIGINAL_REQUEST.md §R2, PROJECT.md Feature #11" }
    );

    test(
      "4.2 Hero primary CTA button links directly to /produtos catalog",
      () => {
        const homePath = path.join(ROOT_DIR, "src", "app", "page.tsx");
        const homeCode = fs.readFileSync(homePath, "utf-8");

        expect(homeCode).toContain('href="/produtos"', "Hero CTA must link to /produtos");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "PROJECT.md Feature #11" }
    );

    test(
      "4.3 Hero secondary WhatsApp consultation CTA button is present",
      () => {
        const homePath = path.join(ROOT_DIR, "src", "app", "page.tsx");
        const homeCode = fs.readFileSync(homePath, "utf-8");

        expect(homeCode).toMatch(/wa\.me\/\d+/i, "Hero section must include WhatsApp consultation CTA");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "PROJECT.md Feature #11" }
    );

    test(
      "4.4 Brand showcase component references official partner brands (Wella, L'Oréal, Truss, Braé)",
      () => {
        const brandCarouselPath = path.join(ROOT_DIR, "src", "components", "BrandCarousel.tsx");
        const carouselCode = fs.readFileSync(brandCarouselPath, "utf-8");

        expect(carouselCode).toContain("Wella", "Brand showcase must include Wella");
        expect(carouselCode).toContain("L'Oréal", "Brand showcase must include L'Oréal");
        expect(carouselCode).toContain("Truss", "Brand showcase must include Truss");
        expect(carouselCode).toContain("Braé", "Brand showcase must include Braé");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "PROJECT.md Feature #12" }
    );

    test(
      "4.5 Product cards render product title, price, 5% PIX discount, and installment terms",
      () => {
        const cardPath = path.join(ROOT_DIR, "src", "components", "ProductCard.tsx");
        const cardCode = fs.readFileSync(cardPath, "utf-8");

        expect(cardCode).toContain("pixPrice", "ProductCard must compute and display PIX price");
        expect(cardCode).toContain("installments", "ProductCard must display installment terms");
        expect(cardCode).toContain("addItem", "ProductCard must provide quick-add action to cart");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "ORIGINAL_REQUEST.md §R2, PROJECT.md Feature #13" }
    );
  });

  // =========================================================================
  // Core Feature 5: Catalog & Product Detail Navigation
  // Authoritative Source: ORIGINAL_REQUEST.md §R2, PROJECT.md Feature #14, #15
  // =========================================================================
  describe("Core Feature 5: Catalog & Product Detail Navigation", () => {
    test(
      "5.1 Database contains products and brands ready for catalog rendering",
      async () => {
        const allProducts = await db.select().from(products).limit(10);
        const allBrands = await db.select().from(brands);

        expect(allProducts.length).toBeGreaterThan(0, "Database must contain products");
        expect(allBrands.length).toBeGreaterThan(0, "Database must contain partner brands");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "PROJECT.md Architecture §Database" }
    );

    test(
      "5.2 Catalog query correctly filters products by brand slug",
      async () => {
        const wellaBrand = await db.select().from(brands).where(eq(brands.slug, "wella-profissional")).limit(1);
        expect(wellaBrand.length).toBe(1, "Wella brand should exist in db");

        const wellaProducts = await db.select().from(products).where(eq(products.brandId, wellaBrand[0].id));
        expect(wellaProducts.length).toBeGreaterThan(0, "Wella brand should have products associated");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "PROJECT.md Feature #15" }
    );

    test(
      "5.3 Catalog query correctly filters products by category slug",
      async () => {
        const cat = await db.select().from(categories).where(eq(categories.slug, "tratamento-mascaras")).limit(1);
        expect(cat.length).toBe(1, "Tratamento & Máscaras category should exist in db");

        const catProducts = await db.select().from(products).where(eq(products.categoryId, cat[0].id));
        expect(catProducts.length).toBeGreaterThan(0, "Category should have products associated");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "PROJECT.md Feature #15" }
    );

    test(
      "5.4 Product detail page resolves existing product slug and attributes",
      async () => {
        const product = await db.select().from(products).limit(1);
        expect(product.length).toBe(1);

        const slug = product[0].slug;
        const lookup = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
        expect(lookup.length).toBe(1);
        expect(lookup[0].name).toBe(product[0].name);
        expect(lookup[0].price).toBeGreaterThan(0);
      },
      { tier: 1, milestone: "M3", authoritativeSource: "PROJECT.md Feature #15" }
    );

    test(
      "5.5 Catalog page code contains empty state handling for zero search matches",
      () => {
        const produtosPath = path.join(ROOT_DIR, "src", "app", "produtos", "page.tsx");
        const produtosCode = fs.readFileSync(produtosPath, "utf-8");

        expect(produtosCode).toContain("Nenhum produto encontrado", "Catalog must provide user feedback on empty results");
        expect(produtosCode).toContain("Limpar Filtros", "Catalog must provide button to clear filters");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "PROJECT.md Feature #15" }
    );
  });

  // =========================================================================
  // Core Feature 6: Cart Drawer & WhatsApp Order Message
  // Authoritative Source: ORIGINAL_REQUEST.md §R3, PROJECT.md Feature #16, #17
  // =========================================================================
  describe("Core Feature 6: Cart Drawer & WhatsApp Order Message", () => {
    test(
      "6.1 Cart Context defines cart operations: addItem, removeItem, updateQuantity, clearCart",
      () => {
        const cartPath = path.join(ROOT_DIR, "src", "context", "CartContext.tsx");
        const cartCode = fs.readFileSync(cartPath, "utf-8");

        expect(cartCode).toContain("addItem", "CartContext must export addItem");
        expect(cartCode).toContain("removeItem", "CartContext must export removeItem");
        expect(cartCode).toContain("updateQuantity", "CartContext must export updateQuantity");
        expect(cartCode).toContain("clearCart", "CartContext must export clearCart");
      },
      { tier: 1, milestone: "M4", authoritativeSource: "PROJECT.md Feature #16" }
    );

    test(
      "6.2 Cart Drawer displays item details (thumbnail, name, quantity, price)",
      () => {
        const drawerPath = path.join(ROOT_DIR, "src", "components", "CartDrawer.tsx");
        const drawerCode = fs.readFileSync(drawerPath, "utf-8");

        expect(drawerCode).toContain("item.name", "CartDrawer must display item.name");
        expect(drawerCode).toContain("item.quantity", "CartDrawer must display item.quantity");
        expect(drawerCode).toContain("updateQuantity", "CartDrawer must support quantity adjustments");
        expect(drawerCode).toContain("removeItem", "CartDrawer must support item removal");
      },
      { tier: 1, milestone: "M4", authoritativeSource: "PROJECT.md Feature #16" }
    );

    test(
      "6.3 Free shipping progress calculation tracks dynamically against R$ 199 threshold",
      () => {
        const cartPath = path.join(ROOT_DIR, "src", "context", "CartContext.tsx");
        const cartCode = fs.readFileSync(cartPath, "utf-8");

        expect(cartCode).toContain("freeShippingThreshold", "CartContext must define freeShippingThreshold");
        expect(cartCode).toContain("199", "freeShippingThreshold must be R$ 199.00");
        expect(cartCode).toContain("freeShippingProgress", "CartContext must export freeShippingProgress");
      },
      { tier: 1, milestone: "M4", authoritativeSource: "PROJECT.md Feature #16" }
    );

    test(
      "6.4 generateWhatsAppLink formats order message header with Mariane Cosméticos and official slogan",
      () => {
        const cartPath = path.join(ROOT_DIR, "src", "context", "CartContext.tsx");
        const cartCode = fs.readFileSync(cartPath, "utf-8");

        const brandHeaderRegex = /MARIANE\s+COSM[EÉ]TICOS/i;
        const sloganRegex = /Linda\s+[eé]\s+a\s+mulher\s+que\s+bem\s+se\s+quer/i;

        expect(cartCode).toMatch(brandHeaderRegex, "WhatsApp template header must state MARIANE COSMÉTICOS");
        expect(cartCode).toMatch(sloganRegex, "WhatsApp template must include official slogan");
      },
      { tier: 1, milestone: "M4", authoritativeSource: "ORIGINAL_REQUEST.md §R3, PROJECT.md Feature #17" }
    );

    test(
      "6.5 generateWhatsAppLink uses real WhatsApp phone number 5549991251617",
      () => {
        const cartPath = path.join(ROOT_DIR, "src", "context", "CartContext.tsx");
        const cartCode = fs.readFileSync(cartPath, "utf-8");

        expect(cartCode).toContain("5549991251617", "WhatsApp template must use 5549991251617");
      },
      { tier: 1, milestone: "M4", authoritativeSource: "PROJECT.md Feature #10, #17" }
    );
  });

  // =========================================================================
  // Core Feature 7: Reusable Base UI Components & Design System
  // Authoritative Source: docs/DESIGN.md §7.1
  // =========================================================================
  describe("Core Feature 7: Reusable Base UI Components & Design System", () => {
    test(
      "7.1 Base UI components (Button, Badge, Price, SectionHeader, Container) exist with hover, focus, and disabled states",
      () => {
        const uiDir = path.join(ROOT_DIR, "src", "components", "ui");
        const requiredFiles = ["Button.tsx", "Badge.tsx", "Price.tsx", "SectionHeader.tsx", "Container.tsx", "index.ts"];
        for (const file of requiredFiles) {
          expect(fs.existsSync(path.join(uiDir, file))).toBe(true, `Expected src/components/ui/${file} to exist`);
        }

        const buttonCode = fs.readFileSync(path.join(uiDir, "Button.tsx"), "utf-8");
        expect(buttonCode).toContain("focus-visible:ring-2", "Button must define focus-visible state");
        expect(buttonCode).toContain("disabled:opacity-50", "Button must define disabled state");
        expect(buttonCode).toContain("hover:bg-marina-600", "Button must define hover state");
      },
      { tier: 1, milestone: "M1", authoritativeSource: "docs/DESIGN.md §7.1" }
    );

    test(
      "7.2 Home presents Madressenza curation and official partner brand highlights",
      async () => {
        const homeCode = fs.readFileSync(path.join(ROOT_DIR, "src", "app", "page.tsx"), "utf-8");
        expect(homeCode).toContain("Madressenza", "Home must feature Madressenza official credential");
        expect(homeCode.includes("Guia de Tratamento Capilar")).toBe(false, "Home must omit 3-step Cronograma Capilar guide section per user direction");

        const madressenzaBrand = await db.select().from(brands).where(eq(brands.slug, "madressenza")).limit(1);
        expect(madressenzaBrand.length).toBe(1, "Madressenza must exist in brands table");

        const madressenzaProducts = await db
          .select()
          .from(products)
          .where(eq(products.brandId, madressenzaBrand[0].id));
        expect(madressenzaProducts.length).toBeGreaterThan(0, "Madressenza must have curated products in database");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "docs/plans/mvp.md Task 1 & Task 7" }
    );

    test(
      "7.3 Catalog server query supports combined brand, category, price range, search, sorting, and pagination",
      async () => {
        const { queryCatalogProducts, buildCatalogUrl } = await import("@/lib/catalog");

        const page1 = await queryCatalogProducts({
          pagina: "1",
          pageSize: 8,
          ordem: "menor_preco",
        });
        expect(page1.items.length).toBe(8, "Page 1 with pageSize=8 must return 8 products");
        expect(page1.totalCount).toBeGreaterThan(20, "Total catalog count should exceed 20 products");
        expect(page1.totalPages).toBeGreaterThan(1, "Catalog must have multiple pages");
        expect(page1.items[0].effectivePrice <= page1.items[1].effectivePrice).toBe(
          true,
          "Sorting by menor_preco must order ascending by effectivePrice"
        );

        const filteredByPrice = await queryCatalogProducts({
          preco: "ate-100",
          pageSize: 50,
        });
        expect(filteredByPrice.items.length).toBeGreaterThan(0, "Price range ate-100 should return matching products");
        for (const item of filteredByPrice.items) {
          expect(item.effectivePrice <= 100).toBe(true, "Every product in ate-100 must have effectivePrice <= 100");
        }

        const combinedUrl = buildCatalogUrl(
          { marca: "wella-profissional", categoria: "tratamento-mascaras", ordem: "menor_preco" },
          { pagina: "2" }
        );
        expect(combinedUrl).toContain("marca=wella-profissional");
        expect(combinedUrl).toContain("categoria=tratamento-mascaras");
        expect(combinedUrl).toContain("ordem=menor_preco");
        expect(combinedUrl).toContain("pagina=2");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "docs/plans/mvp.md Task 2" }
    );

    test(
      "7.4 Product detail page defines dynamic generateMetadata, Product JSON-LD, and Related Products",
      () => {
        const prodPagePath = path.join(ROOT_DIR, "src", "app", "produto", "[slug]", "page.tsx");
        const prodPageCode = fs.readFileSync(prodPagePath, "utf-8");

        expect(prodPageCode).toContain("export async function generateMetadata", "Product page must export generateMetadata");
        expect(prodPageCode).toContain("application/ld+json", "Product page must render Product JSON-LD structured data");
        expect(prodPageCode).toContain('"@type": "Product"', "JSON-LD must specify schema.org Product");
        expect(prodPageCode).toContain("Produtos Relacionados", "Product page must render Related Products section");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "docs/plans/mvp.md Task 3" }
    );

    test(
      "7.5 Dedicated cart page (/carrinho) and institutional pages (/atendimento, /politica-de-privacidade, /trocas-e-devolucoes) exist",
      () => {
        const routes = [
          ["src", "app", "carrinho", "page.tsx"],
          ["src", "app", "atendimento", "page.tsx"],
          ["src", "app", "politica-de-privacidade", "page.tsx"],
          ["src", "app", "trocas-e-devolucoes", "page.tsx"],
        ];
        for (const routeSegments of routes) {
          const fullPath = path.join(ROOT_DIR, ...routeSegments);
          expect(fs.existsSync(fullPath)).toBe(true, `Expected route file ${routeSegments.join("/")} to exist`);
        }
      },
      { tier: 1, milestone: "M4", authoritativeSource: "docs/plans/mvp.md Task 6" }
    );

    test(
      "7.6 Category page (/categoria/[slug]) defines dynamic generateMetadata, price range filters, and search input, and ProductCard uses <Price />",
      () => {
        const catPagePath = path.join(ROOT_DIR, "src", "app", "categoria", "[slug]", "page.tsx");
        const catPageCode = fs.readFileSync(catPagePath, "utf-8");

        expect(catPageCode).toContain("export async function generateMetadata", "Category page must export generateMetadata");
        expect(catPageCode).toContain("PRICE_RANGES", "Category page must render PRICE_RANGES filter options");
        expect(catPageCode).toContain('name="q"', "Category page must include a search input for filtering within category");

        const cardPath = path.join(ROOT_DIR, "src", "components", "ProductCard.tsx");
        const cardCode = fs.readFileSync(cardPath, "utf-8");
        expect(cardCode).toContain("<Price", "ProductCard must use the standardized <Price /> UI component");
      },
      { tier: 1, milestone: "M3", authoritativeSource: "docs/DESIGN.md §7.1, docs/plans/mvp.md Task 2" }
    );
  });
});


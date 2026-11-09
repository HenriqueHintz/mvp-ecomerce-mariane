/**
 * Runtime SSR Stress Harness for HeroCarousel
 * Tests adversarial props, edge-case arrays, empty arrays, XSS payloads, and HTML structure
 */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HeroCarousel, { HeroCarouselProps } from "../src/components/HeroCarousel";
import { HERO_SLIDES, HERO_CONTENT } from "../src/data/hero-slides";

let passed = 0;
const failures: string[] = [];

function recordPass(testName: string, detail?: string) {
  passed++;
  console.log(`  [PASS] ${testName}${detail ? ` -> ${detail}` : ""}`);
}

function recordFail(testName: string, error: string) {
  failures.push(`${testName}: ${error}`);
  console.log(`  [FAIL] ${testName} -> ${error}`);
}

console.log("==================================================================");
console.log("  HEROCAROUSEL RUNTIME SSR & ADVERSARIAL PROP STRESS HARNESS");
console.log("==================================================================");

// 1. Default instantiation
try {
  const html = renderToStaticMarkup(React.createElement(HeroCarousel, {}));
  const hasDesktopImage = html.includes("/hero/slide-1-desktop.webp") || html.includes("%2Fhero%2Fslide-1-desktop.webp");
  const hasMobileImage = html.includes("/hero/slide-1-mobile.webp") || html.includes("%2Fhero%2Fslide-1-mobile.webp");
  if (
    html.includes("Linda é a mulher que bem se quer") &&
    hasDesktopImage &&
    hasMobileImage &&
    html.includes("VER CATÁLOGO →") &&
    html.includes("COMPRAR PELO WHATSAPP")
  ) {
    recordPass("Default SSR Render", `Rendered ${html.length} bytes containing exact M1 copy and assets`);
  } else {
    recordFail("Default SSR Render", "Missing exact copy or assets in markup");
  }
} catch (e: any) {
  recordFail("Default SSR Render", e.message);
}

// 2. Empty slides array boundary
try {
  const html = renderToStaticMarkup(React.createElement(HeroCarousel, { slides: [] }));
  if (html === "") {
    recordPass("Empty slides array boundary", "Gracefully renders null (empty markup) without throwing");
  } else {
    recordFail("Empty slides array boundary", `Expected empty markup, got: ${html}`);
  }
} catch (e: any) {
  recordFail("Empty slides array boundary", e.message);
}

// 3. Single slide array boundary
try {
  const singleSlide = [HERO_SLIDES[0]];
  const html = renderToStaticMarkup(React.createElement(HeroCarousel, { slides: singleSlide }));
  const hasDesktopImage = html.includes("/hero/slide-1-desktop.webp") || html.includes("%2Fhero%2Fslide-1-desktop.webp");
  if (hasDesktopImage && html.includes('role="region"')) {
    recordPass("Single slide array boundary", "Renders single slide properly");
  } else {
    recordFail("Single slide array boundary", "Failed single slide rendering");
  }
} catch (e: any) {
  recordFail("Single slide array boundary", e.message);
}

// 4. Adversarial long text / text overflow stress
try {
  const extremeHeadline = "A".repeat(500);
  const extremeCuration = "B".repeat(1000);
  const html = renderToStaticMarkup(
    React.createElement(HeroCarousel, {
      headline: extremeHeadline,
      curation: extremeCuration,
    })
  );
  if (html.includes(extremeHeadline) && html.includes(extremeCuration)) {
    recordPass("Extreme text string stress", "Handles 500-char headline and 1000-char curation without memory or formatting collapse");
  } else {
    recordFail("Extreme text string stress", "Failed to preserve extreme text");
  }
} catch (e: any) {
  recordFail("Extreme text string stress", e.message);
}

// 5. XSS Injection attack payloads in copy & labels
try {
  const xssPayload = `<script>alert("pwned")</script><img src=x onerror=alert(1)>`;
  const html = renderToStaticMarkup(
    React.createElement(HeroCarousel, {
      headline: xssPayload,
      curation: xssPayload,
      primaryCtaLabel: xssPayload,
      secondaryCtaLabel: xssPayload,
    })
  );
  if (
    !html.includes("<script>") &&
    !html.includes("<img src=x") &&
    html.includes("&lt;script&gt;")
  ) {
    recordPass("Adversarial XSS Injection", "All user-supplied props are securely escaped by React SSR");
  } else {
    recordFail("Adversarial XSS Injection", "Unescaped HTML tags detected in rendered markup");
  }
} catch (e: any) {
  recordFail("Adversarial XSS Injection", e.message);
}

// 6. Aria accessibility contracts
try {
  const html = renderToStaticMarkup(React.createElement(HeroCarousel, {}));
  const requiredAria = [
    'role="region"',
    'aria-roledescription="carrossel"',
    'aria-label="Destaques Mariane Cosméticos"',
    'role="group"',
    'aria-roledescription="slide"',
    'role="tablist"',
    'role="tab"',
    'aria-selected="true"',
  ];

  let missingAria: string[] = [];
  for (const aria of requiredAria) {
    if (!html.includes(aria)) {
      missingAria.push(aria);
    }
  }

  if (missingAria.length === 0) {
    recordPass("WAI-ARIA Carousel Conformance", "All 8 core ARIA roles and labels are present in SSR markup");
  } else {
    recordFail("WAI-ARIA Carousel Conformance", `Missing ARIA attributes: ${missingAria.join(", ")}`);
  }
} catch (e: any) {
  recordFail("WAI-ARIA Carousel Conformance", e.message);
}

console.log("------------------------------------------------------------------");
console.log(`Passed: ${passed} | Failures: ${failures.length}`);
if (failures.length > 0) {
  process.exit(1);
} else {
  console.log("ALL RUNTIME SSR & ADVERSARIAL PROP TESTS PASSED!");
  process.exit(0);
}

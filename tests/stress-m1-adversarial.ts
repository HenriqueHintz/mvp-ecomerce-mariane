/**
 * Adversarial Component & Token Stress Test for Mariane Cosméticos Milestone M1
 * Aligned with docs/DESIGN.md (Decisions 1, 2-A, 3-A)
 */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";
import path from "path";
import { Logo, LogoVariant, LogoSize, LogoTone } from "../src/components/Logo";

const ROOT_DIR = path.resolve(__dirname, "..");

let passed = 0;
const failures: Array<{ test: string; error: string }> = [];

function recordPass(testName: string, detail?: string) {
  passed++;
  console.log(`  [PASS] ${testName}${detail ? ` -> ${detail}` : ""}`);
}

function recordFail(testName: string, error: string) {
  failures.push({ test: testName, error });
  console.log(`  [FAIL] ${testName} -> ${error}`);
}

console.log("==================================================================");
console.log("  MARIANE COSMÉTICOS — M1 COMPONENT & DESIGN TOKEN STRESS TEST");
console.log("==================================================================");

// ----------------------------------------------------------------------
// 1. Full 3D Cartesian Product Matrix: 3 variants × 4 sizes × 2 tones = 24
// ----------------------------------------------------------------------
console.log("\n[1] Rendering Matrix: 24 Core Combinations (variant × size × tone)");

const variants: LogoVariant[] = ["badge", "horizontal", "icon"];
const sizes: LogoSize[] = ["sm", "md", "lg", "xl"];
const tones: LogoTone[] = ["dark", "light"];

const EXPECTED_SIZE_CLASSES: Record<LogoSize, string> = {
  sm: "h-11 w-auto",
  md: "h-16 w-auto",
  lg: "h-20 sm:h-24 w-auto",
  xl: "h-28 sm:h-32 w-auto",
};

for (const variant of variants) {
  for (const size of sizes) {
    for (const tone of tones) {
      const testName = `<Logo variant="${variant}" size="${size}" tone="${tone}" />`;
      try {
        const html = renderToStaticMarkup(
          React.createElement(Logo, { variant, size, tone })
        );

        if (!html.includes("<div") || !html.endsWith("</div>")) {
          recordFail(testName, "Output does not contain and end with <div> container");
          continue;
        }

        if (!html.includes("<img")) {
          recordFail(testName, "Image element missing in rendered markup");
          continue;
        }

        const expectedClass = EXPECTED_SIZE_CLASSES[size];
        if (!html.includes(expectedClass)) {
          recordFail(testName, `Expected container class "${expectedClass}"`);
          continue;
        }

        // Verify official asset binding per variant & tone (Decision 2-A)
        if (variant === "badge") {
          if (!html.includes("logo-mariane-banner.png")) {
            recordFail(testName, "Badge variant must reference /logo-mariane-banner.png");
            continue;
          }
        } else if (variant === "icon") {
          if (!html.includes("icon.svg")) {
            recordFail(testName, "Icon variant must reference /icon.svg");
            continue;
          }
        } else {
          const expectedAsset = tone === "light" ? "logo-white.png" : "logo-nav.png";
          if (!html.includes(expectedAsset)) {
            recordFail(testName, `Horizontal (${tone}) must reference /${expectedAsset}`);
            continue;
          }
        }

        recordPass(testName, `Rendered ${html.length} chars, class="${expectedClass}"`);
      } catch (err: any) {
        recordFail(testName, `Exception during render: ${err.message}`);
      }
    }
  }
}

// ----------------------------------------------------------------------
// 2. Default Props and Parameterless Instantiation
// ----------------------------------------------------------------------
console.log("\n[2] Testing Default Props (<Logo />)");

try {
  const defaultHtml = renderToStaticMarkup(React.createElement(Logo, {}));
  if (
    defaultHtml.includes("logo-nav.png") &&
    defaultHtml.includes("h-16 w-auto") &&
    defaultHtml.includes('alt="Mariane Cosméticos - Revendedora oficial Madressenza"')
  ) {
    recordPass(
      "<Logo /> Defaults",
      "Defaults to variant='horizontal', size='md', tone='dark' (/logo-nav.png), alt='Mariane Cosméticos - Revendedora oficial Madressenza'"
    );
  } else {
    recordFail("<Logo /> Defaults", `Default markup mismatch: ${defaultHtml.slice(0, 250)}`);
  }
} catch (err: any) {
  recordFail("<Logo /> Defaults", `Exception: ${err.message}`);
}

// ----------------------------------------------------------------------
// 3. Custom Props & Class Name Concatenation
// ----------------------------------------------------------------------
console.log("\n[3] Testing Custom Props & Prop Merging");

try {
  const customHtml = renderToStaticMarkup(
    React.createElement(Logo, {
      variant: "horizontal",
      className: "custom-nav-logo shadow-lg hover:scale-105",
      alt: "Loja Oficial Mariane Cosméticos",
    })
  );

  if (
    customHtml.includes("custom-nav-logo") &&
    customHtml.includes("shadow-lg") &&
    customHtml.includes("hover:scale-105") &&
    customHtml.includes('alt="Loja Oficial Mariane Cosméticos"')
  ) {
    recordPass("Custom className and alt props", "Correctly merged and propagated to Image accessibility attributes");
  } else {
    recordFail("Custom className and alt props", "Custom classes or alt text missing");
  }
} catch (err: any) {
  recordFail("Custom className and alt props", `Exception: ${err.message}`);
}

// ----------------------------------------------------------------------
// 4. Adversarial Inputs & Boundary Conditions
// ----------------------------------------------------------------------
console.log("\n[4] Adversarial & Boundary Inputs");

// 4.1 Invalid variant fallback
try {
  const invalidVariantHtml = renderToStaticMarkup(
    React.createElement(Logo, { variant: "unsupported_variant" as any })
  );
  if (invalidVariantHtml.includes("logo-nav.png")) {
    recordPass("Adversarial: Invalid variant fallback", "Gracefully falls back to horizontal /logo-nav.png without throwing");
  } else {
    recordFail("Adversarial: Invalid variant fallback", "Failed to render fallback image on unknown variant");
  }
} catch (err: any) {
  recordFail("Adversarial: Invalid variant fallback", `Threw exception: ${err.message}`);
}

// 4.2 Invalid size fallback
try {
  const invalidSizeHtml = renderToStaticMarkup(
    React.createElement(Logo, { size: "gigantic" as any })
  );
  if (invalidSizeHtml.includes("h-16 w-auto")) {
    recordPass("Adversarial: Invalid size fallback", "Falls back to default md size class (h-16 w-auto)");
  } else {
    recordFail("Adversarial: Invalid size fallback", "Did not fall back to default size");
  }
} catch (err: any) {
  recordFail("Adversarial: Invalid size fallback", `Threw exception: ${err.message}`);
}

// 4.3 XSS / HTML Entity Injections in alt
try {
  const xssPayload = `<script>alert('xss')</script> & "special" 'chars'`;
  const xssHtml = renderToStaticMarkup(
    React.createElement(Logo, { alt: xssPayload })
  );
  if (
    !xssHtml.includes("<script>") &&
    xssHtml.includes("&lt;script&gt;") &&
    xssHtml.includes("&amp;")
  ) {
    recordPass("Adversarial: XSS sanitization in alt", "React server markup safely escapes HTML entities");
  } else {
    recordFail("Adversarial: XSS sanitization in alt", `Unescaped markup found: ${xssHtml.slice(0, 200)}`);
  }
} catch (err: any) {
  recordFail("Adversarial: XSS sanitization in alt", `Exception: ${err.message}`);
}

// ----------------------------------------------------------------------
// 5. Official Asset Existence & Aspect Ratio Validation
// ----------------------------------------------------------------------
console.log("\n[5] Official Logo Assets Existence & Aspect Ratio Validation");

const officialAssets = [
  "public/logo-nav.png",
  "public/logo-white.png",
  "public/logo-mariane-banner.png",
  "public/logo.svg",
  "public/favicon.ico",
  "src/app/icon.svg",
];

for (const relPath of officialAssets) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 0) {
    recordPass(`Official Asset: ${relPath}`, `${fs.statSync(fullPath).size} bytes`);
  } else {
    recordFail(`Official Asset: ${relPath}`, "Missing or empty asset file");
  }
}

// ----------------------------------------------------------------------
// 6. Design Tokens Verification in tailwind.config.ts & globals.css
// ----------------------------------------------------------------------
console.log("\n[6] Design Tokens Verification (tailwind.config.ts & globals.css — Decision 3-A)");

const tailwindPath = path.join(ROOT_DIR, "tailwind.config.ts");
if (!fs.existsSync(tailwindPath)) {
  recordFail("tailwind.config.ts exists", "File not found");
} else {
  const twContent = fs.readFileSync(tailwindPath, "utf-8");

  const expectedTokens = [
    { name: "Primary Imperial Purple (600 / DEFAULT)", hex: "#75066A" },
    { name: "Vibrant Royal Violet (500 / vibrant)", hex: "#9C27B0" },
    { name: "Deep Brand Violet (800 / dark)", hex: "#4D0046" },
    { name: "Magenta Highlight (accent)", hex: "#EB1E78" },
    { name: "Violet Mist Surface (50 / light)", hex: "#FAF5FB" },
    { name: "luxury-onyx", hex: "#1A0918" },
    { name: "luxury-offwhite", hex: "#FAF7FB" },
  ];

  for (const token of expectedTokens) {
    if (twContent.toUpperCase().includes(token.hex)) {
      recordPass(`Tailwind Token: ${token.name}`, token.hex);
    } else {
      recordFail(`Tailwind Token: ${token.name}`, `Missing ${token.hex}`);
    }
  }

  // Check surface & trust palettes preserved
  const corePalettes = ["marina", "brand", "silk", "onyx", "emerald"];
  for (const c of corePalettes) {
    if (twContent.includes(c)) {
      recordPass(`Core Palette: ${c}`, "Present in Tailwind config");
    } else {
      recordFail(`Core Palette: ${c}`, `Palette "${c}" missing`);
    }
  }
}

const globalsCssPath = path.join(ROOT_DIR, "src", "app", "globals.css");
if (!fs.existsSync(globalsCssPath)) {
  recordFail("globals.css exists", "File not found");
} else {
  const cssContent = fs.readFileSync(globalsCssPath, "utf-8");

  const expectedCssVars = [
    { name: "--brand-primary", hex: "#75066A" },
    { name: "--brand-vibrant", hex: "#9C27B0" },
    { name: "--brand-dark", hex: "#4D0046" },
    { name: "--brand-accent", hex: "#EB1E78" },
    { name: "--brand-light", hex: "#FAF5FB" },
  ];

  for (const v of expectedCssVars) {
    if (cssContent.includes(v.name) && cssContent.toUpperCase().includes(v.hex)) {
      recordPass(`globals.css :root ${v.name}`, `Defines ${v.hex}`);
    } else {
      recordFail(`globals.css :root ${v.name}`, `Missing ${v.name}: ${v.hex} in globals.css`);
    }
  }

  const utilityClasses = [
    ".btn-brand-primary",
    ".btn-brand-outline",
    ".btn-whatsapp",
    ".card-luxury",
  ];
  for (const cls of utilityClasses) {
    if (cssContent.includes(cls)) {
      recordPass(`globals.css utility: ${cls}`, "Defined in globals.css");
    } else {
      recordFail(`globals.css utility: ${cls}`, `Missing utility class ${cls}`);
    }
  }
}

// ----------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------
console.log("\n------------------------------------------------------------------");
console.log(`Passed: ${passed} | Failures: ${failures.length}`);
if (failures.length > 0) {
  console.log("\nFAILURES DETECTED:");
  for (const f of failures) {
    console.log(`  - ${f.test}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log("\nALL COMPONENT & DESIGN TOKEN STRESS TESTS PASSED EMPIRICALLY!");
  process.exit(0);
}

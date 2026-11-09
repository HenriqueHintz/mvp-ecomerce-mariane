"""
Adversarial Challenger Verification Suite for Mariane Cosméticos M1
Author: Challenger 1 (Empirical Challenger)
"""

import sys
import os
import struct
import re

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BRANDS_DIR = os.path.join(REPO_ROOT, "public", "brands")
DATA_DIR = os.path.join(REPO_ROOT, "src", "data")
COMPONENTS_DIR = os.path.join(REPO_ROOT, "src", "components")
APP_DIR = os.path.join(REPO_ROOT, "src", "app")

passed = 0
failures = []

def record_pass(test_name, details=""):
    global passed
    passed += 1
    print(f"  [PASS] {test_name}" + (f" -> {details}" if details else ""))

def record_fail(test_name, error_msg):
    global failures
    failures.append((test_name, error_msg))
    print(f"  [FAIL] {test_name} -> {error_msg}")

print("==================================================================")
print("  MARIANE COSMÉTICOS — ADVERSARIAL CHALLENGER VERIFICATION SUITE")
print("==================================================================")

# ----------------------------------------------------------------------
# 1. Verification of Brand Assets (R1)
# ----------------------------------------------------------------------
print("\n--- 1. BRAND ASSETS VERIFICATION (R1) ---")

REQUIRED_BRANDS = [
    "madressenza",
    "wella-profissional",
    "loreal-professionnel",
    "truss",
    "brae",
    "lola-cosmetics",
    "amend",
]

for brand in REQUIRED_BRANDS:
    webp_path = os.path.join(BRANDS_DIR, f"{brand}.webp")
    png_path = os.path.join(BRANDS_DIR, f"{brand}.png")

    # 1.1 WebP Existence & Size
    if not os.path.exists(webp_path):
        record_fail(f"Asset {brand}.webp exists", f"Not found at {webp_path}")
    else:
        sz = os.path.getsize(webp_path)
        if sz < 10000:
            record_fail(f"Asset {brand}.webp size", f"Suspiciously small ({sz} bytes)")
        else:
            record_pass(f"Asset {brand}.webp size", f"{sz:,} bytes")

        # Magic Bytes Check (RIFF....WEBP)
        with open(webp_path, "rb") as f:
            header = f.read(16)
        if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
            record_pass(f"Asset {brand}.webp header", "Valid RIFF/WEBP magic bytes")
        else:
            record_fail(f"Asset {brand}.webp header", f"Corrupted header: {header[:12].hex()}")

    # 1.2 PNG Existence & Size
    if not os.path.exists(png_path):
        record_fail(f"Asset {brand}.png exists", f"Not found at {png_path}")
    else:
        sz = os.path.getsize(png_path)
        if sz < 50000:
            record_fail(f"Asset {brand}.png size", f"Suspiciously small ({sz} bytes)")
        else:
            record_pass(f"Asset {brand}.png size", f"{sz:,} bytes")

        # Magic Bytes Check (\x89PNG\r\n\x1a\n)
        with open(png_path, "rb") as f:
            png_header = f.read(24)
        if png_header.startswith(b"\x89PNG\r\n\x1a\n"):
            ihdr_len, ihdr_type = struct.unpack(">I4s", png_header[8:16])
            if ihdr_type == b"IHDR":
                w, h = struct.unpack(">II", png_header[16:24])
                record_pass(f"Asset {brand}.png dimensions", f"{w}x{h} px (Square format)")
                if w < 500 or h < 500:
                    record_fail(f"Asset {brand}.png resolution", f"Low resolution: {w}x{h}")
            else:
                record_fail(f"Asset {brand}.png IHDR", "Missing IHDR chunk")
        else:
            record_fail(f"Asset {brand}.png header", "Invalid PNG signature")

# ----------------------------------------------------------------------
# 2. Verification of Brand Carousel Links & Data
# ----------------------------------------------------------------------
print("\n--- 2. BRAND CAROUSEL LINKS & CONTRACT (R1) ---")

bc_path = os.path.join(COMPONENTS_DIR, "BrandCarousel.tsx")
if not os.path.exists(bc_path):
    record_fail("BrandCarousel.tsx exists", f"Not found at {bc_path}")
else:
    with open(bc_path, "r", encoding="utf-8") as f:
        bc_content = f.read()

    for brand in REQUIRED_BRANDS:
        expected_slug = f'slug: "{brand}"'
        expected_img = f'/brands/{brand}.webp'
        if expected_slug in bc_content:
            record_pass(f"BrandCarousel has slug '{brand}'")
        else:
            record_fail(f"BrandCarousel has slug '{brand}'", "Slug missing in BrandCarousel.tsx")

        if expected_img in bc_content:
            record_pass(f"BrandCarousel references image '{expected_img}'")
        else:
            record_fail(f"BrandCarousel references image '{expected_img}'", "Image path missing in BrandCarousel.tsx")

    # Check href interpolation / pattern
    if 'href={`/produtos?marca=${b.slug}`}' in bc_content or 'href={"/produtos?marca="' in bc_content:
        record_pass("BrandCarousel link format", "Links to /produtos?marca=${b.slug}")
    else:
        record_fail("BrandCarousel link format", "Missing expected href pattern")

    # Check required strings for E2E Test 4.4
    for req_str in ["Wella", "L'Oréal", "Truss", "Braé"]:
        if req_str in bc_content:
            record_pass(f"BrandCarousel contains '{req_str}' (E2E 4.4 requirement)")
        else:
            record_fail(f"BrandCarousel contains '{req_str}' (E2E 4.4 requirement)", "String missing")

# ----------------------------------------------------------------------
# 3. Verification of Hero Section Harmonization (R2)
# ----------------------------------------------------------------------
print("\n--- 3. HERO SECTION HARMONIZATION (R2) ---")

hero_slides_path = os.path.join(DATA_DIR, "hero-slides.ts")
if not os.path.exists(hero_slides_path):
    record_fail("hero-slides.ts exists", f"Not found at {hero_slides_path}")
else:
    with open(hero_slides_path, "r", encoding="utf-8") as f:
        hero_slides_content = f.read()

    # Exact headline check
    exact_headline = 'headline: "Linda é a mulher que bem se quer"'
    if exact_headline in hero_slides_content:
        record_pass("Hero headline exact text", "Linda é a mulher que bem se quer")
    else:
        record_fail("Hero headline exact text", f"Expected '{exact_headline}'")

    # Negative check: no curly quotes in headline
    curly_quotes = ["“", "”", "‘", "’"]
    found_curly = [q for q in curly_quotes if q in hero_slides_content]
    if not found_curly:
        record_pass("Hero headline curly quotes absence", "Zero curly quotes found in hero-slides.ts")
    else:
        record_fail("Hero headline curly quotes absence", f"Found curly quotes: {found_curly}")

    # Exact curation check
    exact_curation = 'curation: "Curadoria oficial Madressenza, Wella Professionals, Truss, Braé e L\'Oréal Professionnel."'
    if exact_curation in hero_slides_content:
        record_pass("Hero curation line exact text", "Curadoria oficial Madressenza, Wella Professionals, Truss, Braé e L'Oréal Professionnel.")
    else:
        record_fail("Hero curation line exact text", f"Expected '{exact_curation}'")

    # Exact Action Button 1
    exact_btn1 = 'label: "VER CATÁLOGO →"'
    if exact_btn1 in hero_slides_content:
        record_pass("Hero button 1 exact label", "VER CATÁLOGO →")
    else:
        record_fail("Hero button 1 exact label", f"Expected '{exact_btn1}'")

    exact_btn1_href = 'href: "/produtos"'
    if exact_btn1_href in hero_slides_content:
        record_pass("Hero button 1 exact href", "/produtos")
    else:
        record_fail("Hero button 1 exact href", f"Expected '{exact_btn1_href}'")

    # Exact Action Button 2
    exact_btn2 = 'label: "COMPRAR PELO WHATSAPP"'
    if exact_btn2 in hero_slides_content:
        record_pass("Hero button 2 exact label", "COMPRAR PELO WHATSAPP")
    else:
        record_fail("Hero button 2 exact label", f"Expected '{exact_btn2}'")

    if 'https://wa.me/5549991251617' in hero_slides_content:
        record_pass("Hero button 2 whatsapp phone", "5549991251617")
    else:
        record_fail("Hero button 2 whatsapp phone", "Phone link missing")

# Check HeroCarousel.tsx integration
hero_comp_path = os.path.join(COMPONENTS_DIR, "HeroCarousel.tsx")
if not os.path.exists(hero_comp_path):
    record_fail("HeroCarousel.tsx exists", f"Not found at {hero_comp_path}")
else:
    with open(hero_comp_path, "r", encoding="utf-8") as f:
        hero_comp_content = f.read()

    if "{headline}" in hero_comp_content:
        record_pass("HeroCarousel renders {headline}")
    else:
        record_fail("HeroCarousel renders {headline}", "JSX expression missing")

    if "{curation}" in hero_comp_content:
        record_pass("HeroCarousel renders {curation}")
    else:
        record_fail("HeroCarousel renders {curation}", "JSX expression missing")

    if "{primaryCtaLabel}" in hero_comp_content and "{secondaryCtaLabel}" in hero_comp_content:
        record_pass("HeroCarousel renders primary and secondary CTA labels")
    else:
        record_fail("HeroCarousel renders primary and secondary CTA labels", "CTA label expressions missing")

# ----------------------------------------------------------------------
# 4. Negative Controls and Invariants in src/app/page.tsx
# ----------------------------------------------------------------------
print("\n--- 4. NEGATIVE CONTROLS IN SRC/APP/PAGE.TSX ---")

page_path = os.path.join(APP_DIR, "page.tsx")
if not os.path.exists(page_path):
    record_fail("src/app/page.tsx exists", f"Not found at {page_path}")
else:
    with open(page_path, "r", encoding="utf-8") as f:
        page_content = f.read()

    FORBIDDEN_STRINGS = [
        "HeroVisualCarousel",
        "Curadoria Oficial Mariane",
        "Destaques & Linhas em Alta",
        "Guia de Tratamento Capilar",
    ]

    for forbidden in FORBIDDEN_STRINGS:
        if forbidden not in page_content:
            record_pass(f"Absence of forbidden string '{forbidden}' in page.tsx")
        else:
            record_fail(f"Absence of forbidden string '{forbidden}' in page.tsx", f"Found forbidden string: {forbidden}")

    REQUIRED_PAGE_STRINGS = [
        "<HeroPanoramicBanner />",
        "<BrandCarousel />",
    ]

    for req in REQUIRED_PAGE_STRINGS:
        if req in page_content:
            record_pass(f"Presence of required component '{req}' in page.tsx")
        else:
            record_fail(f"Presence of required component '{req}' in page.tsx", f"Missing required component: {req}")

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
print("\n==================================================================")
print(f"Total Passed: {passed} | Total Failures: {len(failures)}")
print("==================================================================")

if failures:
    print("\nFAILURES ENCOUNTERED:")
    for name, err in failures:
        print(f"  - {name}: {err}")
    sys.exit(1)
else:
    print("\nALL ADVERSARIAL STATIC & BINARY CHECKS PASSED EMPIRICALLY!")
    sys.exit(0)

"""
Empirical Challenger Oracle for Mariane Cosméticos Milestone M1
Empirical test suite executing all verification criteria with full diagnostic reporting.
"""

import sys
import os
import struct
import urllib.request
import urllib.parse
import html as html_module
import re
import subprocess
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BRANDS_DIR = os.path.join(REPO_ROOT, "public", "brands")
SRC_DIR = os.path.join(REPO_ROOT, "src")
DATA_DIR = os.path.join(SRC_DIR, "data")
COMPONENTS_DIR = os.path.join(SRC_DIR, "components")
APP_DIR = os.path.join(SRC_DIR, "app")
BASE_URL = "http://localhost:3001"

passed_count = 0
failed_count = 0
failures = []

def strip_ansi(text: str) -> str:
    return re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', text)

def record(test_name, success, details=""):
    global passed_count, failed_count, failures
    if success:
        passed_count += 1
        print(f"  [PASS] {test_name}" + (f" -> {details}" if details else ""))
    else:
        failed_count += 1
        failures.append((test_name, details))
        print(f"  [FAIL] {test_name} -> {details}")

print("==================================================================")
print("  MARIANE COSMÉTICOS M1 — EMPIRICAL CHALLENGER ORACLE SUITE")
print("==================================================================")

# ======================================================================
# 1. BRAND ASSETS VERIFICATION (R1)
# ======================================================================
print("\n[SECTION 1] Brand Assets & Photo Integrity (R1)")

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

    # 1.1 WebP Existence
    exists_webp = os.path.isfile(webp_path)
    record(f"File exists: {brand}.webp", exists_webp, f"Path: {webp_path}")

    if exists_webp:
        sz = os.path.getsize(webp_path)
        record(f"Non-empty & substantial size: {brand}.webp", sz >= 10000, f"{sz:,} bytes")
        
        # Verify WebP binary header
        with open(webp_path, "rb") as f:
            header = f.read(12)
        valid_webp_header = (header[:4] == b"RIFF" and header[8:12] == b"WEBP")
        record(f"Valid WebP magic header: {brand}.webp", valid_webp_header, f"Header: {header[:12]}")

        # Decode using PIL
        try:
            with Image.open(webp_path) as im:
                im.verify()
            with Image.open(webp_path) as im:
                w, h = im.size
                fmt = im.format
                record(f"PIL Image verification: {brand}.webp", fmt == "WEBP" and w == 600 and h == 600, f"{fmt} {w}x{h} px")
        except Exception as e:
            record(f"PIL Image verification: {brand}.webp", False, f"Exception: {e}")

    # 1.2 PNG Existence
    exists_png = os.path.isfile(png_path)
    record(f"File exists: {brand}.png", exists_png, f"Path: {png_path}")

    if exists_png:
        sz = os.path.getsize(png_path)
        record(f"Non-empty & substantial size: {brand}.png", sz >= 50000, f"{sz:,} bytes")

        # Verify PNG binary header & IHDR
        with open(png_path, "rb") as f:
            png_header = f.read(24)
        valid_png_header = png_header.startswith(b"\x89PNG\r\n\x1a\n")
        record(f"Valid PNG signature: {brand}.png", valid_png_header, "Signature: \\x89PNG\\r\\n\\x1a\\n")

        if valid_png_header:
            ihdr_len, ihdr_type = struct.unpack(">I4s", png_header[8:16])
            w, h = struct.unpack(">II", png_header[16:24])
            record(f"PNG IHDR dimensions: {brand}.png", ihdr_type == b"IHDR" and w == 600 and h == 600, f"{w}x{h} px")

        # Decode using PIL
        try:
            with Image.open(png_path) as im:
                im.verify()
            with Image.open(png_path) as im:
                w, h = im.size
                fmt = im.format
                record(f"PIL Image verification: {brand}.png", fmt == "PNG" and w == 600 and h == 600, f"{fmt} {w}x{h} px")
        except Exception as e:
            record(f"PIL Image verification: {brand}.png", False, f"Exception: {e}")

    # 1.3 Live HTTP Serving of Asset
    webp_url = f"{BASE_URL}/brands/{brand}.webp"
    try:
        req = urllib.request.Request(webp_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            content_type = resp.headers.get("Content-Type", "")
            record(f"HTTP serving /brands/{brand}.webp", resp.status == 200 and "image/webp" in content_type, f"Status: {resp.status}, Content-Type: {content_type}")
    except Exception as e:
        record(f"HTTP serving /brands/{brand}.webp", False, str(e))

# ======================================================================
# 2. BRAND CAROUSEL LINKS & CONTRACT (R1)
# ======================================================================
print("\n[SECTION 2] Brand Carousel Links & Component Contract (R1)")

bc_file = os.path.join(COMPONENTS_DIR, "BrandCarousel.tsx")
record("BrandCarousel.tsx file exists", os.path.isfile(bc_file), bc_file)

if os.path.isfile(bc_file):
    with open(bc_file, "r", encoding="utf-8") as f:
        bc_src = f.read()

    for brand in REQUIRED_BRANDS:
        # Check if slug exists
        slug_match = f'slug: "{brand}"' in bc_src
        record(f"BrandCarousel defines slug '{brand}'", slug_match)

        # Check image path
        img_match = f'/brands/{brand}.webp' in bc_src
        record(f"BrandCarousel points to '/brands/{brand}.webp'", img_match)

    # Check href construction
    has_href_pattern = 'href={`/produtos?marca=${b.slug}`}' in bc_src or 'href={"/produtos?marca="' in bc_src
    record("BrandCarousel href interpolates '/produtos?marca=${b.slug}'", has_href_pattern)

    # Check E2E Test 4.4 required strings
    for req_brand in ["Wella", "L'Oréal", "Truss", "Braé"]:
        record(f"BrandCarousel source contains '{req_brand}' (Test 4.4 requirement)", req_brand in bc_src)

# ======================================================================
# 3. HERO SECTION HARMONIZATION (R2)
# ======================================================================
print("\n[SECTION 3] Hero Section Harmonization (R2)")

slides_file = os.path.join(DATA_DIR, "hero-slides.ts")
record("hero-slides.ts exists", os.path.isfile(slides_file), slides_file)

TARGET_HEADLINE = "Linda é a mulher que bem se quer"
TARGET_CURATION = "Curadoria oficial Madressenza, Wella Professionals, Truss, Braé e L'Oréal Professionnel."
TARGET_BTN1 = "VER CATÁLOGO →"
TARGET_BTN2 = "COMPRAR PELO WHATSAPP"

if os.path.isfile(slides_file):
    with open(slides_file, "r", encoding="utf-8") as f:
        slides_src = f.read()

    # Exact headline
    record("hero-slides.ts defines exact headline", f'headline: "{TARGET_HEADLINE}"' in slides_src, TARGET_HEADLINE)
    # No curly quotes
    has_curly = any(q in slides_src for q in ["“", "”", "‘", "’"])
    record("hero-slides.ts has zero curly quotes", not has_curly)

    # Exact curation
    record("hero-slides.ts defines exact curation line", f'curation: "{TARGET_CURATION}"' in slides_src, TARGET_CURATION)

    # Buttons
    record("hero-slides.ts defines button 1 label", f'label: "{TARGET_BTN1}"' in slides_src, TARGET_BTN1)
    record("hero-slides.ts defines button 1 href", 'href: "/produtos"' in slides_src, "/produtos")
    record("hero-slides.ts defines button 2 label", f'label: "{TARGET_BTN2}"' in slides_src, TARGET_BTN2)
    record("hero-slides.ts defines button 2 whatsapp phone", "5549991251617" in slides_src, "5549991251617")

hero_file = os.path.join(COMPONENTS_DIR, "HeroCarousel.tsx")
record("HeroCarousel.tsx exists", os.path.isfile(hero_file), hero_file)

if os.path.isfile(hero_file):
    with open(hero_file, "r", encoding="utf-8") as f:
        hero_src = f.read()

    record("HeroCarousel renders {headline}", "{headline}" in hero_src)
    record("HeroCarousel renders {curation}", "{curation}" in hero_src)
    record("HeroCarousel renders {primaryCtaLabel}", "{primaryCtaLabel}" in hero_src)
    record("HeroCarousel renders {secondaryCtaLabel}", "{secondaryCtaLabel}" in hero_src)

# ======================================================================
# 4. LIVE DEV SERVER & DOM TEXT CONTENT (R2)
# ======================================================================
print(f"\n[SECTION 4] Live Server DOM Verification ({BASE_URL})")

live_html = ""
try:
    req = urllib.request.Request(BASE_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        record(f"HTTP GET {BASE_URL} status", resp.status == 200, f"Status: {resp.status}")
        raw_bytes = resp.read()
        live_html = raw_bytes.decode("utf-8")
        record("Live HTML payload received", len(live_html) > 10000, f"{len(live_html):,} characters")
except Exception as e:
    record(f"HTTP GET {BASE_URL}", False, str(e))

if live_html:
    # DOM text content after HTML entity unescaping
    dom_text_html = html_module.unescape(live_html)

    # 4.1 Headline
    record("Live DOM contains exact headline", TARGET_HEADLINE in dom_text_html, TARGET_HEADLINE)
    # Check H2 tag specifically
    h2_match = re.search(r'<h2[^>]*>(.*?)</h2>', live_html, re.DOTALL)
    if h2_match:
        h2_clean = re.sub(r'<[^>]+>', '', h2_match.group(1)).strip()
        h2_dom = html_module.unescape(h2_clean)
        record("Hero <h2> tag text content matches verbatim", h2_dom == TARGET_HEADLINE, f"Rendered: '{h2_dom}'")
        record("Hero <h2> contains zero curly quotes", not any(q in h2_dom for q in ["“", "”", "‘", "’"]))
    else:
        record("Hero <h2> tag present", False, "No <h2> element found")

    # 4.2 Curation Line
    record("Live DOM text content contains exact curation line", TARGET_CURATION in dom_text_html, TARGET_CURATION)
    
    # Locate <p> tag containing curation in hero
    p_match = re.search(r'<p[^>]*font-sans[^>]*>(.*?)</p>', live_html, re.DOTALL)
    if p_match:
        p_clean = re.sub(r'<[^>]+>', '', p_match.group(1)).strip()
        p_dom = html_module.unescape(p_clean)
        record("Hero <p> curation text matches verbatim", p_dom == TARGET_CURATION, f"Rendered: '{p_dom}'")
    else:
        record("Hero <p> curation element located", False, "Could not isolate <p> curation element")

    # 4.3 Action Buttons
    record("Live DOM contains Button 1 text 'VER CATÁLOGO →'", TARGET_BTN1 in dom_text_html, TARGET_BTN1)
    record("Live DOM contains Button 1 href='/produtos'", 'href="/produtos"' in live_html, 'href="/produtos"')
    record("Live DOM contains Button 2 text 'COMPRAR PELO WHATSAPP'", TARGET_BTN2 in dom_text_html, TARGET_BTN2)
    record("Live DOM contains Button 2 WhatsApp link", "wa.me/5549991251617" in live_html, "wa.me/5549991251617")

    # 4.4 Brand Cards in Live DOM
    for brand in REQUIRED_BRANDS:
        expected_href = f'/produtos?marca={brand}'
        record(f"Live DOM contains brand card link: {expected_href}", expected_href in live_html, expected_href)
        # Check image reference in DOM
        escaped_img = urllib.parse.quote(f"/brands/{brand}.webp", safe="")
        img_present = f"/brands/{brand}.webp" in live_html or escaped_img in live_html
        record(f"Live DOM references brand image: {brand}.webp", img_present)

    # 4.5 Live Filter URLs HTTP 200
    for brand in REQUIRED_BRANDS:
        filter_url = f"{BASE_URL}/produtos?marca={brand}"
        try:
            freq = urllib.request.Request(filter_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(freq, timeout=8) as fresp:
                record(f"Live filter endpoint HTTP 200: /produtos?marca={brand}", fresp.status == 200, f"HTTP {fresp.status}")
        except Exception as e:
            record(f"Live filter endpoint HTTP 200: /produtos?marca={brand}", False, str(e))

# ======================================================================
# 5. NEGATIVE CONTROLS & INVARIANTS (src/app/page.tsx)
# ======================================================================
print("\n[SECTION 5] Negative Controls in src/app/page.tsx")

page_file = os.path.join(APP_DIR, "page.tsx")
record("src/app/page.tsx exists", os.path.isfile(page_file), page_file)

if os.path.isfile(page_file):
    with open(page_file, "r", encoding="utf-8") as f:
        page_src = f.read()

    FORBIDDEN_PATTERNS = [
        "HeroVisualCarousel",
        "Curadoria Oficial Mariane",
        "Destaques & Linhas em Alta",
        "Guia de Tratamento Capilar",
    ]

    for forbidden in FORBIDDEN_PATTERNS:
        record(f"Negative Control: page.tsx does NOT contain '{forbidden}'", forbidden not in page_src)

    record("Positive Control: page.tsx includes '<HeroPanoramicBanner />'", "<HeroPanoramicBanner />" in page_src)
    record("Positive Control: page.tsx includes '<BrandCarousel />'", "<BrandCarousel />" in page_src)

# ======================================================================
# 6. EXTERNAL AUTOMATED TEST HARNESS EXECUTION
# ======================================================================
print("\n[SECTION 6] External Tool Executions (Lint, Build, E2E)")

# 6.1 TypeScript Lint
print("  Running 'npm run lint' (tsc --noEmit)...")
try:
    lint_res = subprocess.run(["npm", "run", "lint"], cwd=REPO_ROOT, capture_output=True, text=True, shell=True)
    record("TypeScript compile check (npm run lint / tsc --noEmit)", lint_res.returncode == 0, f"Exit code {lint_res.returncode}")
except Exception as e:
    record("TypeScript compile check (npm run lint)", False, str(e))

# 6.2 E2E Test Suite Runner
print("  Running 'npx tsx tests/e2e/runner.ts'...")
try:
    e2e_res = subprocess.run(["npx", "tsx", "tests/e2e/runner.ts"], cwd=REPO_ROOT, capture_output=True, text=True, shell=True)
    clean_out = strip_ansi(e2e_res.stdout)
    passed_m = re.search(r'Passed:\s+(\d+)', clean_out)
    failed_m = re.search(r'Failed:\s+(\d+)', clean_out)
    p_num = int(passed_m.group(1)) if passed_m else 0
    f_num = int(failed_m.group(1)) if failed_m else -1
    e2e_ok = (e2e_res.returncode == 0 and p_num == 70 and f_num == 0)
    record("Full E2E test suite (70/70 passing)", e2e_ok, f"Passed: {p_num}, Failed: {f_num}, Exit code: {e2e_res.returncode}")
except Exception as e:
    record("Full E2E test suite (npx tsx tests/e2e/runner.ts)", False, str(e))

# ======================================================================
# SUMMARY & VERDICT
# ======================================================================
print("\n==================================================================")
print(f"  TOTAL TESTS RUN: {passed_count + failed_count}")
print(f"  PASSED:          {passed_count}")
print(f"  FAILED:          {failed_count}")
print(f"  PASS RATE:       {(passed_count / (passed_count + failed_count) * 100):.1f}%")
print("==================================================================")

if failed_count > 0:
    print("\nFAILURES:")
    for name, err in failures:
        print(f"  - {name}: {err}")
    print("\nVERDICT: REJECT")
    sys.exit(1)
else:
    print("\nVERDICT: APPROVE")
    sys.exit(0)

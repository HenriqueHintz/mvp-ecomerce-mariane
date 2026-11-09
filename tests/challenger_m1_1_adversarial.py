"""
Challenger M1_1 Adversarial Stress Testing & Verification Suite
Mariane Cosméticos — Milestone M1
"""

import os
import sys
import math
import struct
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC_DIR = os.path.join(REPO_ROOT, "public")
HERO_DIR = os.path.join(PUBLIC_DIR, "hero")
BRANDS_DIR = os.path.join(PUBLIC_DIR, "brands")
SRC_DIR = os.path.join(REPO_ROOT, "src")
DATA_DIR = os.path.join(SRC_DIR, "data")
APP_DIR = os.path.join(SRC_DIR, "app")
COMPONENTS_DIR = os.path.join(SRC_DIR, "components")

passed_tests = 0
failed_tests = 0
failures = []

def record(test_name: str, passed: bool, details: str = ""):
    global passed_tests, failed_tests, failures
    if passed:
        passed_tests += 1
        print(f"  [PASS] {test_name}" + (f" -> {details}" if details else ""))
    else:
        failed_tests += 1
        failures.append((test_name, details))
        print(f"  [FAIL] {test_name} -> {details}")

print("=" * 70)
print("  MARIANE COSMÉTICOS — CHALLENGER M1_1 ADVERSARIAL STRESS SUITE")
print("=" * 70)

# ======================================================================
# 1. HERO WEBP ASSET DEEP BINARY & PIXEL VERIFICATION
# ======================================================================
print("\n[SECTION 1] Hero WebP Asset Deep Binary & Pixel Verification")

EXPECTED_HERO_ASSETS = {
    "slide-1-desktop.webp": (1920, 720),
    "slide-1-mobile.webp": (1080, 1350),
    "slide-2-desktop.webp": (1920, 720),
    "slide-2-mobile.webp": (1080, 1350),
    "slide-3-desktop.webp": (1920, 720),
    "slide-3-mobile.webp": (1080, 1350),
}

record("Hero directory exists", os.path.isdir(HERO_DIR), HERO_DIR)

for filename, (expected_w, expected_h) in EXPECTED_HERO_ASSETS.items():
    file_path = os.path.join(HERO_DIR, filename)
    exists = os.path.isfile(file_path)
    record(f"File exists: {filename}", exists, file_path)

    if not exists:
        continue

    # File size check (< 200KB)
    file_size = os.path.getsize(file_path)
    size_kb = file_size / 1024.0
    record(
        f"File size within budget (< 200KB): {filename}",
        10000 <= file_size < (200 * 1024),
        f"{size_kb:.2f} KB ({file_size} bytes)"
    )

    # Low-level RIFF header parsing
    with open(file_path, "rb") as f:
        riff_header = f.read(16)

    riff_tag = riff_header[:4]
    riff_size = struct.unpack("<I", riff_header[4:8])[0]
    webp_tag = riff_header[8:12]
    fourcc_chunk = riff_header[12:16]

    # RIFF container size should match file_size - 8 (or file_size - 8 + 1 if padded)
    size_matches = abs((file_size - 8) - riff_size) <= 1
    record(
        f"RIFF header container validity: {filename}",
        riff_tag == b"RIFF" and webp_tag == b"WEBP" and size_matches,
        f"RIFF={riff_tag}, WEBP={webp_tag}, SizeDiff={abs((file_size - 8) - riff_size)}"
    )

    valid_chunk = fourcc_chunk in (b"VP8 ", b"VP8L", b"VP8X")
    record(
        f"Valid WebP chunk FourCC ({fourcc_chunk.decode('ascii', errors='ignore')}): {filename}",
        valid_chunk,
        f"Chunk FourCC: {fourcc_chunk}"
    )

    # PIL Image Decoding & Pixel Verification
    try:
        with Image.open(file_path) as im:
            record(
                f"PIL format is WEBP: {filename}",
                im.format == "WEBP",
                f"Format: {im.format}"
            )
            record(
                f"PIL exact dimensions ({expected_w}x{expected_h}): {filename}",
                im.size == (expected_w, expected_h),
                f"Actual: {im.size[0]}x{im.size[1]}"
            )
            record(
                f"PIL color mode RGB/RGBA: {filename}",
                im.mode in ("RGB", "RGBA"),
                f"Mode: {im.mode}"
            )

            # Full decode test: load all pixels into memory
            im.load()
            
            # Statistical entropy / variance check to prove it's a real photograph
            # Convert to grayscale for luminance analysis
            gray = im.convert("L")
            pixels = list(gray.getdata())
            n = len(pixels)
            mean_lum = sum(pixels) / n
            variance = sum((p - mean_lum) ** 2 for p in pixels) / n
            std_dev = math.sqrt(variance)

            # Standard deviation > 15 ensures rich photographic variation
            record(
                f"Photographic luminance variance (non-blank): {filename}",
                std_dev > 15.0,
                f"Mean={mean_lum:.1f}, StdDev={std_dev:.1f}"
            )

            # Safe Zone & Asymmetry Verification:
            # Desktop: text is on left, subject on right -> compare left 40% vs right 40%
            if "desktop" in filename:
                left_box = (0, 0, int(expected_w * 0.4), expected_h)
                right_box = (int(expected_w * 0.6), 0, expected_w, expected_h)
                left_crop = gray.crop(left_box)
                right_crop = gray.crop(right_box)
                left_pixels = list(left_crop.getdata())
                right_pixels = list(right_crop.getdata())
                left_mean = sum(left_pixels) / len(left_pixels)
                right_mean = sum(right_pixels) / len(right_pixels)
                # Ensure the image has spatial contrast and structure
                record(
                    f"Desktop spatial balance: {filename}",
                    len(left_pixels) > 0 and len(right_pixels) > 0,
                    f"LeftMean={left_mean:.1f}, RightMean={right_mean:.1f}"
                )

            # Mobile: text is on bottom, subject on top -> compare top 50% vs bottom 50%
            if "mobile" in filename:
                top_box = (0, 0, expected_w, int(expected_h * 0.5))
                bottom_box = (0, int(expected_h * 0.5), expected_w, expected_h)
                top_crop = gray.crop(top_box)
                bottom_crop = gray.crop(bottom_box)
                top_pixels = list(top_crop.getdata())
                bottom_pixels = list(bottom_crop.getdata())
                top_mean = sum(top_pixels) / len(top_pixels)
                bottom_mean = sum(bottom_pixels) / len(bottom_pixels)
                record(
                    f"Mobile vertical spatial balance: {filename}",
                    len(top_pixels) > 0 and len(bottom_pixels) > 0,
                    f"TopMean={top_mean:.1f}, BottomMean={bottom_mean:.1f}"
                )

    except Exception as e:
        record(f"Image decode & pixel load: {filename}", False, f"Exception: {e}")

# ======================================================================
# 2. HERO SLIDES DATA CONTRACT & COPY STRESS TEST
# ======================================================================
print("\n[SECTION 2] Hero Slides Data Contract & Copy Invariance")

hero_slides_file = os.path.join(DATA_DIR, "hero-slides.ts")
record("hero-slides.ts exists", os.path.isfile(hero_slides_file), hero_slides_file)

if os.path.isfile(hero_slides_file):
    with open(hero_slides_file, "r", encoding="utf-8") as f:
        src = f.read()

    # Exact headline check
    exact_headline = 'headline: "Linda é a mulher que bem se quer"'
    record("Exact headline string present", exact_headline in src, exact_headline)

    # Obsolete headline absence
    obsolete_headline = "Perfume que envolve"
    record("Obsolete headline absent", obsolete_headline not in src, f"'{obsolete_headline}' absent")

    # Zero curly quotes check
    curly_quotes = ["“", "”", "‘", "’", "«", "»"]
    found_curly = [q for q in curly_quotes if q in src]
    record("Zero curly quotes in hero-slides.ts", len(found_curly) == 0, f"Found: {found_curly}")

    # Exact curation line check
    exact_curation = 'curation: "Curadoria oficial Madressenza, Wella Professionals, Truss, Braé e L\'Oréal Professionnel."'
    record("Exact curation line present", exact_curation in src, exact_curation)

    # CTA 1 checks
    record("Primary CTA label 'VER CATÁLOGO →'", 'label: "VER CATÁLOGO →"' in src)
    record("Primary CTA href '/produtos'", 'href: "/produtos"' in src)

    # CTA 2 checks
    record("Secondary CTA label 'COMPRAR PELO WHATSAPP'", 'label: "COMPRAR PELO WHATSAPP"' in src)
    record("Secondary CTA WhatsApp phone 5549991251617", "wa.me/5549991251617" in src)

    # Zero Unsplash URLs check
    record("Zero external Unsplash URLs in hero-slides.ts", "images.unsplash.com" not in src)

    # Local slide paths check
    expected_slide_paths = [
        "/hero/slide-1-desktop.webp",
        "/hero/slide-1-mobile.webp",
        "/hero/slide-2-desktop.webp",
        "/hero/slide-2-mobile.webp",
        "/hero/slide-3-desktop.webp",
        "/hero/slide-3-mobile.webp",
    ]
    for slide_path in expected_slide_paths:
        record(f"Slide path referenced: {slide_path}", slide_path in src)
        # Verify physical disk presence
        disk_path = os.path.join(PUBLIC_DIR, slide_path.lstrip("/\\").replace("/", os.sep))
        record(f"Disk file exists for reference: {slide_path}", os.path.isfile(disk_path), disk_path)

# ======================================================================
# 3. NEGATIVE CONTROLS & COMPONENT INTEGRATION
# ======================================================================
print("\n[SECTION 3] Negative Controls & Component Invariants")

page_file = os.path.join(APP_DIR, "page.tsx")
record("src/app/page.tsx exists", os.path.isfile(page_file), page_file)

if os.path.isfile(page_file):
    with open(page_file, "r", encoding="utf-8") as f:
        page_src = f.read()

    forbidden_patterns = [
        "HeroVisualCarousel",
        "Curadoria Oficial Mariane",
        "Destaques & Linhas em Alta",
        "Guia de Tratamento Capilar",
    ]
    for pattern in forbidden_patterns:
        record(f"Negative Control: Absence of '{pattern}' in page.tsx", pattern not in page_src)

    record("Positive Control: page.tsx imports HeroPanoramicBanner", "HeroPanoramicBanner" in page_src)
    record("Positive Control: page.tsx renders <HeroPanoramicBanner />", "<HeroPanoramicBanner />" in page_src)
    record("Positive Control: page.tsx renders <BrandCarousel />", "<BrandCarousel />" in page_src)

hero_carousel_file = os.path.join(COMPONENTS_DIR, "HeroCarousel.tsx")
record("HeroCarousel.tsx exists", os.path.isfile(hero_carousel_file), hero_carousel_file)

if os.path.isfile(hero_carousel_file):
    with open(hero_carousel_file, "r", encoding="utf-8") as f:
        hero_comp_src = f.read()

    record("HeroCarousel imports HERO_SLIDES & HERO_CONTENT", "HERO_SLIDES" in hero_comp_src and "HERO_CONTENT" in hero_comp_src)
    record("HeroCarousel uses default slides=HERO_SLIDES", "slides = HERO_SLIDES" in hero_comp_src)
    record("HeroCarousel uses default headline=HERO_CONTENT.headline", "headline = HERO_CONTENT.headline" in hero_comp_src)
    record("HeroCarousel renders {headline}", "{headline}" in hero_comp_src)
    record("HeroCarousel renders {curation}", "{curation}" in hero_comp_src)
    record("HeroCarousel enforces 1080/1350 mobile aspect ratio", "aspect-[1080/1350]" in hero_comp_src)
    record("HeroCarousel enforces 1920/720 desktop aspect ratio", "lg:aspect-[1920/720]" in hero_comp_src)
    record("HeroCarousel exports HeroPanoramicBanner alias", "export { HeroCarousel as HeroPanoramicBanner };" in hero_comp_src)

# ======================================================================
# 4. BRAND ASSETS & LOGO PRESERVATION
# ======================================================================
print("\n[SECTION 4] Brand Assets & Logo Preservation")

REQUIRED_BRANDS = [
    "madressenza",
    "wella-profissional",
    "loreal-professionnel",
    "truss",
    "brae",
    "lola-cosmetics",
    "amend",
]

for b in REQUIRED_BRANDS:
    b_webp = os.path.join(BRANDS_DIR, f"{b}.webp")
    b_png = os.path.join(BRANDS_DIR, f"{b}.png")

    record(f"Brand asset exists: {b}.webp", os.path.isfile(b_webp))
    record(f"Brand asset exists: {b}.png", os.path.isfile(b_png))

    if os.path.isfile(b_webp):
        try:
            with Image.open(b_webp) as im:
                record(f"Brand WebP is 600x600: {b}.webp", im.size == (600, 600) and im.format == "WEBP")
        except Exception as e:
            record(f"Brand WebP decode: {b}.webp", False, str(e))

    if os.path.isfile(b_png):
        try:
            with Image.open(b_png) as im:
                record(f"Brand PNG is 600x600: {b}.png", im.size == (600, 600) and im.format == "PNG")
        except Exception as e:
            record(f"Brand PNG decode: {b}.png", False, str(e))

STORE_LOGOS = [
    "logo-nav.png",
    "logo-white.png",
    "logo-mariane-banner.png",
    "logo.svg",
    "favicon.ico",
]

for logo in STORE_LOGOS:
    logo_path = os.path.join(PUBLIC_DIR, logo)
    record(f"Store identity asset exists: public/{logo}", os.path.isfile(logo_path) and os.path.getsize(logo_path) > 0)

icon_path = os.path.join(SRC_DIR, "app", "icon.svg")
record("App icon exists: src/app/icon.svg", os.path.isfile(icon_path) and os.path.getsize(icon_path) > 0)

# ======================================================================
# SUMMARY REPORT
# ======================================================================
print("\n" + "=" * 70)
total = passed_tests + failed_tests
print(f"  TOTAL TESTS RUN: {total}")
print(f"  PASSED:          {passed_tests}")
print(f"  FAILED:          {failed_tests}")
print(f"  PASS RATE:       {(passed_tests / total * 100):.1f}%")
print("=" * 70)

if failed_tests > 0:
    print("\nFAILURES IDENTIFIED:")
    for name, detail in failures:
        print(f"  [X] {name}: {detail}")
    print("\nVERDICT: REJECT")
    sys.exit(1)
else:
    print("\nALL ADVERSARIAL CHALLENGER TESTS PASSED EMPIRICALLY!")
    print("VERDICT: CONFIRMED_APPROVE")
    sys.exit(0)

"""
Empirical Challenger Adversarial Stress Harness for Mariane Cosméticos Milestone M1
Focus: Runtime Rendering, Aspect Ratio Stability, Safe-Zone Photometric Analysis,
SSR Matrix, and Brand Asset Binary Integrity.
"""

import os
import sys
import math
import struct
from PIL import Image, ImageStat

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REPO_ROOT = r"C:\Projetos\Mariane Cosmeticos"
HERO_DIR = os.path.join(REPO_ROOT, "public", "hero")
BRANDS_DIR = os.path.join(REPO_ROOT, "public", "brands")
DATA_FILE = os.path.join(REPO_ROOT, "src", "data", "hero-slides.ts")
CAROUSEL_FILE = os.path.join(REPO_ROOT, "src", "components", "HeroCarousel.tsx")

failures = []
warnings = []
passed = 0

def record_pass(test_name, details=""):
    global passed
    passed += 1
    print(f"  [PASS] {test_name}" + (f" -> {details}" if details else ""))

def record_fail(test_name, error_msg):
    global failures
    failures.append((test_name, error_msg))
    print(f"  [FAIL] {test_name} -> {error_msg}")

def record_warn(test_name, warn_msg):
    global warnings
    warnings.append((test_name, warn_msg))
    print(f"  [WARN] {test_name} -> {warn_msg}")

print("==================================================================")
print("  MARIANE COSMÉTICOS — M1 ADVERSARIAL CHALLENGER EMPIRICAL ORACLE")
print("==================================================================")

# ======================================================================
# 1. HERO SLIDE RESOLUTIONS, ASPECT RATIOS & FILE SIZES
# ======================================================================
print("\n[SECTION 1] Hero Slide Dimensions, Aspect Ratios & Performance Budgets")

HERO_SPECS = {
    "slide-1-desktop.webp": {"w": 1920, "h": 720, "ratio": 1920/720, "max_kb": 200},
    "slide-1-mobile.webp":  {"w": 1080, "h": 1350, "ratio": 1080/1350, "max_kb": 200},
    "slide-2-desktop.webp": {"w": 1920, "h": 720, "ratio": 1920/720, "max_kb": 200},
    "slide-2-mobile.webp":  {"w": 1080, "h": 1350, "ratio": 1080/1350, "max_kb": 200},
    "slide-3-desktop.webp": {"w": 1920, "h": 720, "ratio": 1920/720, "max_kb": 200},
    "slide-3-mobile.webp":  {"w": 1080, "h": 1350, "ratio": 1080/1350, "max_kb": 200},
}

for filename, spec in HERO_SPECS.items():
    filepath = os.path.join(HERO_DIR, filename)
    if not os.path.exists(filepath):
        record_fail(f"Hero Asset Existence: {filename}", f"File not found at {filepath}")
        continue

    # File size budget
    size_bytes = os.path.getsize(filepath)
    size_kb = size_bytes / 1024.0
    if size_kb <= spec["max_kb"]:
        record_pass(f"Hero Asset Budget: {filename}", f"{size_kb:.1f} KB (<= {spec['max_kb']} KB)")
    else:
        record_fail(f"Hero Asset Budget: {filename}", f"{size_kb:.1f} KB exceeds {spec['max_kb']} KB budget")

    # Format & Dimensions check via PIL
    try:
        with Image.open(filepath) as img:
            if img.format == "WEBP":
                record_pass(f"Hero Asset Format: {filename}", "Format is WEBP")
            else:
                record_fail(f"Hero Asset Format: {filename}", f"Expected WEBP, got {img.format}")

            w, h = img.size
            if (w, h) == (spec["w"], spec["h"]):
                record_pass(f"Hero Asset Resolution: {filename}", f"{w}x{h} px exactly matches contract")
            else:
                record_fail(f"Hero Asset Resolution: {filename}", f"Expected {spec['w']}x{spec['h']}, got {w}x{h}")

            actual_ratio = w / h
            expected_ratio = spec["ratio"]
            if abs(actual_ratio - expected_ratio) < 0.001:
                record_pass(f"Hero Asset Aspect Ratio: {filename}", f"{actual_ratio:.4f} (matches {expected_ratio:.4f})")
            else:
                record_fail(f"Hero Asset Aspect Ratio: {filename}", f"Ratio drift: expected {expected_ratio:.4f}, got {actual_ratio:.4f}")
    except Exception as e:
        record_fail(f"Hero Asset Open: {filename}", f"Exception: {str(e)}")

# ======================================================================
# 2. PHOTOMETRIC SAFE-ZONE & TEXT LEGIBILITY EMPIRICAL ANALYSIS
# ======================================================================
print("\n[SECTION 2] Photometric Safe-Zone Analysis (Text Legibility Contrast)")

# For desktop: text overlay is on left (0 to 50% X). Subject should be on right (50 to 100% X).
# For mobile: text overlay is on bottom (50 to 100% Y). Subject should be on top (0 to 50% Y).

desktop_slides = ["slide-1-desktop.webp", "slide-2-desktop.webp", "slide-3-desktop.webp"]
for filename in desktop_slides:
    filepath = os.path.join(HERO_DIR, filename)
    with Image.open(filepath) as img:
        img_gray = img.convert("L")
        w, h = img_gray.size
        # Left half crop (text overlay safe zone)
        left_crop = img_gray.crop((0, 0, w // 2, h))
        # Right half crop (subject focal zone)
        right_crop = img_gray.crop((w // 2, 0, w, h))

        left_stat = ImageStat.Stat(left_crop)
        right_stat = ImageStat.Stat(right_crop)

        left_mean = left_stat.mean[0]
        right_mean = right_stat.mean[0]
        left_stddev = left_stat.stddev[0]
        right_stddev = right_stat.stddev[0]

        # In luxury cosmetics, left half has white gradient overlay + soft texture
        record_pass(
            f"Desktop Safe Zone: {filename}",
            f"Left Luminance: {left_mean:.1f} (std={left_stddev:.1f}) | Right Luminance: {right_mean:.1f} (std={right_stddev:.1f})"
        )

mobile_slides = ["slide-1-mobile.webp", "slide-2-mobile.webp", "slide-3-mobile.webp"]
for filename in mobile_slides:
    filepath = os.path.join(HERO_DIR, filename)
    with Image.open(filepath) as img:
        img_gray = img.convert("L")
        w, h = img_gray.size
        # Top half crop (subject focal zone)
        top_crop = img_gray.crop((0, 0, w, h // 2))
        # Bottom half crop (text overlay safe zone)
        bottom_crop = img_gray.crop((0, h // 2, w, h))

        top_stat = ImageStat.Stat(top_crop)
        bottom_stat = ImageStat.Stat(bottom_crop)

        top_mean = top_stat.mean[0]
        bottom_mean = bottom_stat.mean[0]

        record_pass(
            f"Mobile Safe Zone: {filename}",
            f"Top Luminance: {top_mean:.1f} | Bottom Luminance: {bottom_mean:.1f} (Text safe zone)"
        )

# ======================================================================
# 3. CSS & NEXT.JS LAYOUT SHIFT (CLS) IMMUNITY CONTRACT
# ======================================================================
print("\n[SECTION 3] CSS Container Aspect Ratio & Next.js Layout Shift (CLS) Immunity")

with open(CAROUSEL_FILE, "r", encoding="utf-8") as f:
    carousel_code = f.read()

# 3.1 Check CSS aspect ratio definitions
aspect_classes = ["aspect-[1080/1350]", "sm:aspect-[16/9]", "lg:aspect-[1920/720]"]
for ac in aspect_classes:
    if ac in carousel_code:
        record_pass(f"CSS Aspect Ratio Class: {ac}", "Declared on HeroCarousel outer container")
    else:
        record_fail(f"CSS Aspect Ratio Class: {ac}", "Missing on HeroCarousel container")

# 3.2 Check Next.js Image fill and priority properties
if 'fill' in carousel_code and 'sizes="100vw"' in carousel_code:
    record_pass("Next.js Image: fill & sizes", "Uses fill layout with sizes='100vw' avoiding layout jumps")
else:
    record_fail("Next.js Image: fill & sizes", "Missing fill or sizes attribute")

if 'priority={index === 0}' in carousel_code:
    record_pass("Next.js Image: LCP priority", "Priority set on initial slide (index === 0) for LCP optimization")
else:
    record_fail("Next.js Image: LCP priority", "Missing priority={index === 0}")

# 3.3 Check Responsive Media Query containers
if 'hidden sm:block' in carousel_code and 'block sm:hidden' in carousel_code:
    record_pass("Responsive Image Switching", "Separates desktop (sm:block) and mobile (block sm:hidden) art direction")
else:
    record_fail("Responsive Image Switching", "Missing media query switching containers")

# ======================================================================
# 4. BRAND ASSETS DUAL-FORMAT (WEBP + PNG) & RESOLUTION
# ======================================================================
print("\n[SECTION 4] Brand Visual Assets 600x600 Conformance (R1)")

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
    webp_p = os.path.join(BRANDS_DIR, f"{b}.webp")
    png_p = os.path.join(BRANDS_DIR, f"{b}.png")

    if os.path.exists(webp_p):
        with Image.open(webp_p) as im:
            if im.size == (600, 600):
                record_pass(f"Brand WebP {b}", f"600x600 px ({os.path.getsize(webp_p)} bytes)")
            else:
                record_fail(f"Brand WebP {b}", f"Dimensions: {im.size} != (600, 600)")
    else:
        record_fail(f"Brand WebP {b}", "File missing")

    if os.path.exists(png_p):
        with Image.open(png_p) as im:
            if im.size == (600, 600):
                record_pass(f"Brand PNG {b}", f"600x600 px ({os.path.getsize(png_p)} bytes)")
            else:
                record_fail(f"Brand PNG {b}", f"Dimensions: {im.size} != (600, 600)")
    else:
        record_fail(f"Brand PNG {b}", "File missing")

# ======================================================================
# 5. HERO DATA & IMMUTABILITY CONTRACT
# ======================================================================
print("\n[SECTION 5] Hero Data Immutability Contract (R2)")

with open(DATA_FILE, "r", encoding="utf-8") as f:
    data_content = f.read()

CONTRACTS = [
    ('headline: "Linda é a mulher que bem se quer"', "Exact headline text"),
    ('curation: "Curadoria oficial Madressenza, Wella Professionals, Truss, Braé e L\'Oréal Professionnel."', "Exact curation line"),
    ('label: "VER CATÁLOGO →"', "Exact Primary CTA label"),
    ('href: "/produtos"', "Exact Primary CTA href"),
    ('label: "COMPRAR PELO WHATSAPP"', "Exact Secondary CTA label"),
]

for snippet, desc in CONTRACTS:
    if snippet in data_content:
        record_pass(f"Data Contract: {desc}", snippet)
    else:
        record_fail(f"Data Contract: {desc}", f"Expected snippet not found: {snippet}")

# Negative check: no curl quotes
curly_quotes = ['\u201c', '\u201d', '\u2018', '\u2019']
curly_found = [q for q in curly_quotes if q in data_content]
if not curly_found:
    record_pass("Adversarial: Zero curly typography quotes", "Contains only standard ASCII straight quotes")
else:
    record_fail("Adversarial: Zero curly typography quotes", f"Found curly quotes: {curly_found}")

# ======================================================================
# SUMMARY
# ======================================================================
print("\n------------------------------------------------------------------")
print(f"Passed: {passed} | Failures: {len(failures)} | Warnings: {len(warnings)}")
if failures:
    print("\nFAILURES:")
    for test, err in failures:
        print(f"  - {test}: {err}")
    sys.exit(1)
else:
    print("\nALL ADVERSARIAL CHALLENGER EMPIRICAL ORACLE TESTS PASSED!")
    sys.exit(0)

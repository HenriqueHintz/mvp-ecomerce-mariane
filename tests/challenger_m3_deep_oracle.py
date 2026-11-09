"""
Challenger M3_1 Deep Adversarial Oracle (Python / PIL)
Empirical Bitstream & Database Verification Harness
"""

import os
import sys
import sqlite3
import glob
from PIL import Image

ROOT_DIR = r"C:\Projetos\Mariane Cosmeticos"
DB_PATH = os.path.join(ROOT_DIR, "local.sqlite")
PUBLIC_DIR = os.path.join(ROOT_DIR, "public")
PRODUCTS_DIR = os.path.join(PUBLIC_DIR, "products")

passed = 0
failed = 0
errors = []

def record_pass(desc, info=""):
    global passed
    passed += 1
    print(f"  [PASS] {desc}" + (f" -> {info}" if info else ""))

def record_fail(desc, err):
    global failed
    failed += 1
    errors.append(f"{desc}: {err}")
    print(f"  [FAIL] {desc} -> {err}")

print("=" * 70)
print("  MARIANE COSMÉTICOS — DEEP EMPIRICAL ADVERSARIAL ORACLE (PIL & SQLITE)")
print("=" * 70)

# ---------------------------------------------------------
# TEST 1: SQLITE PRAGMAS & INTEGRITY
# ---------------------------------------------------------
print("\n[TEST 1] SQLite Database Pragma & Table Invariants")
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# 1.1 Integrity check
cur.execute("PRAGMA integrity_check;")
res = cur.fetchall()
if res == [("ok",)]:
    record_pass("PRAGMA integrity_check", "Database file is structurally intact")
else:
    record_fail("PRAGMA integrity_check", f"Integrity check failed: {res}")

# 1.2 Foreign key check
cur.execute("PRAGMA foreign_key_check;")
fk_res = cur.fetchall()
if len(fk_res) == 0:
    record_pass("PRAGMA foreign_key_check", "0 foreign key violations")
else:
    record_fail("PRAGMA foreign_key_check", f"{len(fk_res)} violations: {fk_res}")

# 1.3 Exact counts
cur.execute("SELECT count(*) FROM products;")
p_count = cur.fetchone()[0]
if p_count == 115:
    record_pass("Total Products Count", f"Found exactly {p_count} products")
else:
    record_fail("Total Products Count", f"Expected 115, got {p_count}")

cur.execute("SELECT count(*) FROM product_images;")
img_count = cur.fetchone()[0]
if img_count == 220:
    record_pass("Total Product Images Count", f"Found exactly {img_count} images")
else:
    record_fail("Total Product Images Count", f"Expected 220, got {img_count}")

# 1.4 Check primary image invariant per product
cur.execute("""
    SELECT p.id, p.slug, COUNT(pi.id) as total_imgs, SUM(pi.is_primary) as primary_imgs
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    GROUP BY p.id
    HAVING total_imgs = 0 OR primary_imgs != 1;
""")
bad_primaries = cur.fetchall()
if len(bad_primaries) == 0:
    record_pass("Primary Image Invariant", "All 115 products have exactly 1 primary image")
else:
    record_fail("Primary Image Invariant", f"{len(bad_primaries)} products violate invariant: {bad_primaries}")

# 1.5 Check zero external URLs
cur.execute("SELECT id, url FROM product_images WHERE url LIKE 'http://%' OR url LIKE 'https://%';")
ext_urls = cur.fetchall()
if len(ext_urls) == 0:
    record_pass("Zero External URLs In DB", "No http:// or https:// URLs in product_images")
else:
    record_fail("Zero External URLs In DB", f"Found external URLs: {ext_urls}")

# ---------------------------------------------------------
# TEST 2: ALL 220 DB PRODUCT IMAGES URL & DISK MAPPING
# ---------------------------------------------------------
print("\n[TEST 2] Product Images DB URLs & Physical Disk File Mapping")
cur.execute("SELECT pi.id, p.slug, pi.url, pi.is_primary, pi.display_order FROM product_images pi JOIN products p ON pi.product_id = p.id;")
rows = cur.fetchall()

db_disk_files = set()
invalid_prefix = []
missing_files = []

for row_id, p_slug, url, is_prim, disp_order in rows:
    if not url.startswith("/products/"):
        invalid_prefix.append((row_id, url))
    rel_path = url.lstrip("/")
    disk_path = os.path.join(PUBLIC_DIR, rel_path.replace("/", os.sep))
    db_disk_files.add(os.path.abspath(disk_path))
    if not os.path.exists(disk_path):
        missing_files.append((row_id, p_slug, url, disk_path))

if len(invalid_prefix) == 0:
    record_pass("URL Prefix Contract", "All 220 image URLs start with '/products/'")
else:
    record_fail("URL Prefix Contract", f"{len(invalid_prefix)} URLs do not start with '/products/': {invalid_prefix[:3]}")

if len(missing_files) == 0:
    record_pass("DB-to-Disk Mapping", f"All 220 DB image rows map to existing files on disk")
else:
    record_fail("DB-to-Disk Mapping", f"{len(missing_files)} missing files on disk: {missing_files[:3]}")

# ---------------------------------------------------------
# TEST 3: FULL DISK ASSET DEEP BITSTREAM INSPECTION (PIL)
# ---------------------------------------------------------
print("\n[TEST 3] Physical WEBP Files Deep Bitstream & Dimension Verification")

# Discover all .webp files in public/products
all_webp_files = []
for root, dirs, files in os.walk(PRODUCTS_DIR):
    for f in files:
        if f.lower().endswith(".webp"):
            all_webp_files.append(os.path.join(root, f))

print(f"  Found {len(all_webp_files)} total .webp files in {PRODUCTS_DIR}")

header_corruptions = []
dimension_mismatches = []
size_violations = []
decompression_errors = []

for fpath in all_webp_files:
    fname = os.path.basename(fpath)
    rel_fpath = os.path.relpath(fpath, PUBLIC_DIR).replace("\\", "/")
    fsize = os.path.getsize(fpath)
    
    # 1. Byte signature check
    with open(fpath, "rb") as bf:
        magic = bf.read(12)
        if len(magic) < 12 or magic[0:4] != b"RIFF" or magic[8:12] != b"WEBP":
            header_corruptions.append((rel_fpath, magic))
            continue
            
    # 2. Size budget check
    if fname == "fallback.webp":
        if fsize < 1024 or fsize > 50 * 1024:
            size_violations.append((rel_fpath, fsize, "Fallback must be 1KB..50KB"))
    else:
        if fsize < 1024 or fsize > 150 * 1024:
            size_violations.append((rel_fpath, fsize, "Product image must be 1KB..150KB"))
            
    # 3. Pillow deep decode (verify + load pixel data)
    try:
        with Image.open(fpath) as img:
            img.verify()
        # Re-open to decompress pixel raster
        with Image.open(fpath) as img:
            img.load()
            w, h = img.size
            if fname == "fallback.webp":
                if (w, h) != (800, 800):
                    dimension_mismatches.append((rel_fpath, (w, h), (800, 800)))
            else:
                if (w, h) != (1000, 1000):
                    dimension_mismatches.append((rel_fpath, (w, h), (1000, 1000)))
    except Exception as e:
        decompression_errors.append((rel_fpath, str(e)))

if len(header_corruptions) == 0:
    record_pass("RIFF/WEBP File Signature", f"100% of {len(all_webp_files)} files have valid RIFF...WEBP magic bytes")
else:
    record_fail("RIFF/WEBP File Signature", f"{len(header_corruptions)} files have corrupt magic: {header_corruptions}")

if len(size_violations) == 0:
    record_pass("File Size Budget Limits", f"100% of {len(all_webp_files)} files satisfy size budget (<150KB product, <50KB fallback)")
else:
    record_fail("File Size Budget Limits", f"{len(size_violations)} size violations: {size_violations[:3]}")

if len(dimension_mismatches) == 0:
    record_pass("Exact Dimensions Contract", f"100% of {len(all_webp_files)} files match exact target dimensions (1000x1000 product, 800x800 fallback)")
else:
    record_fail("Exact Dimensions Contract", f"{len(dimension_mismatches)} dimension mismatches: {dimension_mismatches[:3]}")

if len(decompression_errors) == 0:
    record_pass("Full Pixel Bitstream Decompression", f"100% of {len(all_webp_files)} files fully decompressed without bitstream errors")
else:
    record_fail("Full Pixel Bitstream Decompression", f"{len(decompression_errors)} decompression errors: {decompression_errors[:3]}")

# ---------------------------------------------------------
# TEST 4: UNIVERSAL FALLBACK ASSET
# ---------------------------------------------------------
print("\n[TEST 4] Universal Fallback Asset Inspection")
fallback_path = os.path.join(PRODUCTS_DIR, "fallback.webp")
if os.path.exists(fallback_path):
    fb_size = os.path.getsize(fallback_path)
    with Image.open(fallback_path) as fb_img:
        fb_w, fb_h = fb_img.size
        record_pass("Fallback Asset Integrity", f"Exists at public/products/fallback.webp, size={fb_size} bytes ({fb_size/1024:.2f} KB), dimensions={fb_w}x{fb_h}")
else:
    record_fail("Fallback Asset Integrity", "public/products/fallback.webp does not exist")

# ---------------------------------------------------------
# TEST 5: RUNTIME SOURCE CODE PURGE OF UNSPLASH & MAGAZORD
# ---------------------------------------------------------
print("\n[TEST 5] Runtime Source Code Image References")
src_files = []
for root, dirs, files in os.walk(os.path.join(ROOT_DIR, "src")):
    for f in files:
        if f.endswith((".ts", ".tsx")):
            src_files.append(os.path.join(root, f))

unsplash_hits = []
magazord_hits = []

# Exclude scripts directory from runtime check (e.g. seed scripts that keep old notes)
for sfile in src_files:
    rel = os.path.relpath(sfile, ROOT_DIR).replace("\\", "/")
    if rel.startswith("src/scripts/"):
        continue
    with open(sfile, "r", encoding="utf-8") as sf:
        content = sf.read()
        if "images.unsplash.com" in content:
            unsplash_hits.append(rel)
        if "magazord.com.br" in content:
            magazord_hits.append(rel)

if len(unsplash_hits) == 0:
    record_pass("Unsplash Purged from Runtime Code", f"0 references in {len(src_files)} src files (excluding scripts)")
else:
    record_fail("Unsplash Purged from Runtime Code", f"Found Unsplash references in: {unsplash_hits}")

if len(magazord_hits) == 0:
    record_pass("Magazord CDN Purged from Runtime Code", f"0 references in {len(src_files)} src files (excluding scripts)")
else:
    record_fail("Magazord CDN Purged from Runtime Code", f"Found Magazord references in: {magazord_hits}")

# ---------------------------------------------------------
# SUMMARY REPORT
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("  EMPIRICAL ORACLE SUMMARY RESULTS")
print("=" * 70)
print(f"Passed assertions: {passed}")
print(f"Failed assertions: {failed}")

if failed == 0:
    print("\nFINAL VERDICT: APPROVE")
    print("All image links, physical disk assets, headers, dimensions, budgets, and fallbacks verified empirically.")
    sys.exit(0)
else:
    print("\nFINAL VERDICT: REJECT")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)

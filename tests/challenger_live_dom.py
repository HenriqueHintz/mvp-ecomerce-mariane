"""
Adversarial Live DOM Verification Suite for Mariane Cosméticos
Checks live HTML rendered by http://localhost:3001
"""

import sys
import urllib.request
import urllib.error
import re

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

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
print("  MARIANE COSMÉTICOS — ADVERSARIAL LIVE DOM VERIFICATION")
print("==================================================================")

BASE_URL = "http://localhost:3001"

try:
    req = urllib.request.Request(BASE_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as response:
        status_code = response.status
        html_bytes = response.read()
        html = html_bytes.decode("utf-8")
        record_pass(f"HTTP GET {BASE_URL}", f"Status {status_code}, {len(html):,} characters")
except Exception as e:
    record_fail(f"HTTP GET {BASE_URL}", str(e))
    sys.exit(1)

# 1. Exact Headline Check
print("\n--- 1. HERO HEADLINE IN LIVE DOM ---")
exact_headline = "Linda é a mulher que bem se quer"
if exact_headline in html:
    record_pass("Live DOM contains exact headline", exact_headline)
else:
    record_fail("Live DOM contains exact headline", f"'{exact_headline}' not found in HTML")

# Check for curly quotes
curly_in_headline = [q for q in ["“", "”", "‘", "’"] if q in html and "mulher que bem se quer" in html]
# Check specifically inside the headline container
headline_match = re.search(r'<h2[^>]*>(.*?)</h2>', html, re.DOTALL)
if headline_match:
    h2_text = re.sub(r'<[^>]+>', '', headline_match.group(1)).strip()
    record_pass("Hero h2 text content", f"'{h2_text}'")
    if h2_text == exact_headline:
        record_pass("Hero h2 verbatim match", exact_headline)
    else:
        record_fail("Hero h2 verbatim match", f"Expected '{exact_headline}', got '{h2_text}'")
    if any(q in h2_text for q in ["“", "”", "‘", "’"]):
        record_fail("Hero h2 curly quotes", f"Found curly quote in h2: {h2_text}")
    else:
        record_pass("Hero h2 curly quotes absence", "No curly quotes in headline")
else:
    record_fail("Hero h2 element", "Could not locate <h2> element in hero")

# 2. Exact Curation Line Check
print("\n--- 2. HERO CURATION LINE IN LIVE DOM ---")
exact_curation = "Curadoria oficial Madressenza, Wella Professionals, Truss, Braé e L'Oréal Professionnel."
if exact_curation in html:
    record_pass("Live DOM contains exact curation line", exact_curation)
else:
    record_fail("Live DOM contains exact curation line", f"'{exact_curation}' not found verbatim in HTML")

# 3. Action Buttons Check
print("\n--- 3. ACTION BUTTONS IN LIVE DOM ---")
# Button 1: VER CATÁLOGO →
exact_btn1 = "VER CATÁLOGO →"
if exact_btn1 in html:
    record_pass("Live DOM contains Button 1 text", exact_btn1)
else:
    # Maybe encoded as &rarr; or \u2192?
    record_fail("Live DOM contains Button 1 text", f"'{exact_btn1}' not found in HTML")

if 'href="/produtos"' in html:
    record_pass("Live DOM contains primary CTA href", "/produtos")
else:
    record_fail("Live DOM contains primary CTA href", "href='/produtos' missing")

# Button 2: COMPRAR PELO WHATSAPP
exact_btn2 = "COMPRAR PELO WHATSAPP"
if exact_btn2 in html:
    record_pass("Live DOM contains Button 2 text", exact_btn2)
else:
    record_fail("Live DOM contains Button 2 text", f"'{exact_btn2}' not found in HTML")

if "wa.me/5549991251617" in html:
    record_pass("Live DOM contains WhatsApp link", "wa.me/5549991251617")
else:
    record_fail("Live DOM contains WhatsApp link", "WhatsApp link missing")

# 4. Brand Cards & Image Sources in Live DOM
print("\n--- 4. BRAND CARDS & IMAGES IN LIVE DOM ---")
BRANDS = [
    ("madressenza", "Madressenza"),
    ("wella-profissional", "Wella Profissional"),
    ("loreal-professionnel", "L'Oréal Professionnel"),
    ("truss", "Truss"),
    ("brae", "Braé"),
    ("lola-cosmetics", "Lola Cosmetics"),
    ("amend", "Amend"),
]

for slug, name in BRANDS:
    expected_link = f'/produtos?marca={slug}'
    if expected_link in html:
        record_pass(f"Brand card link for {slug}", expected_link)
    else:
        record_fail(f"Brand card link for {slug}", f"Link '{expected_link}' missing in HTML")

    # Image source (Next.js rewrites to /_next/image?url=%2Fbrands%2F<slug>.webp... or keeps /brands/<slug>.webp)
    escaped_slug = urllib.parse.quote(f"/brands/{slug}.webp", safe="")
    if f"/brands/{slug}.webp" in html or escaped_slug in html:
        record_pass(f"Brand image in DOM for {slug}", f"Found asset reference for {slug}.webp")
    else:
        record_fail(f"Brand image in DOM for {slug}", f"Asset reference missing for {slug}.webp")

# 5. Live Filter Route Status Verification
print("\n--- 5. LIVE FILTER ROUTES HTTP STATUS ---")
for slug, name in BRANDS:
    filter_url = f"{BASE_URL}/produtos?marca={slug}"
    try:
        req = urllib.request.Request(filter_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            st = resp.status
            if st == 200:
                record_pass(f"GET /produtos?marca={slug}", f"HTTP {st} OK")
            else:
                record_fail(f"GET /produtos?marca={slug}", f"Unexpected status {st}")
    except Exception as err:
        record_fail(f"GET /produtos?marca={slug}", str(err))

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
    print("\nALL LIVE DOM VERIFICATIONS PASSED EMPIRICALLY!")
    sys.exit(0)

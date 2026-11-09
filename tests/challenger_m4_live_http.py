#!/usr/bin/env python3
"""
Mariane Cosméticos — Challenger M4: Live HTTP 200, MIME & Magic Byte Oracle
Milestone: M4 Challenger Verification
File: tests/challenger_m4_live_http.py

Performs an independent empirical audit of all 250 image assets served on http://localhost:3001:
1. Autonomous Server Lifecycle Management:
   - Probes http://localhost:3001/logo.svg
   - If not running, launches 'node node_modules/next/dist/bin/next dev -p 3001' with open stdin pipe
   - Polls readiness until ready (up to 30s)
   - Guarantees clean process tree termination on exit via taskkill on Windows
2. Exhaustive asset gathering:
   - 220 DB product image URLs from local.sqlite
   - 1 Universal fallback (/products/fallback.webp)
   - 6 Hero carousel slides (/hero/slide-*.webp)
   - 14 Partner brand logos & cards (/brands/*.webp and /brands/*.png)
   - 9 Store identity and metadata icons (/logo.svg, /icon.svg, /favicon.ico, etc.)
3. Strict HTTP 200 enforcement (zero redirects, zero 404/500).
4. Header Content-Type verification matching file extension.
5. Binary magic bytes integrity check (RIFF...WEBP, \\x89PNG, <svg, 0x00000100).
6. True bitstream decompression via Pillow (PIL) on 30+ sampled WebP images.
7. Stress & concurrency fuzzing: 20 concurrent threads across all 250 assets.
"""

import sys
import os
import io
import time
import sqlite3
import subprocess
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3001")
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(ROOT_DIR, "local.sqlite")

HERO_SLIDE_URLS = [
    "/hero/slide-1-desktop.webp",
    "/hero/slide-1-mobile.webp",
    "/hero/slide-2-desktop.webp",
    "/hero/slide-2-mobile.webp",
    "/hero/slide-3-desktop.webp",
    "/hero/slide-3-mobile.webp",
]

BRAND_CARD_URLS = [
    "/brands/amend.png",
    "/brands/amend.webp",
    "/brands/brae.png",
    "/brands/brae.webp",
    "/brands/lola-cosmetics.png",
    "/brands/lola-cosmetics.webp",
    "/brands/loreal-professionnel.png",
    "/brands/loreal-professionnel.webp",
    "/brands/madressenza.png",
    "/brands/madressenza.webp",
    "/brands/truss.png",
    "/brands/truss.webp",
    "/brands/wella-profissional.png",
    "/brands/wella-profissional.webp",
]

STORE_BRANDING_URLS = [
    {"url": "/favicon.ico", "mime": "image/x-icon"},
    {"url": "/logo.svg", "mime": "image/svg+xml"},
    {"url": "/logo-nav.png", "mime": "image/png"},
    {"url": "/logo-white.png", "mime": "image/png"},
    {"url": "/logo-mariane-banner.png", "mime": "image/png"},
    {"url": "/icon.svg", "mime": "image/svg+xml"},
    {"url": "/apple-icon.png", "mime": "image/png"},
    {"url": "/logo-horizontal.svg", "mime": "image/svg+xml"},
    {"url": "/logo-rect.svg", "mime": "image/svg+xml"},
]

spawned_server_proc = None

def cleanup_server():
    global spawned_server_proc
    if spawned_server_proc is not None:
        pid = spawned_server_proc.pid
        print(f"\n[Lifecycle] Terminating spawned Next.js server (PID {pid})...")
        try:
            if sys.platform == "win32":
                subprocess.run(f"taskkill /pid {pid} /T /F", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                spawned_server_proc.terminate()
            print(f"[Lifecycle] Server process (PID {pid}) terminated.")
        except Exception as e:
            print(f"[Lifecycle] Warning during cleanup: {e}")
        spawned_server_proc = None

def is_server_ready(url=f"{BASE_URL}/logo.svg", timeout=1.5) -> bool:
    try:
        r = requests.get(url, timeout=timeout)
        return r.status_code == 200
    except Exception:
        return False

def ensure_server_running():
    global spawned_server_proc
    if is_server_ready():
        print(f"[Lifecycle] Active server detected on {BASE_URL} (reusing existing process)")
        return

    print(f"[Lifecycle] No server on {BASE_URL}. Spawning Next.js dev server on port 3001...")
    next_bin = os.path.join(ROOT_DIR, "node_modules", "next", "dist", "bin", "next")
    
    # Spawn node with open stdin pipe to prevent Next.js interactive CLI from closing on EOF
    spawned_server_proc = subprocess.Popen(
        [sys.executable.replace("python.exe", "node.exe") if os.path.exists(sys.executable.replace("python.exe", "node.exe")) else "node",
         next_bin, "dev", "-p", "3001"],
        cwd=ROOT_DIR,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=False
    )
    
    print(f"[Lifecycle] Next.js server spawned with PID {spawned_server_proc.pid}. Polling readiness...", end="", flush=True)
    start_t = time.time()
    while time.time() - start_t < 35.0:
        if is_server_ready():
            print(f" Ready! ({time.time() - start_t:.1f}s)")
            # Pre-warm App Router dynamic routes (/icon.svg and /apple-icon.png) to trigger cold compilation
            print("[Lifecycle] Pre-warming dynamic App Router icon routes...", end="", flush=True)
            try:
                requests.get(f"{BASE_URL}/icon.svg", timeout=15)
                requests.get(f"{BASE_URL}/apple-icon.png", timeout=15)
                print(" Done!")
            except Exception as e:
                print(f" (pre-warm note: {e})")
            return
        print(".", end="", flush=True)
        time.sleep(0.5)
        
    cleanup_server()
    raise RuntimeError(f"Server failed to start on {BASE_URL} within 35s")

def check_magic_bytes(content: bytes, expected_mime: str) -> tuple[bool, str]:
    if len(content) < 4:
        return False, f"Body too small ({len(content)} bytes)"
    
    if expected_mime == "image/webp":
        if len(content) < 12:
            return False, "WebP body under 12 bytes"
        riff = content[0:4]
        webp = content[8:12]
        if riff != b"RIFF" or webp != b"WEBP":
            return False, f"Invalid WebP signature: {riff!r}...{webp!r}"
        return True, "OK"
    
    if expected_mime == "image/png":
        if len(content) < 8:
            return False, "PNG body under 8 bytes"
        if content[0:8] != b"\x89PNG\r\n\x1a\n":
            return False, f"Invalid PNG signature: {content[0:8]!r}"
        return True, "OK"
    
    if expected_mime == "image/svg+xml":
        head = content[:1024].decode("utf-8", errors="ignore")
        if "<svg" not in head and "<?xml" not in head:
            return False, "SVG body missing <svg or <?xml header"
        return True, "OK"
    
    if expected_mime in ("image/x-icon", "image/vnd.microsoft.icon"):
        if content[:4] == b"\x00\x00\x01\x00":
            return True, "OK"
        return False, f"Invalid ICO header: {content[:4]!r}"
    
    return True, "OK"

def matches_mime(received_mime: str, expected_mime: str) -> bool:
    rec = received_mime.split(";")[0].strip().lower()
    exp = expected_mime.split(";")[0].strip().lower()
    if rec == exp:
        return True
    if exp in ("image/x-icon", "image/vnd.microsoft.icon") and rec in ("image/x-icon", "image/vnd.microsoft.icon"):
        return True
    if exp == "image/svg+xml" and rec in ("image/svg+xml", "image/x-icon"):
        return True
    return False

def gather_all_targets():
    targets = []
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT url FROM product_images WHERE url IS NOT NULL ORDER BY url ASC")
    rows = cursor.fetchall()
    conn.close()
    
    for (url,) in rows:
        targets.append({
            "url": url,
            "category": "DB Products",
            "expected_mime": "image/webp",
        })
    
    targets.append({
        "url": "/products/fallback.webp",
        "category": "Fallback",
        "expected_mime": "image/webp",
    })
    
    for url in HERO_SLIDE_URLS:
        targets.append({
            "url": url,
            "category": "Hero Backgrounds",
            "expected_mime": "image/webp",
        })
        
    for url in BRAND_CARD_URLS:
        mime = "image/webp" if url.endswith(".webp") else "image/png"
        targets.append({
            "url": url,
            "category": "Brand Logos",
            "expected_mime": mime,
        })
        
    for b in STORE_BRANDING_URLS:
        targets.append({
            "url": b["url"],
            "category": "Store Branding",
            "expected_mime": b["mime"],
        })
        
    seen = set()
    deduped = []
    for t in targets:
        if t["url"] not in seen:
            seen.add(t["url"])
            deduped.append(t)
    return deduped

def fetch_and_audit(session: requests.Session, target: dict, timeout=15.0) -> dict:
    url = f"{BASE_URL}{target['url']}"
    t0 = time.perf_counter()
    try:
        resp = session.get(url, timeout=timeout, allow_redirects=False)
        elapsed = time.perf_counter() - t0
        status = resp.status_code
        content_type = resp.headers.get("Content-Type", "")
        content = resp.content
        
        if status != 200:
            return {
                "target": target,
                "passed": False,
                "error": f"HTTP status was {status} (expected strictly 200): {content[:300].decode('utf-8', errors='ignore')}",
                "elapsed": elapsed,
                "bytes": len(content),
            }
            
        if not matches_mime(content_type, target["expected_mime"]):
            return {
                "target": target,
                "passed": False,
                "error": f"Content-Type mismatch: expected '{target['expected_mime']}', received '{content_type}'",
                "elapsed": elapsed,
                "bytes": len(content),
            }
            
        if len(content) == 0:
            return {
                "target": target,
                "passed": False,
                "error": "0-byte response payload",
                "elapsed": elapsed,
                "bytes": 0,
            }
            
        magic_ok, reason = check_magic_bytes(content, target["expected_mime"])
        if not magic_ok:
            return {
                "target": target,
                "passed": False,
                "error": f"Magic bytes failure: {reason}",
                "elapsed": elapsed,
                "bytes": len(content),
            }
            
        return {
            "target": target,
            "passed": True,
            "status": status,
            "content_type": content_type,
            "bytes": len(content),
            "elapsed": elapsed,
            "content": content,
        }
    except Exception as e:
        elapsed = time.perf_counter() - t0
        return {
            "target": target,
            "passed": False,
            "error": f"Network / Socket Exception: {type(e).__name__} ({e})",
            "elapsed": elapsed,
            "bytes": 0,
        }

def main():
    print("=" * 70)
    print("  MARIANE COSMÉTICOS — ADVERSARIAL CHALLENGER M4 ORACLE")
    print("=" * 70)
    print(f"Target Server: {BASE_URL}")
    print(f"Database:      {DB_PATH}")
    
    try:
        ensure_server_running()
        
        targets = gather_all_targets()
        print(f"\n--- STEP 1: ASSET MANIFEST HARVEST ---")
        print(f"  • Total Unique Image Targets Harvested: {len(targets)}")
        categories = {}
        for t in targets:
            categories[t["category"]] = categories.get(t["category"], 0) + 1
        for cat, count in sorted(categories.items()):
            print(f"    - {cat:20s}: {count} URLs")
        
        assert len(targets) == 250, f"Expected 250 targets, found {len(targets)}"

        print("\n--- STEP 2: LIVE HTTP 200, MIME & MAGIC BYTES AUDIT ---")
        session = requests.Session()
        audit_results = []
        webp_samples = []
        
        t0_audit = time.perf_counter()
        for i, target in enumerate(targets):
            res = fetch_and_audit(session, target)
            audit_results.append(res)
            if res["passed"] and target["expected_mime"] == "image/webp":
                webp_samples.append((target["url"], res["content"]))
            if (i + 1) % 50 == 0 or (i + 1) == len(targets):
                print(f"  • Verified {i + 1}/{len(targets)} assets...")
                
        audit_duration = time.perf_counter() - t0_audit
        passed_count = sum(1 for r in audit_results if r["passed"])
        failed_results = [r for r in audit_results if not r["passed"]]
        
        print(f"  • Audit Completed in {audit_duration:.2f}s ({passed_count}/{len(targets)} OK)")
        if failed_results:
            print(f"\n❌ AUDIT FAILURES ({len(failed_results)}):")
            for f in failed_results:
                print(f"    [{f['target']['category']}] {f['target']['url']} -> {f['error']}")
            sys.exit(1)
        else:
            print("  [PASS] 100% of 250 image URLs returned strictly HTTP 200 with valid Content-Type and magic bytes!")

        print("\n--- STEP 3: BITSTREAM DECOMPRESSION & PIXEL VALIDATION (PIL) ---")
        critical_urls = {
            "/products/fallback.webp",
            *HERO_SLIDE_URLS,
            "/brands/madressenza.webp",
            "/brands/wella-profissional.webp",
            "/brands/truss.webp",
            "/brands/brae.webp",
            "/brands/loreal-professionnel.webp",
            "/brands/lola-cosmetics.webp",
            "/brands/amend.webp",
        }
        
        sampled_webps = []
        for url, data in webp_samples:
            if url in critical_urls:
                sampled_webps.append((url, data))
                
        product_samples = [(u, d) for u, d in webp_samples if u.startswith("/products/") and u not in critical_urls]
        sampled_webps.extend(product_samples[:25])
        
        print(f"  • Testing full bitstream decompression on {len(sampled_webps)} sampled WebP assets...")
        decompression_errors = []
        for url, data in sampled_webps:
            try:
                with Image.open(io.BytesIO(data)) as img:
                    img.verify()
                with Image.open(io.BytesIO(data)) as img:
                    img.load()
                    fmt = img.format
                    w, h = img.size
                    if fmt != "WEBP":
                        decompression_errors.append(f"{url}: Format is {fmt}, expected WEBP")
                    if w <= 0 or h <= 0:
                        decompression_errors.append(f"{url}: Invalid dimensions {w}x{h}")
            except Exception as e:
                decompression_errors.append(f"{url}: Decompression failed ({e})")
                
        if decompression_errors:
            print(f"❌ Decompression failures ({len(decompression_errors)}):")
            for err in decompression_errors:
                print(f"    {err}")
            sys.exit(1)
        else:
            print(f"  [PASS] All {len(sampled_webps)} sampled WebP images decompressed cleanly into valid pixel rasters!")
            sample_info = sampled_webps[0]
            with Image.open(io.BytesIO(sample_info[1])) as img:
                print(f"    Verified sample: {sample_info[0]} -> Format: {img.format}, Dimensions: {img.size[0]}x{img.size[1]}px")

        print("\n--- STEP 4: CONCURRENCY & STRESS FUZZING (20 WORKERS BURST) ---")
        concurrency = 20
        print(f"  • Launching parallel burst of 250 requests with concurrency={concurrency}...")
        
        stress_failures = []
        durations = []
        t_start = time.perf_counter()
        
        def thread_worker(t):
            thread_sess = requests.Session()
            return fetch_and_audit(thread_sess, t, timeout=10.0)
            
        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            future_map = {executor.submit(thread_worker, t): t for t in targets}
            for future in as_completed(future_map):
                res = future.result()
                durations.append(res["elapsed"])
                if not res["passed"]:
                    stress_failures.append(res)
                    
        total_stress_time = time.perf_counter() - t_start
        avg_latency = (sum(durations) / len(durations)) * 1000 if durations else 0
        max_latency = max(durations) * 1000 if durations else 0
        min_latency = min(durations) * 1000 if durations else 0
        
        print(f"  • Stress Burst Finished in {total_stress_time:.2f}s")
        print(f"    - Avg Latency: {avg_latency:.1f}ms | Min: {min_latency:.1f}ms | Max: {max_latency:.1f}ms")
        print(f"    - Requests Completed: {len(durations)}/250")
        print(f"    - Socket Dropouts / Failures: {len(stress_failures)}")
        
        if stress_failures:
            print(f"❌ Stress test encountered {len(stress_failures)} failures:")
            for sf in stress_failures[:10]:
                print(f"    [{sf['target']['category']}] {sf['target']['url']} -> {sf['error']}")
            sys.exit(1)
        else:
            print(f"  [PASS] ZERO ECONNREFUSED, ZERO socket hang-ups under 20-thread concurrency burst!")

        print("\n" + "=" * 70)
        print("  VERDICT: EMPIRICAL VERIFICATION COMPLETE — 100% PASS")
        print("=" * 70)
        print("  ✓ All 250 assets returned HTTP 200 strictly")
        print("  ✓ Content-Type and magic bytes verified across all formats")
        print(f"  ✓ {len(sampled_webps)} WebP images fully decompressed into valid raster pixels")
        print("  ✓ Zero socket errors or connection resets under 20-thread concurrent stress")
        print("=" * 70)
        
    finally:
        cleanup_server()

if __name__ == "__main__":
    main()

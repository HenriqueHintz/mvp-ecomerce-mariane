"""
Empirical Binary & XML Stress Harness for Mariane Cosméticos Milestone M1
Aligned with docs/DESIGN.md (Decisions 1, 2-A)
"""

import sys
import os
import struct
import xml.etree.ElementTree as ET

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC_DIR = os.path.join(REPO_ROOT, "public")
APP_DIR = os.path.join(REPO_ROOT, "src", "app")

failures = []
passed = 0

def record_pass(test_name, details=""):
    global passed
    passed += 1
    print(f"  [PASS] {test_name}" + (f" -> {details}" if details else ""))

def record_fail(test_name, error_msg):
    global failures
    failures.append((test_name, error_msg))
    print(f"  [FAIL] {test_name} -> {error_msg}")

print("==================================================================")
print("  MARIANE COSMÉTICOS — M1 BINARY & XML ADVERSARIAL STRESS TEST")
print("==================================================================")

# ----------------------------------------------------------------------
# 1. XML Validity: public/logo.svg
# ----------------------------------------------------------------------
print("\n[1] XML Stress Testing: public/logo.svg")
logo_svg_path = os.path.join(PUBLIC_DIR, "logo.svg")

if not os.path.exists(logo_svg_path):
    record_fail("logo.svg exists", f"File not found at {logo_svg_path}")
else:
    record_pass("logo.svg exists", f"Size: {os.path.getsize(logo_svg_path)} bytes")
    try:
        tree = ET.parse(logo_svg_path)
        root = tree.getroot()
        record_pass("logo.svg XML Parse", f"Root tag: {root.tag}")

        # Check namespace
        if "http://www.w3.org/2000/svg" in root.tag:
            record_pass("logo.svg SVG Namespace", root.tag)
        else:
            record_fail("logo.svg SVG Namespace", f"Expected SVG namespace, got {root.tag}")

        # Check viewBox (907x358 OpenGraph horizontal banner format)
        viewbox = root.attrib.get("viewBox")
        if viewbox:
            vb_parts = [float(x) for x in viewbox.strip().split()]
            if len(vb_parts) == 4 and vb_parts[2] > 0 and vb_parts[3] > 0:
                record_pass("logo.svg viewBox format", f"viewBox='{viewbox}' ({vb_parts[2]}x{vb_parts[3]})")
                aspect_ratio = vb_parts[2] / vb_parts[3]
                if abs(aspect_ratio - (907.0 / 358.0)) < 0.01:
                    record_pass("logo.svg OpenGraph horizontal aspect ratio (907:358)", f"Aspect ratio = {aspect_ratio:.2f}")
                else:
                    record_fail("logo.svg OpenGraph horizontal aspect ratio (907:358)", f"Expected ~2.53, got {aspect_ratio}")
            else:
                record_fail("logo.svg viewBox format", f"Invalid parts: {vb_parts}")
        else:
            record_fail("logo.svg viewBox format", "viewBox attribute missing")

        # Check required brand elements in XML tree
        xml_str = ET.tostring(root, encoding="utf-8").decode("utf-8")
        if "MARIANE COSMÉTICOS" in xml_str.upper():
            record_pass("logo.svg Mariane Cosméticos Wordmark text/title", "Found 'Mariane Cosméticos' in XML")
        else:
            record_fail("logo.svg Mariane Cosméticos Wordmark text/title", "'Mariane Cosméticos' missing in XML")

        if "MADRESSENZA" in xml_str.upper():
            record_pass("logo.svg Official Madressenza Credential", "Found 'Madressenza' in XML")
        else:
            record_fail("logo.svg Official Madressenza Credential", "'Madressenza' missing in XML")

        if "/LOGO.PNG" in xml_str.upper():
            record_pass("logo.svg Embedded /logo.png Reference", "Found href='/logo.png' in XML")
        else:
            record_fail("logo.svg Embedded /logo.png Reference", "href='/logo.png' missing in XML")

    except ET.ParseError as e:
        record_fail("logo.svg XML Parse", f"XML ParseError: {str(e)}")

# ----------------------------------------------------------------------
# 2. XML Validity: src/app/icon.svg
# ----------------------------------------------------------------------
print("\n[2] XML Stress Testing: src/app/icon.svg")
icon_svg_path = os.path.join(APP_DIR, "icon.svg")

if not os.path.exists(icon_svg_path):
    record_fail("icon.svg exists", f"File not found at {icon_svg_path}")
else:
    record_pass("icon.svg exists", f"Size: {os.path.getsize(icon_svg_path)} bytes")
    try:
        tree = ET.parse(icon_svg_path)
        root = tree.getroot()
        record_pass("icon.svg XML Parse", f"Root tag: {root.tag}")

        if "http://www.w3.org/2000/svg" in root.tag:
            record_pass("icon.svg SVG Namespace", root.tag)
        else:
            record_fail("icon.svg SVG Namespace", f"Expected SVG namespace, got {root.tag}")

        viewbox = root.attrib.get("viewBox")
        if viewbox:
            vb_parts = [float(x) for x in viewbox.strip().split()]
            if len(vb_parts) == 4 and vb_parts[2] > 0 and vb_parts[3] > 0:
                record_pass("icon.svg viewBox format", f"viewBox='{viewbox}' ({vb_parts[2]}x{vb_parts[3]})")
                aspect_ratio = vb_parts[2] / vb_parts[3]
                if abs(aspect_ratio - (440.0 / 240.0)) < 0.01:
                    record_pass("icon.svg silhouette aspect ratio (440:240)", f"Aspect ratio = {aspect_ratio:.2f}")
                else:
                    record_fail("icon.svg silhouette aspect ratio (440:240)", f"Expected ~1.83, got {aspect_ratio}")
            else:
                record_fail("icon.svg viewBox format", f"Invalid parts: {vb_parts}")
        else:
            record_fail("icon.svg viewBox format", "viewBox attribute missing")

        xml_str = ET.tostring(root, encoding="utf-8").decode("utf-8")
        if "#E11D74" in xml_str.upper():
            record_pass("icon.svg Official Silhouette Magenta (#E11D74)", "Found #E11D74")
        else:
            record_fail("icon.svg Official Silhouette Magenta (#E11D74)", "#E11D74 missing")

        if "MARIANE COSMÉTICOS" in xml_str.upper():
            record_pass("icon.svg Mariane Cosméticos Title", "Found 'Mariane Cosméticos'")
        else:
            record_fail("icon.svg Mariane Cosméticos Title", "'Mariane Cosméticos' missing")

    except ET.ParseError as e:
        record_fail("icon.svg XML Parse", f"XML ParseError: {str(e)}")

# ----------------------------------------------------------------------
# 3. Binary Structure Validation: public/favicon.ico
# ----------------------------------------------------------------------
print("\n[3] Binary Format Validation: public/favicon.ico")
favicon_path = os.path.join(PUBLIC_DIR, "favicon.ico")

if not os.path.exists(favicon_path):
    record_fail("favicon.ico exists", f"File not found at {favicon_path}")
else:
    file_size = os.path.getsize(favicon_path)
    record_pass("favicon.ico exists", f"Size: {file_size} bytes")

    with open(favicon_path, "rb") as f:
        ico_bytes = f.read()

    if len(ico_bytes) < 6:
        record_fail("favicon.ico Header Size", f"File too small for ICONDIR: {len(ico_bytes)} bytes")
    else:
        # ICONDIR structure: idReserved (2 bytes), idType (2 bytes), idCount (2 bytes)
        id_reserved, id_type, id_count = struct.unpack("<HHH", ico_bytes[:6])
        if id_reserved == 0:
            record_pass("favicon.ico ICONDIR.idReserved == 0", "Value = 0")
        else:
            record_fail("favicon.ico ICONDIR.idReserved == 0", f"Expected 0, got {id_reserved}")

        if id_type == 1:
            record_pass("favicon.ico ICONDIR.idType == 1 (ICO)", "Value = 1")
        else:
            record_fail("favicon.ico ICONDIR.idType == 1 (ICO)", f"Expected 1, got {id_type}")

        if id_count >= 1:
            record_pass("favicon.ico ICONDIR.idCount >= 1", f"{id_count} image entries found")
        else:
            record_fail("favicon.ico ICONDIR.idCount >= 1", "Zero image entries")

        # Parse ICONDIRENTRY (16 bytes each)
        entry_offset = 6
        valid_entries = 0
        for i in range(id_count):
            if entry_offset + 16 > len(ico_bytes):
                record_fail(f"favicon.ico Entry #{i} Bounds", "File truncated before entry header")
                break

            entry = ico_bytes[entry_offset:entry_offset + 16]
            b_width, b_height, b_color_count, b_reserved, w_planes, w_bit_count, dw_bytes_in_res, dw_image_offset = struct.unpack(
                "<BBBBHHII", entry
            )

            w = 256 if b_width == 0 else b_width
            h = 256 if b_height == 0 else b_height

            if dw_image_offset + dw_bytes_in_res > len(ico_bytes):
                record_fail(f"favicon.ico Entry #{i} Data Bounds",
                            f"Image offset {dw_image_offset} + size {dw_bytes_in_res} > file size {len(ico_bytes)}")
            else:
                image_data = ico_bytes[dw_image_offset:dw_image_offset + dw_bytes_in_res]
                is_png = image_data.startswith(b"\x89PNG\r\n\x1a\n")
                is_dib = len(image_data) >= 4 and struct.unpack("<I", image_data[:4])[0] == 40

                format_str = "PNG" if is_png else ("DIB/BMP" if is_dib else "UNKNOWN")
                if is_png or is_dib:
                    record_pass(f"favicon.ico Image #{i} ({w}x{h})",
                                f"{format_str}, {dw_bytes_in_res} bytes, bpp: {w_bit_count}, offset: {dw_image_offset}")
                    valid_entries += 1
                else:
                    record_fail(f"favicon.ico Image #{i} ({w}x{h})",
                                f"Invalid payload signature: {image_data[:8].hex()}")

            entry_offset += 16

        if valid_entries == id_count and id_count > 0:
            record_pass("favicon.ico Full Binary Integrity", f"All {id_count} embedded images valid")
        else:
            record_fail("favicon.ico Full Binary Integrity", f"{valid_entries}/{id_count} valid entries")

# ----------------------------------------------------------------------
# 4. Binary Structure Validation: Official PNG Assets (Decision 2-A)
# ----------------------------------------------------------------------
print("\n[4] Binary Format Validation: Official PNG Assets (apple-icon, logo-nav, logo-white, logo-mariane-banner)")

png_assets = [
    ("src/app/apple-icon.png", os.path.join(APP_DIR, "apple-icon.png"), 180, 180),
    ("public/logo-nav.png", os.path.join(PUBLIC_DIR, "logo-nav.png"), 100, 40),
    ("public/logo-white.png", os.path.join(PUBLIC_DIR, "logo-white.png"), 100, 40),
    ("public/logo-mariane-banner.png", os.path.join(PUBLIC_DIR, "logo-mariane-banner.png"), 200, 80),
]

for label, asset_path, min_w, min_h in png_assets:
    if not os.path.exists(asset_path):
        record_fail(f"{label} exists", f"File not found at {asset_path}")
        continue

    file_size = os.path.getsize(asset_path)
    record_pass(f"{label} exists", f"Size: {file_size} bytes")

    with open(asset_path, "rb") as f:
        png_bytes = f.read()

    if png_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        record_pass(f"{label} PNG Signature", "Magic bytes match RFC 2083")
        if len(png_bytes) >= 26:
            ihdr_len, ihdr_type = struct.unpack(">I4s", png_bytes[8:16])
            if ihdr_type == b"IHDR" and ihdr_len >= 13:
                w, h, bit_depth, color_type = struct.unpack(">IIBB", png_bytes[16:26])
                record_pass(f"{label} IHDR Chunk", f"Dimensions: {w}x{h}, Bit Depth: {bit_depth}, Color Type: {color_type}")
                if w >= min_w and h >= min_h:
                    record_pass(f"{label} Resolution Check", f">= {min_w}x{min_h} ({w}x{h})")
                else:
                    record_fail(f"{label} Resolution Check", f"Expected >= {min_w}x{min_h}, got {w}x{h}")
            else:
                record_fail(f"{label} IHDR Chunk", "Missing valid IHDR chunk")
    else:
        record_fail(f"{label} PNG Signature", f"Invalid signature: {png_bytes[:8].hex()}")

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
print("\n------------------------------------------------------------------")
print(f"Passed: {passed} | Failures: {len(failures)}")
if failures:
    print("\nFAILURES DETECTED:")
    for name, err in failures:
        print(f"  - {name}: {err}")
    sys.exit(1)
else:
    print("\nALL BINARY & XML CHECKS PASSED EMPIRICALLY!")
    sys.exit(0)

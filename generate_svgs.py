import cv2
import numpy as np

def contours_to_svg_path(contours, hierarchy, min_area=15):
    path_d = []
    if hierarchy is None:
        return ''
    for i, cnt in enumerate(contours):
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue
        epsilon = 0.0025 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        if len(approx) < 3:
            continue
        d = f'M {approx[0][0][0]} {approx[0][0][1]} '
        for pt in approx[1:]:
            d += f'L {pt[0][0]} {pt[0][1]} '
        d += 'Z '
        path_d.append(d)
    return ''.join(path_d)

# Silhouette
sil = cv2.imread(r'C:\Projetos\Mariane Cosmeticos\public\logo-silhouette.png', cv2.IMREAD_UNCHANGED)
sh, sw, _ = sil.shape
alpha_s = sil[:, :, 3]
_, thresh_s = cv2.threshold(alpha_s, 60, 255, cv2.THRESH_BINARY)
contours_s, hier_s = cv2.findContours(thresh_s, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_L1)
path_s = contours_to_svg_path(contours_s, hier_s, min_area=20)

# Text
txt = cv2.imread(r'C:\Projetos\Mariane Cosmeticos\public\logo-text.png', cv2.IMREAD_UNCHANGED)
th, tw, _ = txt.shape
alpha_t = txt[:, :, 3]
_, thresh_t = cv2.threshold(alpha_t, 60, 255, cv2.THRESH_BINARY)
contours_t, hier_t = cv2.findContours(thresh_t, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_L1)
path_t = contours_to_svg_path(contours_t, hier_t, min_area=12)

# Full Artwork
art = cv2.imread(r'C:\Projetos\Mariane Cosmeticos\public\logo-art-transparent.png', cv2.IMREAD_UNCHANGED)
ah, aw, _ = art.shape

print('Silhouette path length:', len(path_s))
print('Text path length:', len(path_t))

# Vertical Lockup SVG
svg_vertical = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {aw} {ah}" width="100%" height="100%" role="img" aria-label="Mariane Cosméticos">
  <title>Mariane Cosméticos</title>
  <desc>Mariane Cosméticos - Revendedora oficial Madressenza</desc>
  <g fill="#E11D74" fill-rule="evenodd">
    <path d="{path_s}" />
  </g>
  <g transform="translate(0, 215)" fill="#4A154B" fill-rule="evenodd">
    <path d="{path_t}" />
  </g>
</svg>'''

with open(r'C:\Projetos\Mariane Cosmeticos\public\logo.svg', 'w', encoding='utf-8') as f:
    f.write(svg_vertical)

# Horizontal Lockup SVG: Silhouette on left (scaled to height 140), Text on right
# sil width in original: 440, height: 240 -> scale to h=140: w = 256
# txt width in original: 440, height: 175 -> scale to h=100: w = 251
horiz_w = 540
horiz_h = 145

svg_horizontal = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {horiz_w} {horiz_h}" width="100%" height="100%" role="img" aria-label="Mariane Cosméticos">
  <title>Mariane Cosméticos</title>
  <desc>Mariane Cosméticos - Revendedora oficial Madressenza</desc>
  <!-- Silhouette on left -->
  <g transform="translate(10, 2) scale(0.58)" fill="#E11D74" fill-rule="evenodd">
    <path d="{path_s}" />
  </g>
  <!-- Text on right -->
  <g transform="translate(265, 22) scale(0.58)" fill="#4A154B" fill-rule="evenodd">
    <path d="{path_t}" />
  </g>
</svg>'''

with open(r'C:\Projetos\Mariane Cosmeticos\public\logo-horizontal.svg', 'w', encoding='utf-8') as f:
    f.write(svg_horizontal)

# Icon SVG (Only the silhouette/face with foliage)
svg_icon = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {sw} {sh}" width="100%" height="100%" role="img" aria-label="Mariane Cosméticos">
  <title>Mariane Cosméticos Icon</title>
  <g fill="#E11D74" fill-rule="evenodd">
    <path d="{path_s}" />
  </g>
</svg>'''

with open(r'C:\Projetos\Mariane Cosmeticos\src\app\icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_icon)

print('All 3 pure vector SVGs written successfully!')


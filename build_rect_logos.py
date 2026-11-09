import cv2
import numpy as np

# Load the original image
orig = cv2.imread(r'C:\Projetos\Mariane Cosmeticos\public\logo-original.jpg')
h, w, _ = orig.shape
cx, cy = w // 2, h // 2

# We have the high quality transparent artwork from earlier:
# 1) logo-silhouette.png (woman + foliage in magenta)
# 2) logo-text.png (Mariane Cosméticos + Madressenza in deep violet)
# 3) logo-art-transparent.png (both stacked)
sil = cv2.imread(r'C:\Projetos\Mariane Cosmeticos\public\logo-silhouette.png', cv2.IMREAD_UNCHANGED)
txt = cv2.imread(r'C:\Projetos\Mariane Cosmeticos\public\logo-text.png', cv2.IMREAD_UNCHANGED)
art = cv2.imread(r'C:\Projetos\Mariane Cosmeticos\public\logo-art-transparent.png', cv2.IMREAD_UNCHANGED)

# Purple border color: #6F0281 -> BGR: [129, 2, 111]
# Vibrant purple fill: #8B009B / #7A058A
# Center radial glow: white #FFFFFF / faint lilac #FCEEFA

# -------------------------------------------------------------
# 1. HORIZONTAL RECTANGLE (Ideal for Navbar & Header):
# Width: 460px, Height: 110px, Corner Radius: 16px
# -------------------------------------------------------------
rect_w = 480
rect_h = 120
rect_img = np.zeros((rect_h, rect_w, 4), dtype=np.uint8)

# Create rounded rectangle mask
corner_r = 20
mask = np.zeros((rect_h, rect_w), dtype=np.uint8)
cv2.rectangle(mask, (corner_r, 0), (rect_w - corner_r, rect_h), 255, -1)
cv2.rectangle(mask, (0, corner_r), (rect_w, rect_h - corner_r), 255, -1)
cv2.circle(mask, (corner_r, corner_r), corner_r, 255, -1)
cv2.circle(mask, (rect_w - corner_r, corner_r), corner_r, 255, -1)
cv2.circle(mask, (corner_r, rect_h - corner_r), corner_r, 255, -1)
cv2.circle(mask, (rect_w - corner_r, rect_h - corner_r), corner_r, 255, -1)

# Generate the gorgeous purple-to-white radial gradient across the rectangle
Y, X = np.ogrid[:rect_h, :rect_w]
# Center of glow inside the card
glow_x, glow_y = rect_w // 2, rect_h // 2
# Normalized distance from glow center (elliptical)
norm_dist = np.sqrt(((X - glow_x) / (rect_w * 0.48))**2 + ((Y - glow_y) / (rect_h * 0.52))**2)
norm_dist = np.clip(norm_dist, 0.0, 1.0)

# Colors:
# Center (dist = 0): White [255, 255, 255]
# Mid (dist = 0.5): Soft Lilac [245, 220, 248]
# Border (dist = 1.0): Deep Royal Purple [120, 0, 105] (BGR: [105, 0, 120])
bg_bgr = np.zeros((rect_h, rect_w, 3), dtype=np.float32)

for i in range(3):
    # Smooth step interpolation
    # Center white, outer purple
    c_center = 255.0
    c_mid = [248.0, 220.0, 245.0][i]
    c_outer = [115.0, 2.0, 105.0][i]
    
    # Quadratic easing
    t = norm_dist ** 1.8
    bg_bgr[:, :, i] = c_center * (1.0 - t) + c_outer * t

# Set into RGBA with mask
rect_img[:, :, 0:3] = np.clip(bg_bgr, 0, 255).astype(np.uint8)
rect_img[:, :, 3] = mask

# Add a crisp outer border of 2px
border_mask = cv2.morphologyEx(mask, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))
rect_img[border_mask > 0, 0:3] = [100, 0, 90] # Deep purple border

# Now overlay the artwork onto this horizontal rectangle:
# Left: Silhouette (height ~96px)
# Right: Text (height ~70px)
target_sil_h = 100
scale_s = target_sil_h / sil.shape[0]
sil_scaled = cv2.resize(sil, (int(sil.shape[1] * scale_s), target_sil_h), interpolation=cv2.INTER_LANCZOS4)

target_txt_h = 72
scale_t = target_txt_h / txt.shape[0]
txt_scaled = cv2.resize(txt, (int(txt.shape[1] * scale_t), target_txt_h), interpolation=cv2.INTER_LANCZOS4)

# Place silhouette on left
sx = 25
sy = (rect_h - target_sil_h) // 2
for c in range(3):
    alpha_s = sil_scaled[:, :, 3] / 255.0
    rect_img[sy:sy+target_sil_h, sx:sx+sil_scaled.shape[1], c] = (
        sil_scaled[:, :, c] * alpha_s + 
        rect_img[sy:sy+target_sil_h, sx:sx+sil_scaled.shape[1], c] * (1.0 - alpha_s)
    ).astype(np.uint8)

# Place text on right
tx = sx + sil_scaled.shape[1] + 18
ty = (rect_h - target_txt_h) // 2
for c in range(3):
    alpha_t = txt_scaled[:, :, 3] / 255.0
    rect_img[ty:ty+target_txt_h, tx:tx+txt_scaled.shape[1], c] = (
        txt_scaled[:, :, c] * alpha_t + 
        rect_img[ty:ty+target_txt_h, tx:tx+txt_scaled.shape[1], c] * (1.0 - alpha_t)
    ).astype(np.uint8)

cv2.imwrite(r'C:\Projetos\Mariane Cosmeticos\public\logo-rect.png', rect_img)
print('Saved logo-rect.png (Horizontal Card):', rect_img.shape)


# -------------------------------------------------------------
# 2. VERTICAL / BOX RECTANGLE (Hero & Social & Footer):
# Width: 460px, Height: 420px, Corner Radius: 28px
# Exactly replicates the circular emblem lighting inside an elegant rounded rectangle
# -------------------------------------------------------------
box_w = 460
box_h = 420
box_img = np.zeros((box_h, box_w, 4), dtype=np.uint8)

corner_b = 32
mask_b = np.zeros((box_h, box_w), dtype=np.uint8)
cv2.rectangle(mask_b, (corner_b, 0), (box_w - corner_b, box_h), 255, -1)
cv2.rectangle(mask_b, (0, corner_b), (box_w, box_h - corner_b), 255, -1)
cv2.circle(mask_b, (corner_b, corner_b), corner_b, 255, -1)
cv2.circle(mask_b, (box_w - corner_b, corner_b), corner_b, 255, -1)
cv2.circle(mask_b, (corner_b, box_h - corner_b), corner_b, 255, -1)
cv2.circle(mask_b, (box_w - corner_b, box_h - corner_b), corner_b, 255, -1)

# Gradient with circular glow in center
Yb, Xb = np.ogrid[:box_h, :box_w]
bglow_x, bglow_y = box_w // 2, int(box_h * 0.48)
b_dist = np.sqrt(((Xb - bglow_x) / (box_w * 0.48))**2 + ((Yb - bglow_y) / (box_h * 0.48))**2)
b_dist = np.clip(b_dist, 0.0, 1.0)

bg_box = np.zeros((box_h, box_w, 3), dtype=np.float32)
for i in range(3):
    c_center = 255.0
    c_outer = [115.0, 2.0, 105.0][i]
    t = b_dist ** 1.6
    bg_box[:, :, i] = c_center * (1.0 - t) + c_outer * t

box_img[:, :, 0:3] = np.clip(bg_box, 0, 255).astype(np.uint8)
box_img[:, :, 3] = mask_b

border_b = cv2.morphologyEx(mask_b, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))
box_img[border_b > 0, 0:3] = [100, 0, 90]

# Overlay stacked art centered
target_art_h = 320
scale_a = target_art_h / art.shape[0]
art_scaled = cv2.resize(art, (int(art.shape[1] * scale_a), target_art_h), interpolation=cv2.INTER_LANCZOS4)

ay = (box_h - target_art_h) // 2
ax = (box_w - art_scaled.shape[1]) // 2

for c in range(3):
    alpha_a = art_scaled[:, :, 3] / 255.0
    box_img[ay:ay+target_art_h, ax:ax+art_scaled.shape[1], c] = (
        art_scaled[:, :, c] * alpha_a + 
        box_img[ay:ay+target_art_h, ax:ax+art_scaled.shape[1], c] * (1.0 - alpha_a)
    ).astype(np.uint8)

cv2.imwrite(r'C:\Projetos\Mariane Cosmeticos\public\logo-box.png', box_img)
print('Saved logo-box.png (Vertical Box Card):', box_img.shape)


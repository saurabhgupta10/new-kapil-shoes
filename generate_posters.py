#!/usr/bin/env python3
"""
New Kapil Shoes - QR Code, A4 & A5 High-Resolution Poster Generator (300 DPI)

Generates:
1. qr_NewKapilShoes.png (Clean QR code image)
2. poster_A4_NewKapilShoes.png (A4 Print-ready 300 DPI poster: 2480 x 3508 px)
3. poster_A5_NewKapilShoes.png (A5 Counter standee 300 DPI poster: 1748 x 2480 px)

Usage:
  python generate_posters.py [TARGET_URL]
"""

import os
import sys
import qrcode
from PIL import Image, ImageDraw, ImageFont

STORE_NAME = "NEW KAPIL SHOES"
STORE_CATEGORIES = "SHOES • SLIPPERS • SANDALS • FOOTWEAR"
GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJNbz9Kt95hDkRLJ6YP07O1Wg"
INSTAGRAM_HANDLE = "@new_kapil_shoes"

# Color Palette (Deep Charcoal, Warm Amber, Crisp White, Soft Cream)
CHARCOAL = (25, 28, 31)       # #191c1f
AMBER = (196, 109, 41)        # #c46d29
AMBER_LIGHT = (251, 240, 230) # #fbf0e6
WHITE = (255, 255, 255)
LIGHT_BG = (248, 246, 242)
TEXT_DARK = (25, 28, 31)
TEXT_MUTED = (100, 116, 139)
BORDER_COLOR = (226, 232, 240)

def get_font(preferred_font_names, size, bold=False):
    system_font_dirs = [
        "C:\\Windows\\Fonts",
        os.path.expanduser("~/.fonts"),
        os.path.expanduser("~/AppData/Local/Microsoft/Windows/Fonts"),
        "/usr/share/fonts",
        "/usr/local/share/fonts",
    ]

    for name in preferred_font_names:
        for font_dir in system_font_dirs:
            candidate = os.path.join(font_dir, name)
            if os.path.exists(candidate):
                try:
                    return ImageFont.truetype(candidate, size)
                except Exception:
                    continue
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue

    fallbacks = ["arialbd.ttf", "segoeuib.ttf", "DejaVuSans-Bold.ttf"] if bold else ["arial.ttf", "segoeui.ttf", "DejaVuSans.ttf"]
    for name in fallbacks:
        for font_dir in system_font_dirs:
            candidate = os.path.join(font_dir, name)
            if os.path.exists(candidate):
                try:
                    return ImageFont.truetype(candidate, size)
                except Exception:
                    continue
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue

    return ImageFont.load_default()

def generate_qr(target_url, output_path):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=20,
        border=2,
    )
    qr.add_data(target_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=CHARCOAL, back_color=WHITE).convert("RGB")
    img.save(output_path, "PNG")
    print(f"[OK] Saved QR Code: {output_path}")
    return img

def render_poster(qr_img, width, height, output_path, is_a4=True):
    poster = Image.new("RGB", (width, height), WHITE)
    draw = ImageDraw.Draw(poster)

    scale = width / 1748.0  # reference scaling factor based on A5

    # 1. Header Band
    header_height = int(460 * scale)
    draw.rectangle([(0, 0), (width, header_height)], fill=CHARCOAL)

    # 2. Amber Accent Strip
    strip_height = int(32 * scale)
    draw.rectangle([(0, header_height), (width, header_height + strip_height)], fill=AMBER)

    # Header Fonts
    font_eyebrow = get_font(["segoeuib.ttf", "arialbd.ttf"], int(36 * scale), bold=True)
    font_title = get_font(["segoeuib.ttf", "arialbd.ttf"], int(86 * scale), bold=True)
    font_sub = get_font(["segoeui.ttf", "arial.ttf"], int(38 * scale), bold=False)

    # Draw Header Texts
    draw.text((width // 2, int(85 * scale)), "PREMIUM FOOTWEAR COLLECTION", font=font_eyebrow, fill=(229, 185, 143), anchor="mm")
    draw.text((width // 2, int(200 * scale)), STORE_NAME, font=font_title, fill=WHITE, anchor="mm")
    draw.text((width // 2, int(340 * scale)), STORE_CATEGORIES, font=font_sub, fill=(209, 213, 219), anchor="mm")

    # 3. Main Callouts
    font_headline = get_font(["segoeuib.ttf", "arialbd.ttf"], int(68 * scale), bold=True)
    font_headline_hi = get_font(["mangal.ttf", "nirmala.ttf", "segoeui.ttf"], int(54 * scale), bold=True)
    font_subtext = get_font(["segoeui.ttf", "arial.ttf"], int(34 * scale), bold=False)

    y_cursor = header_height + strip_height + int(80 * scale)
    draw.text((width // 2, y_cursor), "How was your shopping experience?", font=font_headline, fill=TEXT_DARK, anchor="mm")

    y_cursor += int(75 * scale)
    draw.text((width // 2, y_cursor), "अपना अनुभव साझा करने के लिए स्कैन करें", font=font_headline_hi, fill=AMBER, anchor="mm")

    y_cursor += int(65 * scale)
    draw.text((width // 2, y_cursor), "⚡ Takes 30 seconds • English, हिंदी, Hinglish", font=font_subtext, fill=TEXT_MUTED, anchor="mm")

    # 4. QR Code Box
    qr_size = int(680 * scale)
    resized_qr = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)

    qr_x = (width - qr_size) // 2
    y_cursor += int(60 * scale)
    qr_y = y_cursor

    # Outer Frame
    padding = int(32 * scale)
    draw.rounded_rectangle(
        [(qr_x - padding, qr_y - padding), (qr_x + qr_size + padding, qr_y + qr_size + padding)],
        radius=int(28 * scale),
        fill=WHITE,
        outline=CHARCOAL,
        width=int(6 * scale),
    )
    poster.paste(resized_qr, (qr_x, qr_y))

    # Badge under QR
    y_cursor = qr_y + qr_size + padding + int(45 * scale)
    badge_w, badge_h = int(640 * scale), int(64 * scale)
    badge_x = (width - badge_w) // 2
    draw.rounded_rectangle(
        [(badge_x, y_cursor), (badge_x + badge_w, y_cursor + badge_h)],
        radius=int(32 * scale),
        fill=AMBER_LIGHT,
        outline=AMBER,
        width=int(2 * scale),
    )
    font_badge = get_font(["segoeuib.ttf", "arialbd.ttf"], int(32 * scale), bold=True)
    draw.text((width // 2, y_cursor + badge_h // 2), "📲 Point your phone camera to scan", font=font_badge, fill=AMBER, anchor="mm")

    # 5. Three Steps Flow
    y_cursor += badge_h + int(80 * scale)
    steps_box_h = int(220 * scale)
    margin_x = int(80 * scale)
    draw.rounded_rectangle(
        [(margin_x, y_cursor), (width - margin_x, y_cursor + steps_box_h)],
        radius=int(20 * scale),
        fill=(248, 250, 252),
        outline=BORDER_COLOR,
        width=int(2 * scale),
    )

    step_w = (width - 2 * margin_x) // 3
    font_step_num = get_font(["segoeuib.ttf", "arialbd.ttf"], int(32 * scale), bold=True)
    font_step_title = get_font(["segoeuib.ttf", "arialbd.ttf"], int(28 * scale), bold=True)
    font_step_desc = get_font(["segoeui.ttf", "arial.ttf"], int(22 * scale), bold=False)

    steps = [
        ("1", "Scan QR Code", "Open camera & tap link"),
        ("2", "Rate Experience", "Get instant AI reviews"),
        ("3", "Post on Google", "Copy & post with 1 tap"),
    ]

    for idx, (num, stitle, sdesc) in enumerate(steps):
        center_x = margin_x + int((idx + 0.5) * step_w)
        num_y = y_cursor + int(50 * scale)
        draw.ellipse(
            [(center_x - int(24 * scale), num_y - int(24 * scale)), (center_x + int(24 * scale), num_y + int(24 * scale))],
            fill=CHARCOAL,
        )
        draw.text((center_x, num_y), num, font=font_step_num, fill=WHITE, anchor="mm")
        draw.text((center_x, num_y + int(48 * scale)), stitle, font=font_step_title, fill=TEXT_DARK, anchor="mm")
        draw.text((center_x, num_y + int(84 * scale)), sdesc, font=font_step_desc, fill=TEXT_MUTED, anchor="mm")

    # 6. Bottom Footer Band
    footer_height = int(140 * scale)
    draw.rectangle([(0, height - footer_height), (width, height)], fill=LIGHT_BG)
    draw.line([(0, height - footer_height), (width, height - footer_height)], fill=BORDER_COLOR, width=int(2 * scale))

    font_footer = get_font(["segoeuib.ttf", "arialbd.ttf"], int(30 * scale), bold=True)
    draw.text((margin_x + int(40 * scale), height - footer_height // 2), f"📸 Follow us on Instagram: {INSTAGRAM_HANDLE}", font=font_footer, fill=TEXT_DARK, anchor="lm")
    draw.text((width - margin_x - int(40 * scale), height - footer_height // 2), "⭐ Verified Google Review Link", font=font_footer, fill=(26, 115, 232), anchor="rm")

    poster.save(output_path, "PNG", dpi=(300, 300))
    print(f"[OK] Saved Poster: {output_path} ({width}x{height} px, 300 DPI)")

def main():
    target_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000/"

    print("==================================================")
    print("👟 NEW KAPIL SHOES - QR & Poster Generator (300 DPI)")
    print(f"🔗 Target URL: {target_url}")
    print("==================================================")

    # 1. Standalone QR Code
    qr_path = "qr_NewKapilShoes.png"
    qr_img = generate_qr(target_url, qr_path)

    # 2. A4 Poster (2480 x 3508 px at 300 DPI)
    poster_a4_path = "poster_A4_NewKapilShoes.png"
    render_poster(qr_img, 2480, 3508, poster_a4_path, is_a4=True)

    # 3. A5 Standee Poster (1748 x 2480 px at 300 DPI)
    poster_a5_path = "poster_A5_NewKapilShoes.png"
    render_poster(qr_img, 1748, 2480, poster_a5_path, is_a4=False)

    print("\n✅ All high-resolution posters successfully generated!")

if __name__ == "__main__":
    main()

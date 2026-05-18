"""
Flowfiy 30-second promotional video assembler.
Combines screenshots with Ken Burns effects, text overlays, and voiceover.
Output: flowfiy_ad_30s.mp4 (1920x1080)
"""

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from moviepy import (
    VideoClip, AudioFileClip, CompositeVideoClip,
    concatenate_videoclips, ImageClip
)

# ── Config ──────────────────────────────────────────────────────────────────
BASE   = r"E:\CodeX Developemt\AI_Sales_outbound_system\ad-video"
SHOTS  = os.path.join(BASE, "screenshots")
AUDIO  = os.path.join(BASE, "voiceover.mp3")
OUT    = os.path.join(BASE, "flowfiy_ad_30s.mp4")
W, H   = 1920, 1080
FPS    = 24

# ── Scene definitions ────────────────────────────────────────────────────────
# Each scene: (filename, duration_sec, label, sublabel, zoom_start, zoom_end, pan_x, pan_y)
# zoom > 1 means zoom in; pan_x/pan_y are fractional offsets (0 = centre)
SCENES = [
    # file                  dur  label                          sub                           z_s   z_e   px    py
    ("01_hero.jpg",         4.5, "Flowfiy",                    "AI-Powered B2B Outreach",    1.08, 1.00, 0.0,  0.0),
    ("02_stats.jpg",        3.0, "Real Results",               "$0 per lead · Claude AI",    1.00, 1.06, 0.0, -0.03),
    ("03_pipeline.jpg",     3.5, "5 AI Agents",                "Research · Score · Write",   1.05, 1.00, 0.0,  0.0),
    ("04_features.jpg",     3.0, "Built for Agencies",         "Multi-tenant workspaces",    1.00, 1.05, 0.0,  0.02),
    ("05_pricing.jpg",      3.0, "Start Free",                 "No credit card required",    1.06, 1.00, 0.0,  0.0),
    ("06_usecase_hero.jpg", 3.0, "Find Your ICP",              "Apollo + Claude AI",         1.00, 1.05, 0.0, -0.02),
    ("07_pipeline_steps.jpg",3.0,"Qualify Every Lead",         "0–100 AI scoring",           1.05, 1.00, 0.0,  0.0),
    ("08_cold_email.jpg",   3.0, "Personalized at Scale",      "Claude writes every email",  1.00, 1.06, 0.0,  0.02),
    ("09_about_stats.jpg",  3.5, "Smarter Outreach",           "Start free at flowfiy.com",  1.05, 1.00, 0.0,  0.0),
]

TOTAL_DUR = sum(s[1] for s in SCENES)
print(f"Total duration: {TOTAL_DUR:.1f}s | Scenes: {len(SCENES)}")

# ── Helpers ──────────────────────────────────────────────────────────────────

def load_and_fit(path: str) -> np.ndarray:
    """Load image, fit/crop to 1920x1080 with dark overlay."""
    img = Image.open(path).convert("RGB")
    # Scale to fill 1920x1080 (cover mode)
    r = max(W / img.width, H / img.height)
    nw, nh = int(img.width * r), int(img.height * r)
    img = img.resize((nw, nh), Image.LANCZOS)
    # Centre crop
    x0 = (nw - W) // 2
    y0 = (nh - H) // 2
    img = img.crop((x0, y0, x0 + W, y0 + H))
    # Dark vignette overlay for text readability
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    # Gradient from bottom
    for i in range(H):
        alpha = int(160 * (i / H) ** 1.4)
        draw.line([(0, i), (W, i)], fill=(0, 0, 0, alpha))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay).convert("RGB")
    return np.array(img)


def make_text_overlay(label: str, sublabel: str) -> np.ndarray:
    """Create transparent RGBA overlay with text."""
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Try to use a nice font, fall back to default
    try:
        font_main = ImageFont.truetype("arial.ttf", 72)
        font_sub  = ImageFont.truetype("arial.ttf", 36)
    except:
        try:
            font_main = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 72)
            font_sub  = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 36)
        except:
            font_main = ImageFont.load_default()
            font_sub  = font_main

    # Accent bar
    bar_y = H - 200
    draw.rectangle([(120, bar_y - 4), (120 + 6, bar_y + 90)], fill=(139, 92, 246, 230))  # violet

    # Main label
    draw.text((140, bar_y), label, font=font_main, fill=(255, 255, 255, 245))

    # Sub label
    draw.text((142, bar_y + 82), sublabel, font=font_sub, fill=(180, 180, 210, 210))

    # Top-left brand dot
    draw.ellipse([(40, 40), (56, 56)], fill=(139, 92, 246, 200))

    return np.array(overlay)


def ken_burns_frame(base_img: np.ndarray, text_overlay: np.ndarray,
                    t: float, duration: float,
                    zoom_start: float, zoom_end: float,
                    pan_x: float, pan_y: float) -> np.ndarray:
    """Generate a single frame with Ken Burns zoom/pan effect."""
    progress = t / max(duration - 0.001, 0.001)
    zoom = zoom_start + (zoom_end - zoom_start) * progress

    # Crop a zoomed region from centre
    crop_w = int(W / zoom)
    crop_h = int(H / zoom)
    cx = W // 2 + int(pan_x * W * progress)
    cy = H // 2 + int(pan_y * H * progress)

    x0 = max(0, min(cx - crop_w // 2, W - crop_w))
    y0 = max(0, min(cy - crop_h // 2, H - crop_h))
    x1 = x0 + crop_w
    y1 = y0 + crop_h

    # Crop and resize back to full resolution
    cropped = Image.fromarray(base_img[y0:y1, x0:x1])
    frame = np.array(cropped.resize((W, H), Image.BILINEAR))

    # Blend text overlay (RGBA) on top
    txt_img  = Image.fromarray(text_overlay)   # already RGBA ndarray
    base_pil = Image.fromarray(frame).convert("RGBA")

    # Fade in text in first 0.5s, fade out in last 0.5s
    alpha_mult = min(1.0, min(t / 0.5, (duration - t) / 0.5))
    if alpha_mult < 1.0:
        r, g, b, a = txt_img.split()
        a = a.point(lambda x: int(x * alpha_mult))
        txt_img = Image.merge("RGBA", (r, g, b, a))

    composited = Image.alpha_composite(base_pil, txt_img).convert("RGB")
    return np.array(composited)


# ── Build clips ──────────────────────────────────────────────────────────────
print("Building video clips...")
clips = []

for (fname, dur, label, sub, zs, ze, px, py) in SCENES:
    path = os.path.join(SHOTS, fname)
    if not os.path.exists(path):
        print(f"  MISSING: {fname} — skipping")
        continue

    base_img     = load_and_fit(path)
    text_overlay = make_text_overlay(label, sub)

    # Capture loop vars
    _base = base_img
    _txt  = text_overlay
    _dur  = dur
    _zs, _ze, _px, _py = zs, ze, px, py

    def make_frame(t, b=_base, tx=_txt, d=_dur, zs=_zs, ze=_ze, px=_px, py=_py):
        return ken_burns_frame(b, tx, t, d, zs, ze, px, py)

    clip = VideoClip(make_frame, duration=dur)
    clips.append(clip)
    print(f"  [OK] {fname} ({dur}s)")

# ── Concatenate and add audio ─────────────────────────────────────────────────
print("\nConcatenating clips...")
video = concatenate_videoclips(clips, method="compose")

print("Loading voiceover...")
audio = AudioFileClip(AUDIO)
# Trim or pad audio to match video duration
if audio.duration > TOTAL_DUR:
    audio = audio.subclipped(0, TOTAL_DUR)

video = video.with_audio(audio)

# ── Export ────────────────────────────────────────────────────────────────────
print(f"\nExporting to: {OUT}")
print(f"Resolution: {W}x{H} @ {FPS}fps | Duration: {TOTAL_DUR:.1f}s")
video.write_videofile(
    OUT,
    fps=FPS,
    codec="libx264",
    audio_codec="aac",
    preset="medium",
    ffmpeg_params=["-crf", "20"],
    logger="bar",
)
print(f"\nDone! Video saved to:\n   {OUT}")

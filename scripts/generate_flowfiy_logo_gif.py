from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "favicon-512x512.png"
OUTPUT = ROOT / "public" / "flowfiy-logo-animated.gif"

SCALE = 2
SIZE = 512
CANVAS = SIZE * SCALE
FPS = 24
DURATION_SECONDS = 3
FRAMES = FPS * DURATION_SECONDS


def ease_in_out(value: float) -> float:
    return 0.5 - 0.5 * math.cos(math.pi * max(0.0, min(1.0, value)))


def threshold(channel: Image.Image, minimum: int) -> Image.Image:
    return channel.point(lambda pixel: 255 if pixel > minimum else 0)


def scaled(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    factor = CANVAS / 44
    return [(x * factor, y * factor) for x, y in points]


def clip_to_alpha(layer: Image.Image, mask: Image.Image) -> Image.Image:
    layer_alpha = layer.getchannel("A")
    layer.putalpha(ImageChops.multiply(layer_alpha, mask))
    return layer


def make_masks(source: Image.Image) -> tuple[Image.Image, Image.Image, Image.Image]:
    r, g, b, a = source.split()
    white_mask = ImageChops.multiply(
        ImageChops.multiply(threshold(r, 236), threshold(g, 236)),
        ImageChops.multiply(threshold(b, 236), threshold(a, 0)),
    )

    prism_mask = Image.new("L", source.size, 0)
    draw = ImageDraw.Draw(prism_mask)
    draw.polygon(scaled([(23, 22), (32, 18), (32, 26)]), fill=230)
    prism_mask = prism_mask.filter(ImageFilter.GaussianBlur(0.35 * SCALE))

    mark_mask = ImageChops.lighter(white_mask, prism_mask)
    return white_mask, prism_mask, mark_mask


def draw_soft_orbit(frame: Image.Image, icon_alpha: Image.Image, t: float) -> None:
    orbit = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(orbit)

    angle = 2 * math.pi * t
    cx = CANVAS * (0.50 + 0.27 * math.cos(angle))
    cy = CANVAS * (0.42 + 0.17 * math.sin(angle))
    radius = CANVAS * 0.34
    pulse = 0.5 + 0.5 * math.cos(2 * math.pi * t)

    draw.ellipse(
        (cx - radius, cy - radius, cx + radius, cy + radius),
        fill=(255, 255, 255, int(34 + 16 * pulse)),
    )
    orbit = orbit.filter(ImageFilter.GaussianBlur(48 * SCALE))
    frame.alpha_composite(clip_to_alpha(orbit, icon_alpha))


def draw_prism_beam(frame: Image.Image, icon_alpha: Image.Image, t: float) -> None:
    beam = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(beam)

    beat = 0.5 + 0.5 * math.sin(2 * math.pi * t - 0.55)
    alpha = int(32 + 58 * beat)
    draw.polygon(
        [
            (CANVAS * 0.535, CANVAS * 0.50),
            (CANVAS * 0.925, CANVAS * 0.335),
            (CANVAS * 0.925, CANVAS * 0.665),
        ],
        fill=(224, 214, 255, alpha),
    )
    draw.line(
        [(CANVAS * 0.545, CANVAS * 0.50), (CANVAS * 0.88, CANVAS * 0.39)],
        fill=(255, 255, 255, int(alpha * 0.34)),
        width=2 * SCALE,
    )
    draw.line(
        [(CANVAS * 0.545, CANVAS * 0.50), (CANVAS * 0.88, CANVAS * 0.61)],
        fill=(255, 255, 255, int(alpha * 0.22)),
        width=2 * SCALE,
    )
    beam = beam.filter(ImageFilter.GaussianBlur(1.4 * SCALE))
    frame.alpha_composite(clip_to_alpha(beam, icon_alpha))


def draw_data_flow(frame: Image.Image, icon_alpha: Image.Image, t: float) -> None:
    flow = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(flow)

    for index in range(13):
        phase = (t * 1.55 + index / 13) % 1
        fade = math.sin(math.pi * phase)
        if phase < 0.68:
            p = phase / 0.68
            x = CANVAS * (0.315 + 0.235 * p)
            y = CANVAS * (0.50 + 0.012 * math.sin(index * 1.8 + t * math.tau))
        else:
            p = (phase - 0.68) / 0.32
            x = CANVAS * (0.55 + 0.24 * p)
            y = CANVAS * (0.50 + (p - 0.5) * 0.12)

        radius = (2.2 + 2.1 * fade) * SCALE
        opacity = int(36 + 112 * fade)
        color = (255, 255, 255, opacity) if index % 3 else (207, 196, 255, opacity)
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)

    flow = flow.filter(ImageFilter.GaussianBlur(0.25 * SCALE))
    frame.alpha_composite(clip_to_alpha(flow, icon_alpha))


def draw_mark_sheen(frame: Image.Image, mark_mask: Image.Image, t: float) -> None:
    sheen = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(sheen)

    travel = ease_in_out(t)
    x = -CANVAS * 0.36 + travel * CANVAS * 1.72
    width = CANVAS * 0.07
    draw.polygon(
        [
            (x - width, -CANVAS * 0.10),
            (x + width, -CANVAS * 0.10),
            (x + width + CANVAS * 0.34, CANVAS * 1.10),
            (x - width + CANVAS * 0.34, CANVAS * 1.10),
        ],
        fill=(255, 255, 255, 104),
    )
    sheen = sheen.filter(ImageFilter.GaussianBlur(2.2 * SCALE))
    frame.alpha_composite(clip_to_alpha(sheen, mark_mask))


def draw_border_glow(frame: Image.Image, icon_alpha: Image.Image, t: float) -> None:
    glow = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    edge = icon_alpha.filter(ImageFilter.GaussianBlur(9 * SCALE))
    edge = ImageChops.subtract(edge, icon_alpha.filter(ImageFilter.GaussianBlur(1 * SCALE)))
    strength = int(60 + 34 * (0.5 + 0.5 * math.sin(2 * math.pi * t + 0.8)))

    color = Image.new("RGBA", frame.size, (181, 158, 255, strength))
    color.putalpha(edge.point(lambda pixel: min(pixel, strength)))
    glow.alpha_composite(color)
    frame.alpha_composite(glow)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source logo: {SOURCE}")

    source = Image.open(SOURCE).convert("RGBA").resize((CANVAS, CANVAS), Image.Resampling.LANCZOS)
    icon_alpha = source.getchannel("A")
    _, prism_mask, mark_mask = make_masks(source)
    glow_mask = icon_alpha.filter(ImageFilter.GaussianBlur(2 * SCALE))

    rendered: list[Image.Image] = []
    for frame_index in range(FRAMES):
        t = frame_index / FRAMES

        frame = Image.new("RGBA", source.size, (0, 0, 0, 0))
        draw_border_glow(frame, glow_mask, t)
        frame.alpha_composite(source)

        draw_soft_orbit(frame, icon_alpha, t)
        draw_prism_beam(frame, icon_alpha, t)
        draw_data_flow(frame, icon_alpha, t)
        draw_mark_sheen(frame, ImageChops.lighter(mark_mask, prism_mask), t)

        final = frame.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        rendered.append(final)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    rendered[0].save(
        OUTPUT,
        save_all=True,
        append_images=rendered[1:],
        duration=round(1000 / FPS),
        loop=0,
        disposal=2,
        optimize=True,
    )

    print(f"Wrote {OUTPUT}")
    print(f"Frames: {FRAMES}, duration: {DURATION_SECONDS}s, size: {SIZE}x{SIZE}")


if __name__ == "__main__":
    main()

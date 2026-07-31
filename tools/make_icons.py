"""Generate the PWA icons from one vector-ish drawing, so the set never drifts."""

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "web" / "public" / "icons"
BONE = (245, 243, 236)
LEAF = (47, 158, 100)
DEEP = (28, 107, 69)
INK = (20, 24, 26)


def draw(size: int, maskable: bool) -> Image.Image:
    img = Image.new("RGBA", (size, size), (*BONE, 255))
    d = ImageDraw.Draw(img)
    pad = size * (0.19 if maskable else 0.1)
    s = size - pad * 2

    # leaf body
    d.ellipse(
        [pad + s * 0.06, pad + s * 0.02, pad + s * 0.92, pad + s * 0.78],
        fill=(*LEAF, 255),
    )
    d.polygon(
        [
            (pad + s * 0.06, pad + s * 0.78),
            (pad + s * 0.5, pad + s * 0.02),
            (pad + s * 0.06, pad + s * 0.02),
        ],
        fill=(*BONE, 255),
    )
    # midrib
    d.line(
        [(pad + s * 0.12, pad + s * 0.86), (pad + s * 0.8, pad + s * 0.12)],
        fill=(*INK, 190),
        width=max(2, int(size * 0.035)),
    )
    # lens
    r = s * 0.19
    cx, cy = pad + s * 0.74, pad + s * 0.74
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(*DEEP, 255), width=max(2, int(size * 0.045)))
    d.line(
        [(cx + r * 0.72, cy + r * 0.72), (cx + r * 1.5, cy + r * 1.5)],
        fill=(*DEEP, 255),
        width=max(2, int(size * 0.05)),
    )
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    draw(192, False).save(OUT / "icon-192.png")
    draw(512, False).save(OUT / "icon-512.png")
    draw(512, True).save(OUT / "maskable-512.png")
    draw(180, False).save(OUT / "apple-touch-icon.png")
    print(f"wrote icons to {OUT}")


if __name__ == "__main__":
    main()

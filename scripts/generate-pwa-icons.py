"""Generate simple PWA PNG icons (stdlib only). Run: python scripts/generate-pwa-icons.py"""
from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "icons"


def png_chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def write_png(path: Path, width: int, height: int, pixel) -> None:
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width):
            r, g, b = pixel(x, y)
            raw.extend((r, g, b))
    compressed = zlib.compress(bytes(raw), 9)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    sig = b"\x89PNG\r\n\x1a\n"
    data = sig + png_chunk(b"IHDR", ihdr) + png_chunk(b"IDAT", compressed) + png_chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def bg_gradient(x: int, y: int, w: int, h: int) -> tuple[int, int, int]:
    t = (x / max(w - 1, 1) + y / max(h - 1, 1)) * 0.5
    r = int(15 + (37 - 15) * t)
    g = int(23 + (99 - 23) * t)
    b = int(42 + (168 - 42) * t)
    return r, g, b


def base_motif(x: int, y: int, w: int, h: int) -> tuple[int, int, int]:
    """Gradient + accent ring (no large white blob)."""
    cx, cy = w / 2, h / 2
    d = math.hypot(x - cx, y - cy)
    max_r = math.hypot(w / 2, h / 2)
    dn = d / max(max_r, 1e-6)
    r, g, b = bg_gradient(x, y, w, h)
    if 0.78 <= dn <= 0.92:
        return 74, 134, 232
    if dn < 0.22:
        return min(255, r + 40), min(255, g + 50), min(255, b + 70)
    return r, g, b


def overlay_lp(x: int, y: int, w: int, h: int) -> tuple[int, int, int] | None:
    cx, cy = w // 2, h // 2
    u = max(min(w, h) // 16, 4)
    # L
    if cx - 4 * u <= x < cx - u and cy - 2 * u <= y <= cy + 2 * u:
        return 248, 250, 252
    if cx - 4 * u <= x < cx - 3 * u + 1 and cy + u <= y <= cy + 2 * u:
        return 248, 250, 252
    # P
    if cx - u <= x <= cx + u // 2 and cy - 2 * u <= y <= cy + 2 * u:
        return 248, 250, 252
    if cx + u // 2 < x <= cx + 3 * u and cy - 2 * u <= y <= cy - u // 2:
        return 248, 250, 252
    if cx + u <= x <= cx + 3 * u and cy - u <= y <= cy + u // 2:
        return 248, 250, 252
    return None


def pixel_icon(x: int, y: int, w: int, h: int) -> tuple[int, int, int]:
    lp = overlay_lp(x, y, w, h)
    if lp:
        return lp
    return base_motif(x, y, w, h)


def pixel_maskable(x: int, y: int, w: int, h: int) -> tuple[int, int, int]:
    cx, cy = w / 2, h / 2
    dx = abs(x - cx) / (w / 2)
    dy = abs(y - cy) / (h / 2)
    if dx > 0.88 or dy > 0.88:
        return 15, 23, 42
    sx = (x - w * 0.08) / 0.84
    sy = (y - h * 0.08) / 0.84
    ix = int(max(0, min(w - 1, sx)))
    iy = int(max(0, min(h - 1, sy)))
    return pixel_icon(ix, iy, w, h)


def main() -> None:
    for name, size, maskable in (
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("maskable-192.png", 192, True),
        ("maskable-512.png", 512, True),
    ):
        fn = pixel_maskable if maskable else pixel_icon
        write_png(OUT / name, size, size, lambda x, y, s=size, f=fn: f(x, y, s, s))
        print("Wrote", OUT / name)


if __name__ == "__main__":
    main()

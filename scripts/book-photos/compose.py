"""Sets a cut-out book (transparent PNG from cutout.swift) on the storefront's paper colour.

    python3 -I compose.py <cutout.png> <output.webp>

The steps are only ones that keep the printed pixels: a gentle levels stretch
measured on the book alone, light unsharp masking, a soft shadow, a resize to
1600px on the long side. Nothing is repainted, so lettering stays as printed.
"""
import sys

import numpy
from PIL import Image, ImageChops, ImageFilter

PAPER_DEEP = (246, 239, 227)  # the `paper-deep` token in docs/DESIGN.md
LONG_SIDE = 1600
MARGIN_SHARE = 0.06  # of the long side, on every side of the book
SHADOW_BLUR_SHARE = 0.012
SHADOW_OFFSET_SHARE = 0.012
SHADOW_OPACITY = 90
LEVELS_LOW_PERCENTILE = 0.5
LEVELS_HIGH_PERCENTILE = 99.5
LEVELS_STRENGTH = 0.6  # 0 keeps the photo's own tones, 1 stretches fully
WEBP_QUALITY = 88


def stretch_levels(book: Image.Image) -> Image.Image:
    pixels = numpy.asarray(book).astype(numpy.float32)
    opaque = pixels[..., 3] > 250
    colour = pixels[..., :3]
    low, high = numpy.percentile(colour[opaque], [LEVELS_LOW_PERCENTILE, LEVELS_HIGH_PERCENTILE])
    stretched = numpy.clip((colour - low) * 255.0 / max(high - low, 1.0), 0, 255)
    pixels[..., :3] = colour + (stretched - colour) * LEVELS_STRENGTH
    return Image.fromarray(pixels.astype(numpy.uint8), 'RGBA')


def compose(source: str, destination: str) -> None:
    book = Image.open(source).convert('RGBA')
    book = book.crop(book.getchannel('A').point(lambda value: 255 if value > 8 else 0).getbbox())
    scale = LONG_SIDE * (1 - 2 * MARGIN_SHARE) / max(book.size)
    book = book.resize((round(book.width * scale), round(book.height * scale)), Image.LANCZOS)
    book = stretch_levels(book)
    rgb = book.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))
    book = Image.merge('RGBA', (*rgb.split(), book.getchannel('A')))

    margin = round(LONG_SIDE * MARGIN_SHARE)
    canvas = Image.new('RGB', (book.width + 2 * margin, book.height + 2 * margin), PAPER_DEEP)
    shadow_alpha = Image.new('L', canvas.size, 0)
    shadow_alpha.paste(book.getchannel('A'), (margin, margin + round(LONG_SIDE * SHADOW_OFFSET_SHARE)))
    shadow_alpha = shadow_alpha.filter(ImageFilter.GaussianBlur(LONG_SIDE * SHADOW_BLUR_SHARE)).point(lambda v: v * SHADOW_OPACITY // 255)
    canvas.paste(Image.new('RGB', canvas.size, (40, 28, 18)), (0, 0), shadow_alpha)
    canvas.paste(book.convert('RGB'), (margin, margin), book.getchannel('A'))
    canvas.save(destination, 'WEBP', quality=WEBP_QUALITY, method=6)


if __name__ == '__main__':
    compose(sys.argv[1], sys.argv[2])

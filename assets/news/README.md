# News flyer assets

`originals/` preserves files exactly as received. `prepared/` contains the reviewed,
upload-ready files that an editor selects in Payload Admin.

Do not copy these files into `public/` or `media/` by hand. A news image is a Payload Media
record: Admin copies the prepared asset to local `media/` in development, or uploads it to the
configured S3-compatible bucket in demo and production. Payload also creates its configured
thumbnail, card, and full image variants.

The first flyer was prepared without cropping or resizing:

```sh
ffmpeg -autorotate \
  -i assets/news/originals/machzor-hamelech-hamishpat-2026-09-06.jpeg \
  -map_metadata -1 -frames:v 1 -c:v libwebp -preset picture \
  -quality 82 -compression_level 6 -pix_fmt yuv420p \
  assets/news/prepared/machzor-hamelech-hamishpat-2026-09-06.webp
```

The prepared WebP remains 800×1131. Its 156,190 bytes are 24% smaller than the received
205,434-byte JPEG.

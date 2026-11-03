# Open work

Not loaded into Claude's context; read it when planning.

## Go-live blockers
- PayPal sandbox gate: no sandbox purchase run end to end yet (ILS, EUR/USD, cancel, decline, duplicate webhook, tampered webhook).
- `APP_ENV` is still `demo` on the live site; `production` needs a real non-mock payment provider first.
- Point `ramhal.com` and `www.ramhal.com` at Vercel (redirect map already live in `src/proxy.ts`), pick the canonical host, add the domain as a redirect URI on the `ramhal-admin` OAuth client, update `SERVER_URL`.
- No transactional email: Resend was intended, nothing wired; order confirmations are not sent.
- Media is served from R2 `r2.dev` (rate-limited, non-production): attach a custom domain to `ramhal-media` and set `S3_PUBLIC_URL`.
- After the next deploy: check on-demand revalidation (content page is a cache HIT, edited book title and deleted announcement show at next reload) and R2 (covers serve, `/api/diagnostics` backup age, one admin upload proves CORS, then delete retired `RAMHAL_BACKUP_S3_*` GitHub secrets).
- Owner: delete the old broad Cloudflare token `ramhal` (My Profile → API Tokens; it can create tokens and nothing uses it any more), keep `Cloudflare Agent Token` only if you know what it is for, delete the Neon `testing` branch, empty the Neon media and backup buckets.
- The audio archive will not fit R2's 10 GB free tier; decide where MP3s live before that phase.

## Store
- Pay-by-phone / "call me back" is not an order type (the client uses it daily on the legacy site).
- Donations record nothing (outbound PayPal link only).

## Admin and content
- Colours (`Books.colors`) are built but the admin swatch picker (`SwatchField`) has only been type-checked and built, not clicked through in `/admin`. The two white/brown Yom Kippur machzor books (19, 20) are still separate books; merge them into one book with two colours if the client wants.
- The sample PDF opens in the browser's own viewer; a nicer in-page reader needs a `GET` rule in `infrastructure/r2/media-bucket-cors.json` (it allows only `PUT`).
- Photos from the second shoot matching no catalogue book: French "La métaphysique de l'unité chez le Ramhal" (IMG_2928), "L'essence de la Torah" (2921, 2923), French "La voie des justes" (2924, 2925), "The Ramchal Letters" (2926, 2927), גילוי היחוד (2940, 2941), קיצור הכוונות עם ביאור איבי האילן (2904–2906), בדי האילן (2943). Each needs a book or the owner saying which one. Upload one per process (several Media creates in one process lose all but the first from R2, cause unknown).
- Uploaded photos are not resized in the browser (originals up to 10 MB stored).
- Orders list opens on "all orders", not "paid, not yet posted".
- Homepage hero lacks the books-shelf photo (`public/home/books-shelf-original.jpg` was never committed); upload to Media, add a SiteSettings field, restore the strip in `src/app/(frontend)/[locale]/page.tsx`.
- Course lesson counts are typed by hand (YouTube Data API `playlistItems` could supply them).
- Press archive is curated in code; Q&A page is a static prototype (needs a localized collection plus Hebrew full-text search).
- Catalogue data gaps need a fresh count from the live dashboard (missing descriptions, prices, covers).

## Catalogue
- `bookLanguage` still offers `he-fr` and `aramaic-fr`, which match no storefront language filter.
- Bibliographic fields (creator, place, publisher, extent, endorsements) are filled for one book only.
- New genre categories (קבלה, מוסר, …) are the client's choice.

## Infra
- Older `scripts/one-off/` scripts predate `SKIP_STOREFRONT_REVALIDATION` and throw if rerun.
- `upsertBook`'s existing-`importKey` lookup had one unconfirmed miss; verify before trusting `import:books` for a full rebuild.
- Preview deployments cannot sign in (OAuth redirect is registered for the production origin only).

## Client questions
- Confirm legacy articles and essays stay unmigrated.
- Is English built out properly or kept minimal? Is the video/audio archive in this phase?
- Israeli payment vendor, and instalments (תשלומים)?
- Outstanding product data: prices, covers, publication dates, new categories.

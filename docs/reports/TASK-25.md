# TASK-25 — Donation page

## What was built

- Added a trilingual donation page at `/donate`, `/en/donate`, and `/fr/donate`, with localized
  metadata and an editorial layout built around the institute's publishing, learning, and outreach.
- Featured the supplied photograph of Rabbi Mordechai Chriqui as the page's principal visual. The
  original is retained under `assets/donate/`; an FFmpeg-optimised 1600 × 1068 WebP is served from
  `public/donate/`.
- Added a distinct donation call to action to the desktop navigation and an always-visible mobile
  header action beside the cart, plus a standard donation link in the footer. On phones the mobile
  action is a compact heart icon with an accessible label; from `sm` upwards it expands to show the
  localized label.
  The desktop navigation switches in at `xl` so longer French and English labels never feel crowded.
- Added optional `PAYPAL_DONATION_URL` configuration. With no verified URL configured, the page
  shows an explicit disabled placeholder; a valid HTTPS `paypal.com` or `paypal.me` URL turns it
  into the external donation action on an `APP_ENV=production` deployment. Development and demo
  builds keep the placeholder because those environments promise that no money changes hands.
- Added a tested locale-aware donation route helper and tested PayPal URL validation.

## What was verified and how

- `npx next typegen` and `npx tsc --noEmit`: clean.
- `npm run lint`: zero errors; 22 pre-existing warnings in generated migration files.
- `npm test`: 33 files and 231 tests passed.
- Follow-up verification against the current application: 44 files and 306 tests passed after the
  scraper's already-required `cheerio` test dependency was declared by the concurrent homepage task.
- `APP_ENV=development npm run build`: production build passed; all three donation variants were
  statically generated.
- Raw-control and physical-direction grep gates: clean.
- FFprobe confirmed the delivered WebP is 1600 × 1068, YUV 4:2:0; file size fell from 232 KB to
  120 KB.
- Browser QA covered Hebrew RTL and English/French LTR at desktop, 390 × 844 phone, and 700px tablet
  widths; the full page; the distinct desktop action; the icon-only and labelled mobile-header
  treatments; the simplified navigation sheet; and the disabled PayPal placeholder. No horizontal
  overflow or direction errors were observed.
- Pushed commit `dde7eeb` to `origin/main`; Vercel promoted the production build. `/donate`,
  `/en/donate`, and `/fr/donate` each return HTTP 200 with their localized page content. The live
  WebP returns `image/webp` and its SHA-256 matches the committed asset exactly.

## What felt wrong

- The final donation URL is not yet known. Publishing an active generic PayPal link would imply a
  valid payment path where none has been verified, so the production-safe placeholder is deliberately
  non-clickable.

## What is still open

- Add the institute's verified hosted donation URL as `PAYPAL_DONATION_URL` to the real
  `APP_ENV=production` deployment and redeploy. The URL must use HTTPS on `paypal.com` or
  `paypal.me`.

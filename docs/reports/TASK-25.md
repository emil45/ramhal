# TASK-25 — Donation page

## What was built

- Added a trilingual donation page at `/donate`, `/en/donate`, and `/fr/donate`, with localized
  metadata and an editorial layout built around the institute's publishing, learning, and outreach.
- Featured the supplied photograph of Rabbi Mordechai Chriqui as the page's principal visual. The
  original is retained under `assets/donate/`; an FFmpeg-optimised 1600 × 1068 WebP is served from
  `public/donate/`.
- Added a distinct donation call to action to the desktop navigation and the mobile navigation
  sheet, plus a standard donation link in the footer. The desktop navigation now switches to its
  mobile treatment below `xl` so the additional item does not crowd longer French and English labels.
- Added optional `PAYPAL_DONATION_URL` configuration. With no verified URL configured, the page
  shows an explicit disabled placeholder; a valid HTTPS `paypal.com` or `paypal.me` URL turns it
  into the external donation action after the next deployment.
- Added a tested locale-aware donation route helper and tested PayPal URL validation.

## What was verified and how

- `npx next typegen` and `npx tsc --noEmit`: clean.
- `npm run lint`: zero errors; 22 pre-existing warnings in generated migration files.
- `npm test`: 33 files and 231 tests passed.
- `APP_ENV=development npm run build`: production build passed; all three donation variants were
  statically generated.
- Raw-control and physical-direction grep gates: clean.
- FFprobe confirmed the delivered WebP is 1600 × 1068, YUV 4:2:0; file size fell from 232 KB to
  120 KB.
- Browser QA covered Hebrew RTL and English LTR at desktop and 390 × 844 mobile widths, the full
  page, the distinct desktop donation action, the mobile-sheet treatment, and the disabled PayPal
  placeholder. No horizontal overflow or direction errors were observed.

## What felt wrong

- The final donation URL is not yet known. Publishing an active generic PayPal link would imply a
  valid payment path where none has been verified, so the production-safe placeholder is deliberately
  non-clickable.

## What is still open

- Add the institute's verified hosted donation URL as `PAYPAL_DONATION_URL` in Vercel and redeploy.
  The URL must use HTTPS on `paypal.com` or `paypal.me`.

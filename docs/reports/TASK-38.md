# TASK-38 — Integrate press coverage into the Rabbi Chriqui page

## What was built

- Moved the five press links into a localized `#press` section between the biography and filmed
  interview on the Rabbi Chriqui page.
- Kept one featured article and four supporting shadcn cards, without adding another hero image.
- Removed Press from desktop, mobile, and footer navigation.
- Replaced the standalone press page with localized permanent redirects to the new section.

## What was verified and how

- Visually checked Hebrew at desktop and 390px mobile width, and English/French at 390px. The
  direction changes correctly, Hebrew headlines remain RTL, and there is no horizontal overflow.
- Confirmed the existing video section's markup and classes were not changed; it remains the same
  large 16:9 presentation beneath the press section.
- Confirmed `/press`, `/en/press`, and `/fr/press` return 308 redirects to the matching localized
  Rabbi page with `#press`.
- `npx tsc --noEmit`, `npx eslint`, `npx vitest run`, and `npm run build` passed. ESLint retains 30
  pre-existing generated-migration warnings and no errors.
- Storefront native-control and physical-direction utility greps returned no violations.

## What felt wrong

- The press and video sections both use warm paper backgrounds. Their shared border keeps the
  transition legible without altering the interview treatment the client explicitly wanted kept.

## What is still open

- Nothing for this integration. A Payload-managed press collection remains an optional future
  enhancement if the archive grows substantially.

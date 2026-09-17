# TASK-01 — Payload setup and content model

Brief: `docs/tasks/TASK-01-payload-setup.md`. Reconstructed from commit history
(`e9287b2`..`af6ca0d`), not memory.

## What was built

- Next.js 16 app scaffolded with Tailwind CSS 4 and shadcn/ui, boilerplate stripped.
- Project docs (`DECISIONS.md`, `PROJECT_CONTEXT.md`), Payload dependencies, and the legacy-site
  scraper (`scripts/scrape`) brought in; engineering standards written into `CLAUDE.md`.
- Vitest and Payload's CLI scripts added; app split into a `(frontend)` route group and a
  `(payload)` route group per Payload 3's standard Next.js integration. Admin UI locale set to
  Hebrew only (one Hebrew-speaking admin persona); content locales (`he`/`en`/`fr`) configured
  separately.
- Pure library functions under `lib/`: `calculateShipping` (zone lookup with default-zone
  fallback, tiered pricing, free-shipping threshold) and `slugify` (Hebrew/French/Latin-safe,
  strips niqqud), both with unit tests.
- Full content model defined: collections `users`, `media`, `books`, `categories`, `series`,
  `lessons`, `articles`, `pages`, `announcements`, `events`; globals `schedule`,
  `shippingSettings`, `siteSettings` — per the brief's §4–5, including keeping `bookLanguage`
  separate from Payload's content locale.
- Node pinned to 22.23.2 and `tsx` to 4.21.0 via npm override, working around
  `payloadcms/payload#16949` (tsx 4.22.4+ breaks `migrate:create`/`generate:types` on Node
  ≥23.5.0).

## What was verified and how

- `calculateShipping` tests cover below a tier, at a tier boundary, at/above the free threshold,
  and an unrecognised country falling back to the default zone — matching the brief's Definition
  of Done item 6.
- The Node/tsx pin was confirmed to remove that specific variable but **not** to fully unblock
  the CLI in this dependency graph — the remaining cause was tracked into the next task rather
  than assumed fixed.

## What felt wrong

- Payload's CLI tooling (`migrate:create`, `generate:types`) did not work cleanly against this
  exact dependency graph (Payload 3.89 + Next 16.3.4) even after the Node/tsx pin — carried
  forward and resolved in the migration-workaround task rather than inside this one.

## What is still open

- The two items the brief flagged as **OPEN** — `shippingUnits` for multi-volume sets, and
  whether a fourth locale is actually foreseen — are not resolved by any commit in this range;
  no record found of them being answered later. Flagging rather than guessing.
- Whether the Hebrew admin is "genuinely usable" (the brief's requested screenshot/gate) is not
  answerable from the commit history — no screenshot or note survives in this range.

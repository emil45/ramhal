# TASK-42 — One home for images: content in Media, brand in public/, no assets/

(Renumbered from the brief's TASK-41 — that number was already in use by uncommitted, in-progress
social-links work. Confirmed unused before starting.)

## What was built

- `Pages` extended with ten typed content blocks (sectionHeading, richText, quote, labeledList,
  imageFigure, gallery, statGrid, featureCards, tagList, video) plus eyebrow/lead/heroImage/
  location/metaDescription fields — the smallest set that expresses all three narrative pages,
  each block mapped 1:1 onto a shape that repeats across them. `SiteSettings.donatePhoto` for the
  one photo `/donate` needed editable.
- `/ramhal`, `/rabbi-chriqui`, `/beit-ramhal` rewritten to fetch their Payload document
  (`src/lib/pagesData.ts`) and render its blocks through view components in
  `src/components/storefront/blocks/`, reproducing today's exact Tailwind/shadcn markup per block
  type. `groupPageSections` groups the flat block array into heading+body sections, reused by
  `/ramhal`'s table-of-contents build (`src/lib/tableOfContents.ts`) and by the other two pages'
  section extraction.
- `RichText.tsx` now wraps Payload's own Lexical→JSX converter (bold/italic/links/lists) instead
  of a hand-rolled paragraph-only renderer.
- `scripts/one-off/TASK-42-narrative-page-images.mjs`: uploads every photo into Media (raw
  `assets/beit-ramhal/*.jpeg` and `assets/donate/*.jpg` originals, matched to their public/ webp
  by eye — see the script for the pairing — since filenames didn't correspond; `public/`
  webp otherwise for rabbi-chriqui, which has no raw original) with real per-locale alt text, then
  creates the three Pages documents and sets `SiteSettings.donatePhoto`.
- Repo cleanup: `public/beit-ramhal`, `public/rabbi-chriqui`, `public/donate` deleted (grep
  confirms no remaining reference); `scripts/prepare-book-covers.mjs` and
  `scripts/import-prepared-covers.mjs` deleted along with the `import:prepared-covers` npm script
  (nothing else referenced either).
- Homepage's masthead photo, previously a second copy of the beit-ramhal study-hall image, now
  reads the same Payload image `/beit-ramhal` uses, so there's only one copy of it.
- `docs/DECISIONS.md` §16 records the rule; README gets an "Images" section.

## An unplanned, permanent architecture change made mid-task

Verification hit a **Neon project-wide network transfer allowance exhaustion** (not a per-branch
compute limit — confirmed via a direct `psql` connection refused with the same "quota exceeded"
message on every branch, and via the Neon console's "Limit reached" banner). At Emanuel's explicit
instruction, this became a permanent change, not a workaround: **the separate `development` Neon
branch is retired.** Local work, builds and (once credentials are updated) deploys now run
directly against `production`. This included deleting
`src/lib/exitUnlessDevelopmentDatabaseIsSafe.ts`, the boot-time guard whose entire purpose was to
refuse starting local dev against production's own database. `docs/DECISIONS.md` §5, README, and
`.env.example` updated to match. The `testing` branch and its own guard
(`refuseProductionDatabase.ts`) are unaffected.

## What was verified and how

- `npx tsc --noEmit`: clean.
- `npm run lint`: 0 errors (46 warnings, all pre-existing generated-migration `payload`/`req`
  unused-var warnings, same pattern as every prior migration file).
- `npx vitest run --exclude "**/*.integration.test.ts"`: 316/316 unit tests pass (44 files),
  including new tests for `groupPageSections` and `buildTableOfContents`.
- Migrations applied cleanly and the one-off script ran successfully against the (now-retired)
  development database before it was decommissioned: `next build` statically generated all three
  pages in he/en/fr with real content, and manual browser verification of `/ramhal` (desktop,
  Hebrew) confirmed every block renders correctly — hero, sticky TOC, all five quote-block
  variants, the ordinal grid, the concluding band with inline bold — matching the original design.
- `/rabbi-chriqui` and `/beit-ramhal` visual verification was interrupted mid-check by the Neon
  outage (an image request 500'd because the local server's Payload instance could no longer
  reach any database) — **not verified**, see below.
- `grep -rn "beit-ramhal/\|rabbi-chriqui/\|/donate/" src/`: clean (excluding the PayPal URL
  false-positive in `donation.test.ts`).

## What felt wrong

- Payload's `createMigration` hit an interactive rename-detection prompt (no TTY in the
  route-handler process it runs in) when a migration both added `eyebrow` and removed `body` in
  the same call — it appeared to hang for minutes before something resolved it. Splitting into
  two migrations (add, then a separate drop) avoided the prompt entirely; worth remembering for
  any future Pages/collection field rename-adjacent change.
  Also filed as product feedback (the 5-minute silent hang before a plain "refused unattended" or
  similar would have saved real time).
- `next dev`/`next start`/`migrate:create` each spawn their own server on port 3000, and killing
  one cleanly needs `lsof -ti :3000 | xargs kill`, not just `kill %1` — several of my early runs
  bound to the wrong stale process because of this, producing confusing 404s that looked like data
  bugs before I traced them back.
- Found mid-task, not caused by this task: `docs/RECOVERY.md`'s one-off-script procedure and this
  script's own `EXPECTED_DATABASES` guard assumed a `development` branch would keep existing
  indefinitely — that assumption broke this session.

## What is still open

- **Production has not been migrated or populated.** The four schema migrations and the content
  script have only run against the (now-retired) development branch. Once the Neon transfer quota
  clears: run `npm run db:migrate` and the one-off script against production, per the updated
  (branch-free) procedure in `docs/RECOVERY.md`.
- **`/rabbi-chriqui` and `/beit-ramhal` visual verification is incomplete** — interrupted by the
  Neon outage before checking images, mobile widths, or French. Re-run once DB access is
  restored, before or right after the production migration.
- **`assets/` is not yet deleted** — it's still the production upload source for this script and
  must survive until that run succeeds. Delete it (and `assets/.DS_Store`, adding `.DS_Store` to
  `.gitignore`) only after production is confirmed working.
- **`media/`'s stray local files are untouched** — deferred pending the local-storage/S3 question
  that comes with running everything against production now (see `docs/BACKLOG.md`).
- **Repo size before/after** not measured — blocked on the `assets/` deletion above.
- **Live verification** (live URL, `/api/diagnostics`, an admin caption edit) not done — needs
  production populated first.
- **The homepage's `public/home/books-shelf-original.jpg`** is a known gap, out of this task's
  scope, tracked in `docs/BACKLOG.md`.
- Pushed to `origin/main` at Emanuel's explicit instruction, ahead of production being migrated —
  Vercel's `deploy:build` will attempt the production migration on deploy and may itself fail on
  the same Neon quota until it clears; re-check the deploy and, once it succeeds, run the content
  script and finish visual verification.

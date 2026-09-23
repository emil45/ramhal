# TASK-35 — Structured bibliographic metadata for “מחול לצדיקים”

## Context

The Hebrew description for **מחול לצדיקים (בדברי תכלית הבריאה)** starts with a
compact bibliographic record (creator, publication place, co-publishers, year,
extent and recommendation credits), then continues with a substantive review.
It also ends with a legacy sentence sending the reader to `ramhal.com` to buy the
book, even though the reader is already on the book's own purchase page.

The useful bibliographic facts should be editable as book metadata in the admin
and rendered as metadata on the storefront. They should not be buried in the
free-text description.

## In scope

- Add optional, localized book fields for creator credit, publication place,
  publisher name, extent, and recommendation/endorsement credits.
- Fix the display-title hook if it prevents those localized fields from being
  saved, with a regression test that exercises the real Local API.
- Group those fields clearly in the book admin form and explain what belongs in
  each field in Hebrew.
- Render non-empty fields in the existing book metadata list. Keep the current
  localized “Machon Ramhal” publisher value as the fallback for books without an
  explicit publisher name.
- For the book whose canonical slug is
  `מחול-לצדיקים-בדברי-תכלית-הבריאה`:
  - move the subtitle and bibliographic facts out of the description and into
    structured fields;
  - keep the substantive author profile and review unchanged;
  - remove the trailing legacy sales sentence.
- Record the one-time editorial update in `scripts/one-off/` and run it once on
  development and once on the deployed database after the schema migration is
  live.

## Out of scope

- Rewriting or fact-checking the supplied review.
- Bulk-extracting metadata from every legacy description.
- Merging or deleting the separate shorter catalogue record titled
  `מחול לצדיקים`; that needs an edition/identity decision of its own.

## Acceptance

- The admin exposes the new fields under a clear bibliographic-details section.
- The Hebrew storefront page shows the structured facts once, outside the
  description.
- The description begins with the author profile, retains the full substantive
  review, and contains neither the opening bibliographic run nor the obsolete
  sales sentence.
- TypeScript, ESLint, Vitest and `next build` pass; the migration applies to the
  development database; the live page is verified after deploy.
- `docs/reports/TASK-34.md` records what changed, verification, concerns and open
  work.

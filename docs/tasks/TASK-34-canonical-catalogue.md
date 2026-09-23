# TASK-34 — Make the Hebrew-domain legacy catalogue canonical

Raised directly by Emanuel after finding the extra `דרך ה׳` book on the deployed storefront.
The five category pages he supplied are the catalogue source of truth:

- the three pages of `ספרים בעברית` on `www.ramhal.com`
- `ספרים באנגלית` on `www.ramhal.com`
- `ספרים בצרפתית` on `www.ramhal.com`

The separate `frramhal.com` and `enramhal.com` storefronts are not independent sources for books
that do not appear on those five pages. Their listings may enrich a matching canonical book with
translations, prices and redirect URLs, but must not create an additional book.

## Work

1. Crawl the five supplied pages from the live legacy site, respecting its `Crawl-delay: 5`, and
   compare every listing by exact legacy URL with the production `books` collection.
2. Prove the survivor set before deleting anything: every supplied legacy listing maps to exactly
   one production book; no production-only candidate is referenced by an order, cart or series;
   and no candidate owns media that would be orphaned.
3. Delete only the proven production-only books through a committed one-off script under
   `scripts/one-off/`. The script must encode and re-check the audited identities and invariants,
   aborting rather than adapting if production changed between audit and execution.
4. Change the importer so a future from-scratch import cannot recreate books that have no
   `ramhal.com` listing. Keep cross-site translations, prices and redirect URLs when they belong
   to a book that does have a canonical listing.
5. Remove importer overrides that become dead under the canonical-source rule, and test the rule.
6. Verify the final production catalogue through the live URL: 62 books, with the 62 exact legacy
   URLs represented once each and none extra. Record the decision and write `docs/reports/TASK-34.md`.

## Gate

Run `tsc --noEmit`, ESLint, Vitest and `next build` before committing. Work directly on `main` and
push `origin/main`. Preserve unrelated working-tree changes by staging only TASK-34 files.

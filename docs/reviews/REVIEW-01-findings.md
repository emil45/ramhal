# Review 01 — whole codebase

Reviewer: Codex · Date: 2026-09-17 · Commit: 09f004b

## Summary

This does not yet read as one careful person's codebase: the collection definitions are consistent, but migration and import tooling follow different rules. Seeding overwrites editorial changes while importing protects them; reconciliation flags uncertainty while importing guesses; application helpers fail loudly while scraper stages discard failures. Those behavioral inconsistencies matter much more than formatting differences and prevent a newcomer from safely predicting how the system works. The architecture is understandable in the CMS layer, but the migration pipeline needs the same shared rules, explicit contracts, and behavioral tests already used for shipping.

## Defects

### 1. P1 — Every startup overwrites administrator changes

**Locations:** `src/payload.config.ts:40`, `src/seed.ts:45`, `src/seed.ts:50`, `src/seed.ts:87`.

Startup unconditionally restores category titles, shipping rates, and the timetable. A restart silently erases the son's edits. The comment at `src/seed.ts:106` calling this always safe is false: repeated writes of defaults are not safe after someone edits the records. Compare `src/importBooks.ts:216`, which explicitly protects precisely that work.

**Instead:** initialize missing records once and make subsequent changes explicit data migrations. Test that running initialization after an administrator edits settings preserves those edits.

### 2. P1 — The migration command cannot bootstrap an empty database

**Locations:** `src/app/(payload)/api/dev-migrate/route.ts:108`, `src/payload.config.ts:40`.

`getPayload()` executes `onInit`, which queries `categories`, before reaching `db.migrate()`. The runner disables schema auto-push, so those tables do not exist on a fresh database. Payload's installed migration CLI explicitly uses `disableOnInit: true`; this workaround omits it. The documentation's claim of successful empty-database provisioning does not describe the current initialization sequence.

**Instead:** initialize migrations without application startup hooks, then seed after migration. Verify this sequence against an empty disposable database.

### 3. P1 — Money validation bypasses the constraints beside it

**Locations:** `src/lib/validateIntegerAmount.ts:7`, `src/collections/Books.ts:103`, `src/globals/ShippingSettings.ts:67`, `src/lib/validateIntegerAmount.test.ts:14`.

Payload uses custom validation instead of its default number validator. Consequently, `min: 0` does not reject negative amounts: `validateIntegerAmount(-100)` returns `true`. Missing values also pass this validator; the test's claim that requiredness is handled elsewhere misunderstands the framework. The database's NOT NULL constraints are not a substitute for field validation, and its numeric columns allow negative prices.

**Instead:** compose Payload's number validation with the integer rule. Test the configured field's negative, missing, fractional, and valid cases rather than testing only the isolated integer predicate.

### 4. P1 — The committed schema no longer matches Books

**Locations:** `src/collections/Books.ts:202`, `src/migrations/index.ts:3`.

`needsReview`, `reviewReasons`, `reviewNote`, and `importKey` have no migration. The sole migration and its snapshot contain none of them. Development auto-push conceals this; a database provisioned from committed migrations cannot support the current collection.

**Instead:** commit the corresponding schema migration and verify provisioning through migrations alone.

### 5. P2 — Migration and import runners can call an unrelated existing server

**Locations:** `scripts/dev-migrate.mjs:27`, `scripts/import-books.mjs:17`.

Both scripts spawn Next but send privileged requests to fixed port 3000 without establishing that the spawned process owns it. An already-running development server can receive the operation without the migration runner's `PAYLOAD_MIGRATING` setting. Child startup failure is not checked before requests begin.

**Instead:** bind a dedicated loopback port explicitly, verify child readiness, and fail immediately on child exit.

### 6. P2 — A partially imported book cannot recover on rerun

**Locations:** `src/importBooks.ts:238`, `src/importBooks.ts:258`, `src/importBooks.ts:274`.

Creation commits before the other locale writes. If a later write fails, the next run finds `importKey` and updates only URLs, permanently skipping missing translations. A recording fake reproduced this: after a simulated locale-write failure, the retry reported `unchanged` without retrying the failed locale.

**Instead:** make each book's multilingual import transactional, or explicitly track incomplete imports without overwriting later editorial changes.

### 7. P2 — “Not Hebrew” becomes “English,” corrupting French catalogue metadata

**Locations:** `src/importBooks.ts:136`, `src/importBooks.ts:201`.

Without a recognized language category, every Latin-script title becomes English; the guessed language can then assign the English-books category. Passing the existing reconciliation through a recording fake classified titles such as *La voix des justes* and *L'essence de la Torah* as English. Existing review reasons do not explain that the language was guessed.

**Instead:** preserve uncertainty and require a reviewed language mapping. Script detection cannot distinguish French from English.

### 8. P2 — The parser silently drops prose surrounding inline spans

**Location:** `scripts/scrape/parse.mjs:65`.

`blocksOf()` excludes a paragraph whenever it contains a descendant matching its selector, including `span`. For a paragraph containing opening text, a span, and closing text, only the span survives. A direct fixture reproduced the loss. Avoiding duplicate extraction has introduced content loss.

**Instead:** extract text nodes exactly once while preserving paragraph boundaries. Test mixed inline markup and nested legacy tables with fixtures.

### 9. P2 — Ambiguous clusters can attach one book's data to another title

**Locations:** `scripts/scrape/reconcile.mjs:175`, `src/importBooks.ts:339`.

A fuzzy cluster can contain multiple books from one site, but `bySite` retains only the last. The importer iterates all members and retrieves each member's data by site alone. Two titles can therefore receive the same description, price, and URLs. A three-member fixture reproduced the collision; the current cached clusters do not contain one.

**Instead:** retain each member's entry, keyed by both site and stable identity.

### 10. P2 — Scraper failures become apparently successful, incomplete output

**Locations:** `scripts/scrape/parse.mjs:252`, `scripts/scrape/parse.mjs:264`, `scripts/scrape/reconcile.mjs:74`.

Malformed index rows disappear, unreadable cached pages are skipped, and malformed reconciliation inputs are reported as missing files and replaced with empty catalogues. Contrast `requireEnv()` and the migration import patch, which correctly fail loudly. A successful command exit does not establish that all available content was processed.

**Instead:** distinguish expected absence from corruption and permission errors. Fail incomplete runs or produce an explicit rejected-record report that blocks import.

### 11. P2 — Reconciliation and importing maintain conflicting versions of the same business rules

**Locations:** `scripts/scrape/reconcile.mjs:225`, `scripts/scrape/reconcile.mjs:279`, `src/importBooks.ts:63`, `src/importBooks.ts:188`, `src/app/(payload)/api/dev-import/route.ts:39`.

Category mappings appear in seeding, reconciliation, and importing. Reconciliation flags category disagreement; importing omits that reason and picks the first category. Its handwritten input type omits the flag too, and `JSON.parse()` is assigned that type without validation. Unlike shipping's pure, tested `lib/` function, these rules are embedded in large orchestration files with no tests. The configured `src/payload-types.ts` is also absent, so Payload calls use fallback types instead of the project's generated schema types.

**Instead:** share pure mapping and review functions, validate the JSON boundary, and restore generated Payload types. Keep orchestration responsible for reading, writing, and reporting; keep classification and review decisions in independently testable functions.

### 12. P2 — Imported historical books receive fabricated publication dates

**Locations:** `src/importBooks.ts:249`, `src/collections/Books.ts:154`.

Every imported book gets the current timestamp, while the schema explicitly defines that field as the basis for “new books.” Import order becomes publication order, making historical stock appear newly published.

**Instead:** distinguish import time from publication time and represent unknown publication dates honestly.

### 13. P2 — The newcomer's entry point gives the wrong setup instructions

**Locations:** `README.md:5`, `package.json:14`, `scripts/scrape/README.md:49`.

The root README is untouched scaffold documentation: no database, secrets, migration sequence, admin bootstrap, or explanation of known-broken CLI commands. It names the wrong page path. The scraper README describes two phases, omitting reconciliation and import. Detailed rationale exists elsewhere, but a newcomer cannot follow the root instructions to a working installation.

**Instead:** provide one tested setup and operations runbook, link the detailed rationale from it, and document the complete extraction-to-import sequence.

## Preferences

- **Formatting consistency:** generated frontend scaffolding and configuration use different quoting and semicolon conventions from handwritten CMS code, for example `src/app/(frontend)/layout.tsx:1` versus `src/payload.config.ts:1`. Standardizing formatting would help future contributions, but this is not a functional defect and matters much less than the behavioral inconsistencies above.

## What is good

- Collection definitions are generally consistent in structure and naming. The small framework wrappers delegate appropriately instead of embedding business logic.
- `src/lib/shipping.ts` is a readable pure function with behavioral tests. `src/lib/currency.ts` and `src/collections/hooks/generateSlugFromTitle.ts` demonstrate appropriate sharing of rules.
- `src/lib/env.ts` fails clearly on missing configuration. The migration import replacement at `src/app/(payload)/api/dev-migrate/route.ts:88` checks its expected input and throws on template changes rather than silently continuing.
- The production guards in `dev-migrate` and `dev-import` reject requests before initializing Payload, independently of the proxy. No production authorization bypass was found by source inspection. Payload's default also disables the GraphQL playground in production.
- Most existing tests assert behavior rather than implementation. The main testing weakness is missing coverage of the consequential migration and import workflows, not a need to rewrite every existing test.
- The decisions document and many code comments explain real constraints and why workarounds exist. Keep that practice, while correcting claims that no longer match the code.

Review scope and verification: all application and script source, tests, configuration, migrations, and project documentation were reviewed, including the importer that was initially uncommitted. All 30 tests and TypeScript passed; lint reported four unused-parameter warnings in the generated migration. Isolated reproductions used fixtures and recording fakes without database writes. The application and migrations were not run against the configured database; production access conclusions are from source inspection, not a deployed-build test.

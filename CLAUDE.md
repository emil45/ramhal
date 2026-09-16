@AGENTS.md

# Ramhal — project orientation

Rebuild of the web presence of מכון רמח״ל (Machon Ramhal / Institut Ramhal), the publishing and
teaching institute founded by Rabbi Mordechai Chriqui, dedicated to the writings of the Ramhal
(Rabbi Moshe Chaim Luzzatto, 1707–1746).

**Read these before doing anything substantive:**

- `docs/PROJECT_CONTEXT.md` — what the institute is, what exists today across the three legacy
  sites, the full content inventory, the audiences, the constraints, the open unknowns, and a
  glossary of the Hebrew and French terms used throughout. Contains **no decisions**.
- `docs/DECISIONS.md` — the architecture and approach, with the reasoning, and what was verified
  empirically rather than assumed.
- `docs/ramhal_site_inventory.xlsx` — the raw audit: 164 product listings, 49 content pages, the
  French parsha tree, media assets, 16 migration risks.

**Non-negotiables that are easy to get wrong:**

- **Hebrew is the default language at the root** (`/`), with `/en` and `/fr` prefixed. Build
  **RTL-first** using logical properties (`margin-inline-start`, never `margin-left`) so the LTR
  locales fall out of it. Do not retrofit RTL.
- **One catalogue, one content model, three languages.** The legacy setup cloned the whole site per
  currency. That is the bug being fixed — do not reintroduce it.
- **The Rav does not use the system.** His son does all administration. One admin persona.
- Migrating legacy content: hyphens in the old URLs are encoded as `%2D`, not `-`. Decoding them
  produces URLs that 404. See the migration risks sheet before writing any scraper.

## Engineering standards

This codebase will be handed to a human developer who has never seen it. That is the
primary quality bar — above cleverness, above speed. These rules are binding on every
future session.

**Architecture**

- Business logic lives in pure functions under `lib/`, independent of Next.js and Payload,
  and testable without booting either.
- Framework code (routes, components, Payload config) calls that logic. It does not
  contain it.
- One responsibility per file. If a file needs "and" to describe it, split it.
- No abstraction until there are three real cases. No copy-paste either — extract on the
  third occurrence, not the first.

**Types**

- No `any`. No `as` casts to silence the compiler. If a type is hard, model the data
  better.
- Types derive from the Payload schema where possible rather than being hand-written twice.

**Naming and comments**

- Full words. `shippingUnits`, not `shipUnits`. No abbreviations a newcomer must decode.
- Comments explain WHY a non-obvious decision was made. Never what the code does.
- Delete a comment rather than let it go stale.

**What not to do** — the specific failure modes of AI-written code, and what makes a
codebase unhandoverable:

- Files that each follow a different pattern because each was written in isolation. Match
  the conventions already in the repo. Consistency beats individual elegance.
- try/catch that swallows an error and continues. Handle it or let it throw.
- Dead code, commented-out code, unused imports, unused parameters, leftover console.log.
- Multiple utility modules that do overlapping things.
- Re-implementing something the framework already provides.
- Magic numbers and inline string literals for anything meaningful. Name them.

**Testing**

- Anything with rules gets tests: shipping calculation, currency handling, locale
  fallback, slug generation. Not UI.
- Tests describe behaviour, not implementation.

**Commits**

- Small, single-purpose, conventional commits. A reviewer should be able to read the log
  and understand what happened without reading diffs.

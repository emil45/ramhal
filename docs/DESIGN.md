# Design system

How the storefront looks, and why it stays consistent. The reference is a well-made printed
sefer, not a product launch: warm paper, one ink, brass rules, serif titles. Palette and
direction are settled, sampled from the institute's own 40th-anniversary logo file — this file
records how they are applied.

Tokens live in `src/app/(frontend)/globals.css`. Components live in `src/components/ui/`
(shadcn, base-nova style, built on Base UI) and `src/components/storefront/` (ours).

## Colour

| Token | Value | Used for |
|---|---|---|
| `teal` | `#00707C` | Actions (buttons, links), active state, the primary rule colour |
| `teal-deep` | `#004F58` | Headings, prices, cover ink, the demo banner |
| `gold` | `#B08D42` | **Rules and ornaments only**: heading underlines, the footer rule, cover frames, the cart count |
| `gold-ink` | gold darkened along its own hue | The only gold allowed as small text (imprint, "since 1986") — plain gold is 3:1 on paper |
| `paper` | warm near-white | Page ground |
| `paper-deep` | one step warmer | Cover ground, the filter bar, masthead, quiet wells |
| `destructive` | shadcn red | Errors and declined payments — the one colour outside the logo palette, kept because an error must not look like a brand colour |

**Teal versus gold.** Teal is what you can *do* or what is *important*: click it, read it first.
Gold is what *decorates*: it frames, underlines, separates. Nothing gold is clickable, and no
button is gold.

**Forbidden** (three earlier attempts went there and were rejected): dark hero sections,
gradients as decoration, glass or blur, large rounded cards with soft shadows, anything that
reads as a SaaS landing page. New hues are not introduced; derive from the four tokens above.

## Type

David Libre (serif) for titles, Assistant (sans) for interface and running text. Both have
Hebrew, Latin and extended-Latin coverage, so the same pairing works cleanly in all three locales.
They are self-hosted by `next/font`, with no browser request to Google. Defined as
utilities in `globals.css`; use them, never ad-hoc `text-2xl font-serif`.

| Utility | Size | Weight | Line-height | Use |
|---|---|---|---|---|
| `type-display` | 40 → 64px | 500 | 1.2 | The front-page masthead, once |
| `type-title` | 30 → 40px | 500 | 1.3 | A page's `<h1>` |
| `type-heading` | 22 → 28px | 500 | 1.35 | A section's `<h2>`, a form fieldset legend |
| `type-subheading` | 18px | 500 | 1.5 | A card or book title, a summary heading |
| body | 16px (`text-base`) | — | 1.65 | Running text, form controls |
| `type-prose` | inherits size | — | 1.75 | The Ramhal article body, other long-form page content |
| small | 14px, 15px below `sm` (`text-sm`) | — | inherits | Interface text, metadata |
| caption | 12px (`text-xs`) | — | inherits | Footnotes, shipping notes |

All four heading utilities are weight 500, never 700: David Libre's bold closes the counters
in ע, ם and ס, and Hebrew hierarchy is carried by size, not weight. Letter-spacing stays at 0 on
Hebrew headings — Hebrew is not tracked.

Prices are `font-semibold tabular-nums text-teal-deep`. shadcn components set their own
title size, so on `CardTitle`, `EmptyTitle` and `FieldLegend` write the utility with a trailing
`!` (`type-subheading!`).

The cover system (below) sets its title and imprint in the sans, not the serif — David Libre is
too light-boned at the 9–13px covers actually render at.

## Spacing and layout

Tailwind's 4px scale. In practice only these steps are used:

- **Page container**: `page-container` — `max-w-6xl`, gutters 16 / 24 / 32px.
- **Section**: `py-12` between sections on a page, `py-10` for a page's top.
- **Grid**: `gap-x-4 gap-y-10` for book grids (2 / 3 / 5 columns; 6 on the front-page strip).
- **Inside a card or form**: `gap-3`–`gap-5`; fieldsets `gap-5`; a form's groups `gap-10`.
- **Radius**: `0.25rem` (`--radius`). Everything derives from it. Covers use `2px`.

**Logical properties only** — `ms-`, `ps-`, `start-`, `text-start`, never `ml-` / `left-`. Hebrew
is the default and RTL comes first; the LTR locales fall out of it. An icon that points a
direction (a back arrow) is flipped with `rtl:rotate-180`.

## Section and page headings

`SectionHeading` is the only way to head a section or page: the title over a hairline with a
short gold segment at its start, like a printer's rule under a chapter title. `as="h1"` for a
page's title.

## The cover system

Most books have no photograph, so the typeset cover **is** the catalogue's identity.
Code: `src/lib/cover.ts` (rules, tested), `CoverFrame`, `TypographicCover`, `CoverImage`.

Anatomy, outside in:

1. **Paper** — one warm tone (`paper-deep`) for every cover. Never a tint per category: that
   produces a wall of swatches.
2. **Outer rule**, thick (1cqw), then a **thinner inner rule** (0.4cqw), set in from the edge,
   as on a sefer's title page. **This rule colour is the only thing that says which shelf a
   book is on**: teal (Hebrew), gold (French), deep teal (English), dark gold (siddurim — the
   one case where the category overrides the language; see docs/DECISIONS.md §13).
3. **Title** in Assistant, balanced, optically centred in the upper two-thirds, size
   stepping down by title length (`coverTitleWidthPercent`), clamped at four lines.
4. **Short gold rule and the imprint** *מכון רמח״ל* in small type at the foot. The imprint is
   hidden on a cover narrower than 7rem, where it would be illegible.
5. **Ratio** locked at 2:3 (`AspectRatio`), so every card in a grid is the same height.

Everything is sized in `cqw` (container-query width) so a cart thumbnail is a true miniature of
the cover on the book page. A **real photograph** sits inside the same frame, `object-contain`
on the same paper — supplied covers range from portrait jackets to wrap-around spreads and
cropping to 2:3 would cut the title. A shelf of mixed real and typeset covers reads as one system.

## Cards and rows

A catalogue card is a cover, a two-line title with the height **reserved** even when the title
is one line, and a price row pushed to the bottom of a card that stretches to the row's height —
so every price in a row shares a baseline. An unpurchasable book shows a muted `Badge` in the
price slot, not a sentence. Hover lifts the cover 4px and underlines the title in gold.

## Catalogue browsing

The full catalogue is small enough to load once (~62 books in production) and filter instantly,
but too long to present as one uninterrupted wall. Search, category, language and sort therefore
stay client-side, while the visible result is paged at 20 books: four complete rows on desktop,
ten on mobile. Changing a filter resets to page one; changing page returns the viewport to the
result range. Missing prices always sort after priced books instead of pretending to be zero.

The range line says what is visible (`1–20 of 100`) rather than only repeating the total. Cards
show one quiet metadata value: category when known, otherwise the known book language. The
literal “unknown” value is an editorial flag, not useful storefront copy, and is not displayed.

The category filter only renders when the catalogue's books use at least two distinct categories
— a dropdown offering one real choice (or none) isn't a filter. It reappears by itself the moment
a second category is in use; see docs/DECISIONS.md §13.

## Language navigation

Three locales do not need a large navigation block. Desktop uses one compact native-language
menu; mobile places the same choices in the navigation sheet. Flags are decorative scanning
cues only—the visible native name and explicit accessible label carry the meaning. Changing
language intentionally returns to that locale's home page until equivalent-page routing can be
resolved from localized content rather than guessed from URLs.

## No native controls

**No raw `<input>`, `<select>` or `<button>` in `src/components/storefront/` or under
`src/app/(frontend)/`.** Use `Input`, `NativeSelect`, `Checkbox`, `Field` / `FieldLabel`,
`Button` (`buttonVariants` on a `Link` for a link that looks like a button). This is checked
by `grep -rn "<input\|<select\|<button" src/components/storefront "src/app/(frontend)"`, which
must print nothing.

- Catalogue filters use `NativeSelect`, not a Radix/Base UI select: five options, native mobile
  behaviour is better, and it needs no portal.
- Every field has a **visible** label (`FieldLabel` wired by `htmlFor`).
- shadcn is initialised with `"rtl": true` in `components.json`, so generated components use
  logical properties. Popups (the mobile nav `Sheet`) read the reading direction from
  `DirectionProvider` in the locale layout, fed from `LOCALE_CONFIG`.

## The demo banner

When `APP_ENV=demo`, `DemoBanner` renders above the header on every page: deep teal, gold
underline, sticky, **no close control** — it cannot be scrolled away or dismissed. Nothing
else in the design system is allowed to look like it. It reads `APP_ENV`, which is fixed at
build time for prerendered pages, so `APP_ENV` must be set for `next build` too; the server
refuses to start under an `APP_ENV` different from the one it was built with.

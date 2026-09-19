# TASK-10 — make it look finished

(Numbering note: `TASK-10-book-cover-assets.md` was also numbered 10. This brief's report is
`docs/reports/TASK-10-visual-design.md`, so the earlier `docs/reports/TASK-10.md` is left intact.)

Subject: how the site looks. Not correctness, not features. The site reads as a prototype:
native form controls, covers that look like failed image loads, ragged rows, a front page that
is 40% empty. The palette is fixed (teal `#00707C`, deep teal `#004F58`, gold `#B08D42`, warm
paper) — no new hues.

**Forbidden** (three previous attempts went there and were rejected): dark hero sections,
gradient-as-decoration, glassmorphism, oversized rounded cards with big soft shadows, anything
that reads as a SaaS landing page. The reference is a well-made printed book.

1. **shadcn, properly.** Add and use `input label field native-select badge card separator sheet
   skeleton empty aspect-ratio direction`. `direction` wraps the app, fed from `LOCALE_CONFIG`,
   verified by opening something in Hebrew. Catalogue filters use `native-select`, not Radix.
   Delete the dead `--chart-*` and `--sidebar-*` tokens. Standing rule: no raw `<input>`,
   `<select>`, `<button>` in `src/components/storefront/` or `src/app/(frontend)/` — in AGENTS.md.
2. **Cover system.** One warm paper tone for all covers; category is the rule colour and nothing
   else. Inset double rule, title in Frank Ruhl Libre optically centred in the upper portion,
   `text-wrap: balance`, size by length, four lines then ellipsis; short rule and the institute
   mark below; locked 2:3. Real photographs get the same frame. Find and fix the real cover that
   renders as a broken image.
3. **Card and grid.** Title clamped to two lines with height reserved so prices share a
   baseline; clear hierarchy (title, then price with weight); a hover more than a tint;
   unpurchasable books get a muted `badge`.
4. **Filter bar.** One aligned group with `field` + `input` + `native-select`, visible labels,
   the result count attached; `empty` for no results, `skeleton` while filtering.
5. **Header, footer, front page.** Header: cart icon with item count, `sheet` for mobile nav,
   ספרים as the primary action. Footer: real contact details from the `siteSettings` global.
   Front page: a masthead with presence, a strip of six books from the catalogue (plainly
   labelled, always populated), the schedule left as is, no dead white space above the footer.
6. **`docs/DESIGN.md`**: type scale, spacing scale, teal versus gold, cover anatomy, the
   no-native-controls rule.
7. **Checkout screens** (form, mock payment, confirmation, decline) brought into the same system.
8. **Done when:** the grep in item 1 prints nothing; no `--chart-*` / `--sidebar-*`; every price
   in a catalogue row on one baseline with mixed one- and two-line titles; no broken images;
   Radix/Base UI components open and position correctly in RTL, verified in a browser; no dead
   region taller than a third of a viewport on the front page; `docs/DESIGN.md` exists; full
   gate before each commit; screenshots (front, catalogue, book, cart, checkout × desktop and
   414px × Hebrew and French) in the report.

## Addendum — APP_ENV and the demo banner

TASK-09's mock-payment guard keys on `NODE_ENV`, which is the wrong variable: a deployed demo
is `NODE_ENV=production` and cannot start. Introduce `APP_ENV = development | demo | production`,
separate from `NODE_ENV`, documented in `.env.example`. Mock payment is permitted in
`development` and `demo`, refused in `production` with the same hard `exit(1)` and message.
`NODE_ENV` no longer gates it. When `APP_ENV` is `demo`, every page carries a permanent,
unmissable banner saying this is a demonstration and no real payment is taken — part of the
design system, impossible to miss or dismiss. Not an override flag: an environment name is
something a person has to mean.

## Added during the task

Remove all CDs/DVDs from the catalogue and delete them totally (user, mid-task). See
`docs/DECISIONS.md` §18.

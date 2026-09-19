# TASK-10 (visual design) — make it look finished

Filename note: `TASK-10-book-cover-assets` was already numbered 10 and owns `docs/reports/TASK-10.md`.
This report is `TASK-10-visual-design.md` so that one is left intact; the brief is
`docs/tasks/TASK-10-visual-design.md`.

Screenshots: `docs/reports/TASK-10-visual-design/` — front page, catalogue, book, cart, checkout,
at desktop (`*-desktop-*`, 1440px) and 414px (`*-414-*`), in Hebrew (`he-`) and French (`fr-`).
Also the mock-payment, declined and confirmed screens, both mobile nav sheets (open, one in RTL,
one in LTR) and the demo banner scrolled.

## What was built

- **shadcn, adopted.** `input label field native-select checkbox badge card separator sheet
  skeleton empty aspect-ratio direction` added and used (checkbox is extra: the pickup box was a
  raw `<input>`). `components.json` now has `"rtl": true` so generated classes are logical.
  `DirectionProvider` wraps the app, fed from `LOCALE_CONFIG`. Catalogue filters and the checkout
  country use `NativeSelect`. ~30 dead `--chart-*` / `--sidebar-*` variables deleted.
- **Cover system.** One paper tone; thick-over-thin double rule whose colour is the only category
  signal; Frank Ruhl title balanced in the upper part, sized by length (tested), four lines then
  ellipsis; short rule and imprint; locked 2:3; container-query units so miniatures are faithful.
  Scanned covers get the same frame. Rules in `src/lib/cover.ts`.
- **Cards / grid / filter bar.** Two-line title height reserved, price pushed to the row bottom,
  weighted price, hover lifts the cover and gilds the title, muted `Badge` for unpurchasable.
  Filter bar is one labelled group with the count attached; `Empty` and `Skeleton` states.
- **Header / footer / front page.** Cart icon with count (fetched client-side so pages stay
  cacheable), Sheet nav on mobile, ספרים as the primary button. Footer has address, phone and email
  from `siteSettings` (seeded — see below). Front page: masthead with logo, display-type name,
  tagline, two buttons; a six-book strip ("from the catalogue", or "new books" once dates exist);
  schedule structure untouched. No dead region above the footer.
- **Checkout screens** (form, mock payment, confirmed, declined) use the same Field, Input,
  NativeSelect, Checkbox, Card, Button.
- **`docs/DESIGN.md`**, the no-native-controls rule and the `APP_ENV` rule in `AGENTS.md`.
- **Addendum, APP_ENV.** Required `development | demo | production`, separate from `NODE_ENV`,
  in `.env.example`. Mock payment: allowed in development/demo, refused in production with the same
  `exit(1)`. `demo` shows a sticky, undismissable `DemoBanner` on every page.
- **Beyond the brief, with reason:** the build records its `APP_ENV` and the server refuses to
  start under a different one (prerendered pages bake the banner in, so a mismatched build would
  silently show or hide it). Documented in DECISIONS §18.
- **Requested mid-task:** all CDs/DVDs removed from the catalogue (see Open / risky).

## What was verified and how

- Gate before every commit (tsc, eslint, vitest, next build), run against the staged commit with
  everything else stashed. 11 commits on `main`. Final tree: tsc clean, eslint 0 errors (the 18
  existing migration warnings), vitest 24 files / 161 tests, build passes.
- `grep -rn "<input\|<select\|<button" src/components/storefront "src/app/(frontend)"` → nothing.
  No `--chart-*`/`--sidebar-*` left. No physical-direction classes in storefront code.
- **Price baseline**: measured in the browser, one price offset per catalogue row with mixed one-
  and two-line titles (visible in the catalogue screenshots).
- **RTL**: opened the nav Sheet in Hebrew (docks to the right, close on the left, text right-aligned)
  and French (docks left); measured its rect in each. Add-to-cart updated the header count; removing
  the line restored it. Pickup checkbox submits `pickup=on` and drops the address fields.
- **Full purchase flow** in Hebrew: checkout → mock payment → declined page, then again → paid →
  confirmed page (screenshots).
- **APP_ENV on real servers**: `APP_ENV=production` + mock → exit 1 with the refusal message;
  `demo` build+run boots; a `development` build started as `demo` exits 1 saying to rebuild;
  unset `APP_ENV` exits 1.
- **Broken image.** Root cause found and fixed: `Media` had no read access, so Payload's default
  (signed-in users only) returned **403 for every one of the 7 scanned covers to any anonymous
  visitor**. A developer logged into `/admin` in the same browser sees most of them, which is why
  it looked like one broken cover. After the fix all 7 load (200, `naturalWidth > 0`).

## What felt wrong

- I could **not identify which single cover** was broken in your browser; I never reproduced a
  1-of-7 failure. The 403 is real and fixed, but if you still see one broken, tell me which book.
- **Two of the seven scanned covers are full wrap-around jackets** (*שוד מלכים*, *La métaphysique de
  l'unité*): front + spine + back in one landscape image. In a 2:3 frame they show small and
  letterboxed. Cropping would cut the title, so they are contained. They need a front-only
  derivative (the earlier TASK-10 covered originals only).
- The rendered typographic cover is good but every one is the same size and the same imprint;
  it is a system, not a design per book. That is the point, but worth a look at scale.
- The catalogue card no longer shows the subtitle (a one-line subtitle row would need reserving
  for alignment and most books have none). It is on the book page.
- The dev-server indicator circle appears in the screenshots (bottom left).

## What is still open

- **Deleted data (on your instruction):** 28 books and the `cd-dvd` category removed from the
  Neon dev database — 10 filed under the shelf, 18 more found by "CD"/"DVD"/"MP3" in the title.
  None had covers. Orders keep their own line snapshots, so past orders are unaffected. The seed no
  longer creates the category and the importer skips both (`DISCONTINUED_CATEGORY_SLUGS`,
  `isRecordedMediaTitle`). Not reversible except by re-scraping.
- **Contact details need the client's confirmation.** `siteSettings` was empty, so the footer had
  nothing to show. I seeded it (once, only if empty) from what the legacy sites publish. The Hebrew
  and French sites list *different* emails (`ramhalcom@gmail.com` vs `ramhal1@bezeqint.net`); I used
  the Hebrew site's. Opening hours are published but the global has no field for them. The book
  page previously hard-coded `info@machon-ramhal.org`, which appears nowhere in the project's
  sources — it now reads the same setting.
- **`APP_ENV` must exist in every environment**, including the `.env` of anyone building. I added
  `APP_ENV=development` to the local, uncommitted `.env`.
- Screenshots were taken in a harness page that loads the site in an iframe sized 1440 / 414px
  (the browser window would not go narrower). The Sheet's slide animation was very slow in this
  test browser (frames only render on demand); its end position is verified, its real-world
  timing is not.
- Two test orders (1177 declined, 1178 paid, mock provider) were created in the dev database while
  verifying the payment screens.
- `destructive` red remains the one non-logo colour (errors, declined payment); see DESIGN.md.
- Not done: a Payload-side way to crop covers, the Rav's photographs on the front page, real
  photography of the beit midrash. Not asked for.

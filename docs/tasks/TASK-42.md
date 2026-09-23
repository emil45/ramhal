# TASK-42 — One home for images: content in Media, brand in public/, no assets/

Renumbered from the brief's original TASK-41: that number was already in use by uncommitted,
in-progress work (`docs/tasks/TASK-41-social-links.md` and related files). Confirmed with Emanuel
before starting; TASK-42 was unused. Content below is the brief as supplied, unchanged.

## THE RULE (write it into DECISIONS as a new section, 3–4 lines)

- Every image an editor might ever change lives in the Payload Media collection (object
  storage in deployed environments). One source of truth: the database + bucket.
- `public/` holds only brand furniture that changes with a redesign: logo, favicon, the 40th
  emblem. Nothing editorial.
- The repo holds no source/original image folders. Git history keeps them.

## CURRENT STATE (verified)

- `public/`: logo.png, brand/fortieth-anniversary-emblem.png, beit-ramhal/*.webp (10),
  rabbi-chriqui/{portrait,hanukkah-lighting}.webp, donate/rabbi-chriqui-speaking.webp.
  The non-brand ones are referenced from the hardcoded pages `/beit-ramhal`, `/rabbi-chriqui`,
  `/donate` (and `/ramhal` if it uses any — it doesn't).
- `assets/` (82 files, 21 MB, tracked): book-covers/{originals,prepared,manifest,preparation},
  beit-ramhal/*.jpeg originals, news/{originals,prepared}, donate/*.jpg — inputs to one-time
  scripts (`scripts/prepare-book-covers.mjs`, `scripts/import-prepared-covers.mjs`) whose output
  is already in production Media. `assets/.DS_Store` is tracked.
- `media/` (gitignored): stray local uploads.

## 1. MAKE THE NARRATIVE PAGES EDITABLE (this is why their photos are in public/)

Move `/ramhal`, `/rabbi-chriqui`, `/beit-ramhal` into Payload (the existing Pages collection,
extended with blocks — see the approved plan for the block set). All three locales, content
copied exactly as it is today, RTL-first rendering unchanged. The routes stay the same.
The donate page photo becomes an editable image too (SiteSettings — see plan for why).
Visual result must match today's pages. Before/after screenshots at desktop and 390px,
Hebrew and French.

## 2. MOVE THE PHOTOS INTO MEDIA

Upload the page photos into Media from the BEST available source: the originals in
`assets/beit-ramhal` and `assets/donate` where they exist (Media makes its own sizes), the
`public/` webp otherwise. Every image gets real Hebrew alt text (and en/fr where the page has
those locales). Use a committed `scripts/one-off/TASK-42-*.mjs`, run on the development branch
first, then on production following `docs/RECOVERY.md`'s one-off procedure, printing the
target fingerprint before writing.

## 3. REMOVE WHAT'S LEFT

- `public/`: delete every non-brand image once no code references it.
- `assets/`: delete entirely, including `.DS_Store`; add `.DS_Store` to `.gitignore`.
- `scripts/prepare-book-covers.mjs` and `scripts/import-prepared-covers.mjs` and the
  `import:prepared-covers` npm script: delete (their job is done; git keeps them).
  Check nothing else imports them.
- `media/`: delete the stray local files. Document in README that local uploads land there
  and it is gitignored.
- `scripts/scrape/`: leave untouched (out of scope), but if it still contains image
  downloads, say how much in the report.

## 4. DOCUMENT FOR THE SON AND THE NEXT DEVELOPER

README gets a short "Images" section: where each kind of image lives, and "to change a
photo on the site, use `/admin` → Media". BACKLOG: remove the narrative-pages item; courses,
press and Q&A remain.

## VERIFY

- grep src for any remaining `/beit-ramhal/`, `/rabbi-chriqui/`, `/donate/` static paths: none.
- Live site (per AGENTS.md, via the live URL): `/beit-ramhal`, `/rabbi-chriqui`, `/ramhal`, `/donate`
  render with their photos from the bucket, in he and fr. Edit one caption in live `/admin`,
  confirm it shows on the site.
- Repo size before/after (`du -sh` of the working tree minus node_modules).
- tsc, eslint, vitest, next build. Small commits. Cannot push.

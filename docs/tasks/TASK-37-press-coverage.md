# TASK-37 — Press coverage archive

## Why

The institute has accumulated meaningful coverage across Israeli news sites, but the new site has
no permanent place for it. Homepage news is intentionally temporary and operational; press
coverage is evergreen evidence of the Rav's public teaching and the institute's reach.

## Scope

- Add a dedicated `/press` page for all three locales, linked from the desktop navigation, mobile
  navigation, and footer.
- Curate the five supplied external articles, newest first. Keep their original Hebrew headlines;
  localize the page framing, summaries, topics, metadata, and accessibility text.
- Give the newest article editorial prominence, with the remaining four in a responsive archive.
- Use the existing institute photography and the established paper, teal, and gold design system.
  Do not copy publisher-owned article images into the repository.
- Use the existing shadcn `Badge`, `Card`, `AspectRatio`, and button variants. External links open in
  a new tab and say so accessibly.
- Keep the content in a framework-independent module under `src/lib/`.

## Out of scope

- A Payload collection or admin workflow for press links.
- Copying, republishing, or scraping the full text of any external article.
- Adding the press links to the temporary homepage news stream.

## Verification

- `npx tsc --noEmit`, `npx eslint`, `npx vitest run`, and `npm run build` pass.
- Storefront control and logical-property greps return no violations.
- Check Hebrew RTL and English/French LTR layouts at desktop and 390px mobile widths.
- Confirm every external link and its title/date against the supplied source URL.
- Finish with `docs/reports/TASK-36.md`.

# TASK-25 — Donation page

User request: publish an elegant donation page even though the legacy site did not provide one,
feature the supplied photograph of Rabbi Mordechai Chriqui, and make the donation entry in the
navigation feel distinct from ordinary content links. The final PayPal donation URL is not yet
available, so the live page must present a clear, non-clickable placeholder rather than sending a
visitor to an unverified payment destination.

## Deliverables

- Add a trilingual donation page at `/donate`, `/en/donate`, and `/fr/donate` within the existing
  printed-sefer visual system.
- Explain the institute's work without making tax, allocation, or payment claims that have not been
  verified.
- Optimise the supplied photograph with FFmpeg and use it as the page's principal visual.
- Add a prominent but restrained donation treatment to desktop and mobile navigation, and include
  the page in the footer.
- Keep the future PayPal destination in one optional environment variable. Until it is configured,
  render an explicit unavailable state that cannot be mistaken for a working payment control.
- Add locale-aware metadata and a tested route helper.

## Verification

- Run TypeScript, ESLint, Vitest and `next build`.
- Run the raw-control and physical-direction grep gates from `AGENTS.md`.
- Visually inspect Hebrew RTL and English LTR at desktop and mobile widths, including both
  navigation treatments and the PayPal placeholder.
- Write `docs/reports/TASK-25.md`, commit directly to `main`, push `origin/main`, and confirm the
  production deployment serves the new routes and image.

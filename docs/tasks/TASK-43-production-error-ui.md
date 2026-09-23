# TASK-43 — Branded production error UI

## Goal

Replace Next.js's unstyled global error screen with a calm, branded storefront fallback when an
unexpected render failure reaches the root layout.

## Scope

- Add a top-level `global-error` boundary that works independently of Payload and the storefront
  layouts.
- Localize the message and home link from the current Hebrew, English, or French URL.
- Offer both retry and return-home actions without exposing server error details.
- Match the established paper, teal, gold-rule, serif-title design at desktop and mobile sizes.
- Verify it against a real production-style root-layout failure.

## Out of scope

- Resolving the current Neon quota exhaustion.
- Adding an error-reporting service.
- Changing any TASK-42 file.

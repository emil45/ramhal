# TASK-41 — Social links

## Goal

Make the institute's Facebook and YouTube accounts editable in Site Settings and expose them
consistently on the storefront.

## Scope

- Restrict social platforms to the supported Facebook and YouTube accounts and validate their
  URLs in the Payload admin.
- Render accessible, visually restrained social links in the footer for all locales.
- Read the Courses page's YouTube destination from Site Settings instead of a separate hardcoded
  account URL.
- Seed the initial social links only when an editor has not already added any.
- Add a guarded one-off script that records and applies the initial links to development and
  production data.
- Add focused tests for social-link rules and run the full required verification suite.

## Supplied accounts

- Facebook: `https://www.facebook.com/RamhalInstitute`
- YouTube: `https://www.youtube.com/user/RamhalInstit`

## Out of scope

- Embedded social feeds.
- Adding further social platforms without a real account to publish.

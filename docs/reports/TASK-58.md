# TASK-58 — Remove the mock orders before go-live

**Built:** `scripts/one-off/TASK-58-remove-mock-orders.ts`; dry run by default, refuses if any order has
a provider other than `mock`.

**Verified:** Dry run on production counted 15 orders, all mock. `--apply` deleted 15 orders, 15 payment
events, 15 mock payment sessions and 1 cart; the script's own recount shows 0 left in each. Target
identity: the unpooled host `ep-red-tree-b19ry3lo` hashes to `5f4bb4452fb2`, its pooled form to the
`2c951382a7f8` recorded in `docs/RECOVERY.md`. Not checked through the live site: the admin needs a
sign-in.

**Felt wrong:** The run command in `docs/RECOVERY.md` fails with `ERR_MODULE_NOT_FOUND` for
`payload-oauth2`; it needs `-c vitest.config.ts --options.deps.inline=payload-oauth2`. A fingerprint
taken from an unpooled string never equals the recorded pooled one.

**Open:** Fix the run command in `docs/RECOVERY.md` and record the unpooled fingerprint beside the pooled one.

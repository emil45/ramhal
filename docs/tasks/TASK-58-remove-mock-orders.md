# TASK-58 — Remove the mock orders before go-live

Every order in production was made with the mock payment provider. Orders cannot be deleted in the
admin (`delete: () => false`, deliberately), so they are removed once by a one-off script.

- `scripts/one-off/TASK-58-remove-mock-orders.ts` deletes all orders, payment events, mock payment
  sessions and carts. Dry run by default; `--apply` deletes.
- It refuses to run if any order has a provider other than `mock`.
- Run against production by Emanuel (connection string per `docs/RECOVERY.md`), dry run first,
  then `--apply`. Afterwards check the live admin shows no orders.

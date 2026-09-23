# TASK-44 — Stop the catalogue fetch from pulling the whole database per book page

Neon's network transfer allowance for the month (4.35 GB) is used up. `getCatalogueBookBySlug`
called `getCatalogueBooks` (every book at depth 1 plus every title in every locale) to render one
book, once for each of ~333 prerendered book pages per build and on every ISR regeneration.

Changes: (1) fetch one book by `urlSlug`; (2) `generateStaticParams` reads only `urlSlug`;
(3) the catalogue list selects only the fields cards read; (4) wrap data helpers in React
`cache()`; (5) sweep `src/` for other fetch-everything-then-filter patterns and report them.
Open, report only: local Postgres for local checks; whether Neon Object Storage egress counts
toward the same allowance. Neon refuses connections, so only tsc, lint and DB-free unit tests run.

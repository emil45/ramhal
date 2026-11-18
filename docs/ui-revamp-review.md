# Local design review

The `ui-revamp` branch is reviewed locally before any merge or deployment.

The worktree’s ignored `.env` uses the separate local PostgreSQL databases
`ramhal_ui_revamp` and `ramhal_ui_revamp_test`. They are sanitized copies of the
local catalogue, with the homepage migration applied. Refreshing the main
checkout’s `ramhal` databases therefore does not interrupt the review.

Run the checks and the optimized preview from this worktree:

```sh
npx tsc --noEmit
npm run lint
npm test
npm run build
npm run start -- --port 3001
```

Review at `http://localhost:3001` in Hebrew, English and French. The public
pages share the new typography, materials, navigation and controls. The
homepage’s native horizontal shelf contains eight books, starting with new
books, then the editor’s homepage choices, then the remaining selection.

The schema and type-generation helpers accept `PORT`, so they can run on
port 3002 without contacting the main checkout’s server on port 3000:

```sh
PORT=3002 npm run migrate:create -- migration_name
PORT=3002 npm run generate:types
```

The branch uses main’s `featuredOnHomepage` field and its
`20261118_200100_featured_on_homepage` migration. Its production one-off record
is `scripts/one-off/2026-11-18-featured-on-homepage.ts`; this branch adds no
second schema migration or production data script. Local review data includes
the requested five selections. Merge and deployment still require approval.

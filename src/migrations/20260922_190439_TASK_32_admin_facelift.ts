import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Payload's migration diff compared the current field config against an out-
// of-date snapshot: `announcements`/`events`' `image`/`link` columns, their
// foreign keys and their indexes already exist in the database (confirmed
// against information_schema before touching this file) — a pre-existing
// snapshot/ledger drift unrelated to this task, not a real schema gap. Those
// statements are removed from both directions below; everything that
// remains is the real schema change: displayTitle/displayTitleLocale on
// every localized-title collection.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "books_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "books_locales" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "categories_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "series_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "articles_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "pages_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "announcements_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "events_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "books" ADD COLUMN "display_title" varchar;
  ALTER TABLE "books" ADD COLUMN "display_title_locale" varchar;
  ALTER TABLE "categories" ADD COLUMN "display_title" varchar;
  ALTER TABLE "categories" ADD COLUMN "display_title_locale" varchar;
  ALTER TABLE "series" ADD COLUMN "display_title" varchar;
  ALTER TABLE "series" ADD COLUMN "display_title_locale" varchar;
  ALTER TABLE "articles" ADD COLUMN "display_title" varchar;
  ALTER TABLE "articles" ADD COLUMN "display_title_locale" varchar;
  ALTER TABLE "pages" ADD COLUMN "display_title" varchar;
  ALTER TABLE "pages" ADD COLUMN "display_title_locale" varchar;
  ALTER TABLE "announcements" ADD COLUMN "display_title" varchar;
  ALTER TABLE "announcements" ADD COLUMN "display_title_locale" varchar;
  ALTER TABLE "events" ADD COLUMN "display_title" varchar;
  ALTER TABLE "events" ADD COLUMN "display_title_locale" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "books_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "books_locales" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "categories_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "series_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "articles_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "pages_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "announcements_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "events_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "books" DROP COLUMN "display_title";
  ALTER TABLE "books" DROP COLUMN "display_title_locale";
  ALTER TABLE "categories" DROP COLUMN "display_title";
  ALTER TABLE "categories" DROP COLUMN "display_title_locale";
  ALTER TABLE "series" DROP COLUMN "display_title";
  ALTER TABLE "series" DROP COLUMN "display_title_locale";
  ALTER TABLE "articles" DROP COLUMN "display_title";
  ALTER TABLE "articles" DROP COLUMN "display_title_locale";
  ALTER TABLE "pages" DROP COLUMN "display_title";
  ALTER TABLE "pages" DROP COLUMN "display_title_locale";
  ALTER TABLE "announcements" DROP COLUMN "display_title";
  ALTER TABLE "announcements" DROP COLUMN "display_title_locale";
  ALTER TABLE "events" DROP COLUMN "display_title";
  ALTER TABLE "events" DROP COLUMN "display_title_locale";`)
}

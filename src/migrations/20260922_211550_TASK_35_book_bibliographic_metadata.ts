import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "books_locales" ADD COLUMN "creator_credit" varchar;
  ALTER TABLE "books_locales" ADD COLUMN "publication_place" varchar;
  ALTER TABLE "books_locales" ADD COLUMN "publisher_name" varchar;
  ALTER TABLE "books_locales" ADD COLUMN "extent" varchar;
  ALTER TABLE "books_locales" ADD COLUMN "endorsement_credits" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "books_locales" DROP COLUMN "creator_credit";
  ALTER TABLE "books_locales" DROP COLUMN "publication_place";
  ALTER TABLE "books_locales" DROP COLUMN "publisher_name";
  ALTER TABLE "books_locales" DROP COLUMN "extent";
  ALTER TABLE "books_locales" DROP COLUMN "endorsement_credits";`)
}

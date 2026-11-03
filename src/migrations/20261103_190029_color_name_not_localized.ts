import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // The names already typed are kept: the Hebrew one becomes the only one.
  await db.execute(sql`
   ALTER TABLE "books_colors" ADD COLUMN "name" varchar;
  UPDATE "books_colors" SET "name" = "books_colors_locales"."name"
    FROM "books_colors_locales"
    WHERE "books_colors_locales"."_parent_id" = "books_colors"."id" AND "books_colors_locales"."_locale" = 'he';
  ALTER TABLE "books_colors" ALTER COLUMN "name" SET NOT NULL;
  DROP TABLE "books_colors_locales" CASCADE;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "books_colors_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "books_colors_locales" ADD CONSTRAINT "books_colors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books_colors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "books_colors_locales_locale_parent_id_unique" ON "books_colors_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "books_colors" DROP COLUMN "name";`)
}

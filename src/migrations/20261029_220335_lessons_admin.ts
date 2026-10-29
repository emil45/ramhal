import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "series_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"books_id" integer
  );
  
  CREATE TABLE "courses_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "courses_page_locales" (
  	"title" varchar NOT NULL,
  	"lead" varchar,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "series" ALTER COLUMN "youtube_playlist_id" SET NOT NULL;
  ALTER TABLE "series" ADD COLUMN "_order" varchar;
  ALTER TABLE "series" ADD COLUMN "first_lesson_youtube_id" varchar NOT NULL;
  ALTER TABLE "series" ADD COLUMN "lesson_count" numeric NOT NULL;
  ALTER TABLE "series_rels" ADD CONSTRAINT "series_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "series_rels" ADD CONSTRAINT "series_rels_books_fk" FOREIGN KEY ("books_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_page_locales" ADD CONSTRAINT "courses_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "series_rels_order_idx" ON "series_rels" USING btree ("order");
  CREATE INDEX "series_rels_parent_idx" ON "series_rels" USING btree ("parent_id");
  CREATE INDEX "series_rels_path_idx" ON "series_rels" USING btree ("path");
  CREATE INDEX "series_rels_books_id_idx" ON "series_rels" USING btree ("books_id");
  CREATE UNIQUE INDEX "courses_page_locales_locale_parent_id_unique" ON "courses_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "series__order_idx" ON "series" USING btree ("_order");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "series_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_page_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "series_rels" CASCADE;
  DROP TABLE "courses_page" CASCADE;
  DROP TABLE "courses_page_locales" CASCADE;
  DROP INDEX "series__order_idx";
  ALTER TABLE "series" ALTER COLUMN "youtube_playlist_id" DROP NOT NULL;
  ALTER TABLE "series" DROP COLUMN "_order";
  ALTER TABLE "series" DROP COLUMN "first_lesson_youtube_id";
  ALTER TABLE "series" DROP COLUMN "lesson_count";`)
}

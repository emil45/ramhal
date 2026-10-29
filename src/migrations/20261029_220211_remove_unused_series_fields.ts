import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "books_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "books_rels" CASCADE;
  ALTER TABLE "series" DROP CONSTRAINT "series_related_book_id_books_id_fk";
  
  DROP INDEX "series_related_book_idx";
  ALTER TABLE "series" DROP COLUMN "related_book_id";
  ALTER TABLE "series" DROP COLUMN "language";
  ALTER TABLE "series" DROP COLUMN "order";
  ALTER TABLE "series_locales" DROP COLUMN "description";
  DROP TYPE "public"."enum_series_language";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_series_language" AS ENUM('he', 'fr');
  CREATE TABLE "books_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"series_id" integer
  );
  
  ALTER TABLE "series" ADD COLUMN "related_book_id" integer;
  ALTER TABLE "series" ADD COLUMN "language" "enum_series_language" NOT NULL;
  ALTER TABLE "series" ADD COLUMN "order" numeric;
  ALTER TABLE "series_locales" ADD COLUMN "description" jsonb;
  ALTER TABLE "books_rels" ADD CONSTRAINT "books_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_rels" ADD CONSTRAINT "books_rels_series_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "books_rels_order_idx" ON "books_rels" USING btree ("order");
  CREATE INDEX "books_rels_parent_idx" ON "books_rels" USING btree ("parent_id");
  CREATE INDEX "books_rels_path_idx" ON "books_rels" USING btree ("path");
  CREATE INDEX "books_rels_series_id_idx" ON "books_rels" USING btree ("series_id");
  ALTER TABLE "series" ADD CONSTRAINT "series_related_book_id_books_id_fk" FOREIGN KEY ("related_book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "series_related_book_idx" ON "series" USING btree ("related_book_id");`)
}

import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_books_review_reasons" AS ENUM('missing-description', 'price-mismatch', 'absent-from-hebrew', 'ambiguous-match', 'language-uncertain', 'zero-price');
  ALTER TYPE "public"."enum_books_book_language" ADD VALUE 'unknown';
  CREATE TABLE "books_review_reasons" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_books_review_reasons",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "books" ALTER COLUMN "category_id" DROP NOT NULL;
  ALTER TABLE "books" ALTER COLUMN "published_at" DROP NOT NULL;
  ALTER TABLE "books" ADD COLUMN "needs_review" boolean DEFAULT false;
  ALTER TABLE "books" ADD COLUMN "review_note" varchar;
  ALTER TABLE "books" ADD COLUMN "import_key" varchar;
  ALTER TABLE "books" ADD COLUMN "imported_at" timestamp(3) with time zone;
  ALTER TABLE "books_review_reasons" ADD CONSTRAINT "books_review_reasons_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "books_review_reasons_order_idx" ON "books_review_reasons" USING btree ("order");
  CREATE INDEX "books_review_reasons_parent_idx" ON "books_review_reasons" USING btree ("parent_id");
  CREATE UNIQUE INDEX "books_import_key_idx" ON "books" USING btree ("import_key");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "books_review_reasons" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "books_review_reasons" CASCADE;
  ALTER TABLE "books" ALTER COLUMN "book_language" SET DATA TYPE text;
  DROP TYPE "public"."enum_books_book_language";
  CREATE TYPE "public"."enum_books_book_language" AS ENUM('he', 'fr', 'en', 'he-fr', 'aramaic-fr');
  ALTER TABLE "books" ALTER COLUMN "book_language" SET DATA TYPE "public"."enum_books_book_language" USING "book_language"::"public"."enum_books_book_language";
  DROP INDEX "books_import_key_idx";
  ALTER TABLE "books" ALTER COLUMN "category_id" SET NOT NULL;
  ALTER TABLE "books" ALTER COLUMN "published_at" SET NOT NULL;
  ALTER TABLE "books" DROP COLUMN "needs_review";
  ALTER TABLE "books" DROP COLUMN "review_note";
  ALTER TABLE "books" DROP COLUMN "import_key";
  ALTER TABLE "books" DROP COLUMN "imported_at";
  DROP TYPE "public"."enum_books_review_reasons";`)
}

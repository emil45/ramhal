import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "books" ADD COLUMN "preview_pdf_id" integer;
  ALTER TABLE "books" ADD CONSTRAINT "books_preview_pdf_id_media_id_fk" FOREIGN KEY ("preview_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "books_preview_pdf_idx" ON "books" USING btree ("preview_pdf_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "books" DROP CONSTRAINT "books_preview_pdf_id_media_id_fk";
  
  DROP INDEX "books_preview_pdf_idx";
  ALTER TABLE "books" DROP COLUMN "preview_pdf_id";`)
}

import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_blocks_section_heading_style" ADD VALUE 'concluding';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_section_heading" ALTER COLUMN "style" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_section_heading" ALTER COLUMN "style" SET DEFAULT 'standard'::text;
  DROP TYPE "public"."enum_pages_blocks_section_heading_style";
  CREATE TYPE "public"."enum_pages_blocks_section_heading_style" AS ENUM('standard', 'article', 'video');
  ALTER TABLE "pages_blocks_section_heading" ALTER COLUMN "style" SET DEFAULT 'standard'::"public"."enum_pages_blocks_section_heading_style";
  ALTER TABLE "pages_blocks_section_heading" ALTER COLUMN "style" SET DATA TYPE "public"."enum_pages_blocks_section_heading_style" USING "style"::"public"."enum_pages_blocks_section_heading_style";`)
}

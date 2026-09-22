import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "announcements" ADD COLUMN "image_id" integer;
  ALTER TABLE "announcements" ADD COLUMN "link_url" varchar;
  ALTER TABLE "announcements_locales" ADD COLUMN "link_label" varchar;
  ALTER TABLE "events" ADD COLUMN "image_id" integer;
  ALTER TABLE "events" ADD COLUMN "link_url" varchar;
  ALTER TABLE "events_locales" ADD COLUMN "link_label" varchar;
  ALTER TABLE "announcements" ADD CONSTRAINT "announcements_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "announcements_image_idx" ON "announcements" USING btree ("image_id");
  CREATE INDEX "events_image_idx" ON "events" USING btree ("image_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "announcements" DROP CONSTRAINT "announcements_image_id_media_id_fk";
  
  ALTER TABLE "events" DROP CONSTRAINT "events_image_id_media_id_fk";
  
  DROP INDEX "announcements_image_idx";
  DROP INDEX "events_image_idx";
  ALTER TABLE "announcements" DROP COLUMN "image_id";
  ALTER TABLE "announcements" DROP COLUMN "link_url";
  ALTER TABLE "announcements_locales" DROP COLUMN "link_label";
  ALTER TABLE "events" DROP COLUMN "image_id";
  ALTER TABLE "events" DROP COLUMN "link_url";
  ALTER TABLE "events_locales" DROP COLUMN "link_label";`)
}

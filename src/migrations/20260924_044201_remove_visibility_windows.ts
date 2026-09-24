import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "announcements" DROP COLUMN "ends_at";
  ALTER TABLE "events" DROP COLUMN "ends_at";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "announcements" ADD COLUMN "ends_at" timestamp(3) with time zone;
  ALTER TABLE "events" ADD COLUMN "ends_at" timestamp(3) with time zone;`)
}

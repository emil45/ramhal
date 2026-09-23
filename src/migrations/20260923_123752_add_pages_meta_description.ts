import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_locales" ADD COLUMN "meta_description" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_locales" DROP COLUMN "meta_description";`)
}

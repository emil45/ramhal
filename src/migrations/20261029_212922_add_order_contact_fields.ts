import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ADD COLUMN "contact_name" varchar;
  ALTER TABLE "orders" ADD COLUMN "contact_phone" varchar;
  UPDATE "orders" SET "contact_name" = "customer_name", "contact_phone" = "customer_phone";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP COLUMN "contact_name";
  ALTER TABLE "orders" DROP COLUMN "contact_phone";`)
}

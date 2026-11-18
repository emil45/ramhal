import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "books_prices" ADD COLUMN "compare_at_amount" numeric;
  ALTER TABLE "books" ADD COLUMN "from_institute" boolean DEFAULT true;
  ALTER TABLE "books" ADD COLUMN "marked_new" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "books_prices" DROP COLUMN "compare_at_amount";
  ALTER TABLE "books" DROP COLUMN "from_institute";
  ALTER TABLE "books" DROP COLUMN "marked_new";`)
}

import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_shipping_settings_zones_tiers_amounts_currency" AS ENUM('ILS', 'EUR', 'USD');
  CREATE TABLE "shipping_settings_zones_tiers_amounts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"currency" "enum_shipping_settings_zones_tiers_amounts_currency" NOT NULL,
  	"amount" numeric NOT NULL
  );
  
  ALTER TABLE "shipping_settings_zones_tiers_amounts" ADD CONSTRAINT "shipping_settings_zones_tiers_amounts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shipping_settings_zones_tiers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "shipping_settings_zones_tiers_amounts_order_idx" ON "shipping_settings_zones_tiers_amounts" USING btree ("_order");
  CREATE INDEX "shipping_settings_zones_tiers_amounts_parent_id_idx" ON "shipping_settings_zones_tiers_amounts" USING btree ("_parent_id");

  -- Each tier keeps the one amount it has, now as a row in its zone's former
  -- currency. The other two currencies are the son's to enter: until he does,
  -- the zone ships only in the currency it was priced in, as before.
  INSERT INTO "shipping_settings_zones_tiers_amounts" ("_order", "_parent_id", "id", "currency", "amount")
    SELECT 1, "tier"."id", "tier"."id" || '-' || "zone"."currency", "zone"."currency"::text::"enum_shipping_settings_zones_tiers_amounts_currency", "tier"."amount"
    FROM "shipping_settings_zones_tiers" AS "tier"
    JOIN "shipping_settings_zones" AS "zone" ON "zone"."id" = "tier"."_parent_id";

  ALTER TABLE "shipping_settings_zones_tiers" DROP COLUMN "amount";
  ALTER TABLE "shipping_settings_zones" DROP COLUMN "currency";
  DROP TYPE "public"."enum_shipping_settings_zones_currency";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_shipping_settings_zones_currency" AS ENUM('ILS', 'EUR', 'USD');
  ALTER TABLE "shipping_settings_zones_tiers" ADD COLUMN "amount" numeric;
  ALTER TABLE "shipping_settings_zones" ADD COLUMN "currency" "enum_shipping_settings_zones_currency";

  -- A zone goes back to the one currency it had before: the first it lists.
  UPDATE "shipping_settings_zones" AS "zone" SET "currency" = (
    SELECT "amount"."currency"::text::"enum_shipping_settings_zones_currency"
    FROM "shipping_settings_zones_tiers_amounts" AS "amount"
    JOIN "shipping_settings_zones_tiers" AS "tier" ON "tier"."id" = "amount"."_parent_id"
    WHERE "tier"."_parent_id" = "zone"."id"
    ORDER BY "tier"."_order", "amount"."_order"
    LIMIT 1);
  UPDATE "shipping_settings_zones_tiers" AS "tier" SET "amount" = (
    SELECT "amount"."amount"
    FROM "shipping_settings_zones_tiers_amounts" AS "amount"
    JOIN "shipping_settings_zones" AS "zone" ON "zone"."id" = "tier"."_parent_id"
    WHERE "amount"."_parent_id" = "tier"."id" AND "amount"."currency"::text = "zone"."currency"::text);
  ALTER TABLE "shipping_settings_zones_tiers" ALTER COLUMN "amount" SET NOT NULL;
  ALTER TABLE "shipping_settings_zones" ALTER COLUMN "currency" SET NOT NULL;

  DROP TABLE "shipping_settings_zones_tiers_amounts" CASCADE;
  DROP TYPE "public"."enum_shipping_settings_zones_tiers_amounts_currency";`)
}

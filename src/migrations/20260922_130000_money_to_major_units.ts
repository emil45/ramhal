import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Every money column switched from an integer count of minor units
// (agorot/cents) to a decimal major-unit amount (shekels/dollars/euros) — see
// src/lib/validateMoneyAmount.ts. No column type changes: `numeric` already
// held either shape, so this only rewrites the values already stored.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "books_prices" SET "amount" = "amount" / 100;
  UPDATE "shipping_settings_zones_tiers" SET "amount" = "amount" / 100;
  UPDATE "orders_lines" SET "unit_price" = "unit_price" / 100;
  UPDATE "orders" SET "subtotal" = "subtotal" / 100, "shipping_cost" = "shipping_cost" / 100, "total" = "total" / 100;
  UPDATE "mock_payment_sessions" SET "total" = "total" / 100;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "books_prices" SET "amount" = "amount" * 100;
  UPDATE "shipping_settings_zones_tiers" SET "amount" = "amount" * 100;
  UPDATE "orders_lines" SET "unit_price" = "unit_price" * 100;
  UPDATE "orders" SET "subtotal" = "subtotal" * 100, "shipping_cost" = "shipping_cost" * 100, "total" = "total" * 100;
  UPDATE "mock_payment_sessions" SET "total" = "total" * 100;`)
}

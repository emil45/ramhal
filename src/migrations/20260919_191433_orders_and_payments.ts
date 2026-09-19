import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_lines_currency" AS ENUM('ILS', 'EUR', 'USD');
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('pending', 'paid', 'failed', 'cancelled');
  CREATE TYPE "public"."enum_orders_fulfilment_status" AS ENUM('new', 'packed', 'posted', 'collected');
  CREATE TYPE "public"."enum_orders_currency" AS ENUM('ILS', 'EUR', 'USD');
  CREATE TYPE "public"."enum_orders_locale" AS ENUM('he', 'en', 'fr');
  CREATE TYPE "public"."enum_payment_events_status" AS ENUM('paid', 'failed', 'cancelled');
  CREATE TYPE "public"."enum_mock_payment_sessions_currency" AS ENUM('ILS', 'EUR', 'USD');
  CREATE TYPE "public"."enum_mock_payment_sessions_locale" AS ENUM('he', 'en', 'fr');
  CREATE TYPE "public"."enum_mock_payment_sessions_decision" AS ENUM('awaiting', 'paid', 'declined', 'cancelled');
  CREATE TABLE "orders_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"book_id" integer,
  	"title" varchar NOT NULL,
  	"unit_price" numeric NOT NULL,
  	"currency" "enum_orders_lines_currency" NOT NULL,
  	"quantity" numeric NOT NULL,
  	"shipping_units" numeric NOT NULL
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"payment_status" "enum_orders_payment_status" DEFAULT 'pending' NOT NULL,
  	"fulfilment_status" "enum_orders_fulfilment_status",
  	"customer_name" varchar NOT NULL,
  	"customer_email" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"customer_address_line1" varchar,
  	"customer_address_line2" varchar,
  	"customer_address_city" varchar,
  	"customer_address_postal_code" varchar,
  	"currency" "enum_orders_currency" NOT NULL,
  	"subtotal" numeric NOT NULL,
  	"shipping_cost" numeric NOT NULL,
  	"total" numeric NOT NULL,
  	"shipping_zone" varchar NOT NULL,
  	"destination_country" varchar NOT NULL,
  	"is_pickup" boolean DEFAULT false,
  	"locale" "enum_orders_locale" NOT NULL,
  	"provider" varchar NOT NULL,
  	"provider_ref" varchar,
  	"paid_at" timestamp(3) with time zone,
  	"public_token" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payment_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"provider_event_id" varchar NOT NULL,
  	"provider" varchar NOT NULL,
  	"order_id" integer NOT NULL,
  	"status" "enum_payment_events_status" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "mock_payment_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"provider_ref" varchar NOT NULL,
  	"order_number" numeric NOT NULL,
  	"currency" "enum_mock_payment_sessions_currency" NOT NULL,
  	"total" numeric NOT NULL,
  	"locale" "enum_mock_payment_sessions_locale" NOT NULL,
  	"return_url" varchar NOT NULL,
  	"decision" "enum_mock_payment_sessions_decision" DEFAULT 'awaiting' NOT NULL,
  	"provider_event_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payment_events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "mock_payment_sessions_id" integer;
  ALTER TABLE "orders_lines" ADD CONSTRAINT "orders_lines_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_lines" ADD CONSTRAINT "orders_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "orders_lines_order_idx" ON "orders_lines" USING btree ("_order");
  CREATE INDEX "orders_lines_parent_id_idx" ON "orders_lines" USING btree ("_parent_id");
  CREATE INDEX "orders_lines_book_idx" ON "orders_lines" USING btree ("book_id");
  CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");
  CREATE INDEX "orders_fulfilment_status_idx" ON "orders" USING btree ("fulfilment_status");
  CREATE INDEX "orders_provider_ref_idx" ON "orders" USING btree ("provider_ref");
  CREATE UNIQUE INDEX "orders_public_token_idx" ON "orders" USING btree ("public_token");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "payment_events_provider_event_id_idx" ON "payment_events" USING btree ("provider_event_id");
  CREATE INDEX "payment_events_order_idx" ON "payment_events" USING btree ("order_id");
  CREATE INDEX "payment_events_updated_at_idx" ON "payment_events" USING btree ("updated_at");
  CREATE INDEX "payment_events_created_at_idx" ON "payment_events" USING btree ("created_at");
  CREATE UNIQUE INDEX "mock_payment_sessions_provider_ref_idx" ON "mock_payment_sessions" USING btree ("provider_ref");
  CREATE UNIQUE INDEX "mock_payment_sessions_provider_event_id_idx" ON "mock_payment_sessions" USING btree ("provider_event_id");
  CREATE INDEX "mock_payment_sessions_updated_at_idx" ON "mock_payment_sessions" USING btree ("updated_at");
  CREATE INDEX "mock_payment_sessions_created_at_idx" ON "mock_payment_sessions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payment_events_fk" FOREIGN KEY ("payment_events_id") REFERENCES "public"."payment_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mock_payment_sessions_fk" FOREIGN KEY ("mock_payment_sessions_id") REFERENCES "public"."mock_payment_sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_payment_events_id_idx" ON "payload_locked_documents_rels" USING btree ("payment_events_id");
  CREATE INDEX "payload_locked_documents_rels_mock_payment_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("mock_payment_sessions_id");
  -- Hand-added: order numbers are the order ids, and the first order should
  -- read "1001", not "1". See the orderNumber field in src/collections/Orders.ts.
  ALTER SEQUENCE "orders_id_seq" RESTART WITH 1001;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payment_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "mock_payment_sessions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "orders_lines" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "payment_events" CASCADE;
  DROP TABLE "mock_payment_sessions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payment_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_mock_payment_sessions_fk";
  
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  DROP INDEX "payload_locked_documents_rels_payment_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_mock_payment_sessions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payment_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "mock_payment_sessions_id";
  DROP TYPE "public"."enum_orders_lines_currency";
  DROP TYPE "public"."enum_orders_payment_status";
  DROP TYPE "public"."enum_orders_fulfilment_status";
  DROP TYPE "public"."enum_orders_currency";
  DROP TYPE "public"."enum_orders_locale";
  DROP TYPE "public"."enum_payment_events_status";
  DROP TYPE "public"."enum_mock_payment_sessions_currency";
  DROP TYPE "public"."enum_mock_payment_sessions_locale";
  DROP TYPE "public"."enum_mock_payment_sessions_decision";`)
}

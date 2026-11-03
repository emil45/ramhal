import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "books_colors_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "books_colors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"swatch" varchar NOT NULL
  );
  
  CREATE TABLE "books_colors_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "carts_items" ADD COLUMN "color_id" varchar;
  ALTER TABLE "books_colors_images" ADD CONSTRAINT "books_colors_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books_colors_images" ADD CONSTRAINT "books_colors_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books_colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_colors" ADD CONSTRAINT "books_colors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_colors_locales" ADD CONSTRAINT "books_colors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books_colors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "books_colors_images_order_idx" ON "books_colors_images" USING btree ("_order");
  CREATE INDEX "books_colors_images_parent_id_idx" ON "books_colors_images" USING btree ("_parent_id");
  CREATE INDEX "books_colors_images_image_idx" ON "books_colors_images" USING btree ("image_id");
  CREATE INDEX "books_colors_order_idx" ON "books_colors" USING btree ("_order");
  CREATE INDEX "books_colors_parent_id_idx" ON "books_colors" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "books_colors_locales_locale_parent_id_unique" ON "books_colors_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "books_colors_images" CASCADE;
  DROP TABLE "books_colors" CASCADE;
  DROP TABLE "books_colors_locales" CASCADE;
  ALTER TABLE "carts_items" DROP COLUMN "color_id";`)
}

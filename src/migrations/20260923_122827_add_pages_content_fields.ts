import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_section_heading_style" AS ENUM('standard', 'article', 'video');
  CREATE TYPE "public"."enum_pages_blocks_quote_variant" AS ENUM('hero', 'boxed', 'ruled', 'inline', 'highlight');
  CREATE TYPE "public"."enum_pages_blocks_labeled_list_layout" AS ENUM('grid', 'stacked');
  CREATE TYPE "public"."enum_pages_blocks_feature_cards_items_icon" AS ENUM('landmark', 'bookOpen', 'building2');
  CREATE TABLE "pages_blocks_section_heading" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_section_heading_style" DEFAULT 'standard' NOT NULL,
  	"heading" varchar NOT NULL,
  	"kicker" varchar,
  	"ornament" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"body" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_quote_variant" DEFAULT 'boxed' NOT NULL,
  	"label" varchar,
  	"quote" varchar NOT NULL,
  	"source" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_labeled_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"marker" varchar,
  	"label" varchar NOT NULL,
  	"body" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_labeled_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "enum_pages_blocks_labeled_list_layout" DEFAULT 'stacked' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_image_figure" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_stat_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_stat_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_feature_cards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_pages_blocks_feature_cards_items_icon" NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_feature_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_tag_list_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_tag_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"video_id" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "pages_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_locales" ADD COLUMN "lead" varchar;
  ALTER TABLE "pages_locales" ADD COLUMN "location" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "donate_photo_id" integer;
  ALTER TABLE "pages_blocks_section_heading" ADD CONSTRAINT "pages_blocks_section_heading_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_quote" ADD CONSTRAINT "pages_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_labeled_list_items" ADD CONSTRAINT "pages_blocks_labeled_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_labeled_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_labeled_list" ADD CONSTRAINT "pages_blocks_labeled_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_figure" ADD CONSTRAINT "pages_blocks_image_figure_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_figure" ADD CONSTRAINT "pages_blocks_image_figure_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_items" ADD CONSTRAINT "pages_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_items" ADD CONSTRAINT "pages_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery" ADD CONSTRAINT "pages_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stat_grid_items" ADD CONSTRAINT "pages_blocks_stat_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stat_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stat_grid" ADD CONSTRAINT "pages_blocks_stat_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_cards_items" ADD CONSTRAINT "pages_blocks_feature_cards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_feature_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_cards" ADD CONSTRAINT "pages_blocks_feature_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_tag_list_tags" ADD CONSTRAINT "pages_blocks_tag_list_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_tag_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_tag_list" ADD CONSTRAINT "pages_blocks_tag_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_video" ADD CONSTRAINT "pages_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_section_heading_order_idx" ON "pages_blocks_section_heading" USING btree ("_order");
  CREATE INDEX "pages_blocks_section_heading_parent_id_idx" ON "pages_blocks_section_heading" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_section_heading_path_idx" ON "pages_blocks_section_heading" USING btree ("_path");
  CREATE INDEX "pages_blocks_section_heading_locale_idx" ON "pages_blocks_section_heading" USING btree ("_locale");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_rich_text_locale_idx" ON "pages_blocks_rich_text" USING btree ("_locale");
  CREATE INDEX "pages_blocks_quote_order_idx" ON "pages_blocks_quote" USING btree ("_order");
  CREATE INDEX "pages_blocks_quote_parent_id_idx" ON "pages_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_quote_path_idx" ON "pages_blocks_quote" USING btree ("_path");
  CREATE INDEX "pages_blocks_quote_locale_idx" ON "pages_blocks_quote" USING btree ("_locale");
  CREATE INDEX "pages_blocks_labeled_list_items_order_idx" ON "pages_blocks_labeled_list_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_labeled_list_items_parent_id_idx" ON "pages_blocks_labeled_list_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_labeled_list_items_locale_idx" ON "pages_blocks_labeled_list_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_labeled_list_order_idx" ON "pages_blocks_labeled_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_labeled_list_parent_id_idx" ON "pages_blocks_labeled_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_labeled_list_path_idx" ON "pages_blocks_labeled_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_labeled_list_locale_idx" ON "pages_blocks_labeled_list" USING btree ("_locale");
  CREATE INDEX "pages_blocks_image_figure_order_idx" ON "pages_blocks_image_figure" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_figure_parent_id_idx" ON "pages_blocks_image_figure" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_figure_path_idx" ON "pages_blocks_image_figure" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_figure_locale_idx" ON "pages_blocks_image_figure" USING btree ("_locale");
  CREATE INDEX "pages_blocks_image_figure_image_idx" ON "pages_blocks_image_figure" USING btree ("image_id");
  CREATE INDEX "pages_blocks_gallery_items_order_idx" ON "pages_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_items_parent_id_idx" ON "pages_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_items_locale_idx" ON "pages_blocks_gallery_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_gallery_items_image_idx" ON "pages_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "pages_blocks_gallery_order_idx" ON "pages_blocks_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_parent_id_idx" ON "pages_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_path_idx" ON "pages_blocks_gallery" USING btree ("_path");
  CREATE INDEX "pages_blocks_gallery_locale_idx" ON "pages_blocks_gallery" USING btree ("_locale");
  CREATE INDEX "pages_blocks_stat_grid_items_order_idx" ON "pages_blocks_stat_grid_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_stat_grid_items_parent_id_idx" ON "pages_blocks_stat_grid_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stat_grid_items_locale_idx" ON "pages_blocks_stat_grid_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_stat_grid_order_idx" ON "pages_blocks_stat_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_stat_grid_parent_id_idx" ON "pages_blocks_stat_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stat_grid_path_idx" ON "pages_blocks_stat_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_stat_grid_locale_idx" ON "pages_blocks_stat_grid" USING btree ("_locale");
  CREATE INDEX "pages_blocks_feature_cards_items_order_idx" ON "pages_blocks_feature_cards_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_cards_items_parent_id_idx" ON "pages_blocks_feature_cards_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_cards_items_locale_idx" ON "pages_blocks_feature_cards_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_feature_cards_order_idx" ON "pages_blocks_feature_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_cards_parent_id_idx" ON "pages_blocks_feature_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_cards_path_idx" ON "pages_blocks_feature_cards" USING btree ("_path");
  CREATE INDEX "pages_blocks_feature_cards_locale_idx" ON "pages_blocks_feature_cards" USING btree ("_locale");
  CREATE INDEX "pages_blocks_tag_list_tags_order_idx" ON "pages_blocks_tag_list_tags" USING btree ("_order");
  CREATE INDEX "pages_blocks_tag_list_tags_parent_id_idx" ON "pages_blocks_tag_list_tags" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_tag_list_tags_locale_idx" ON "pages_blocks_tag_list_tags" USING btree ("_locale");
  CREATE INDEX "pages_blocks_tag_list_order_idx" ON "pages_blocks_tag_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_tag_list_parent_id_idx" ON "pages_blocks_tag_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_tag_list_path_idx" ON "pages_blocks_tag_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_tag_list_locale_idx" ON "pages_blocks_tag_list" USING btree ("_locale");
  CREATE INDEX "pages_blocks_video_order_idx" ON "pages_blocks_video" USING btree ("_order");
  CREATE INDEX "pages_blocks_video_parent_id_idx" ON "pages_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_video_path_idx" ON "pages_blocks_video" USING btree ("_path");
  CREATE INDEX "pages_blocks_video_locale_idx" ON "pages_blocks_video" USING btree ("_locale");
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_donate_photo_id_media_id_fk" FOREIGN KEY ("donate_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_hero_image_idx" ON "pages" USING btree ("hero_image_id");
  CREATE INDEX "site_settings_donate_photo_idx" ON "site_settings" USING btree ("donate_photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_section_heading" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_quote" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_labeled_list_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_labeled_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_image_figure" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_stat_grid_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_stat_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_feature_cards_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_feature_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_tag_list_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_tag_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_video" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_section_heading" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_quote" CASCADE;
  DROP TABLE "pages_blocks_labeled_list_items" CASCADE;
  DROP TABLE "pages_blocks_labeled_list" CASCADE;
  DROP TABLE "pages_blocks_image_figure" CASCADE;
  DROP TABLE "pages_blocks_gallery_items" CASCADE;
  DROP TABLE "pages_blocks_gallery" CASCADE;
  DROP TABLE "pages_blocks_stat_grid_items" CASCADE;
  DROP TABLE "pages_blocks_stat_grid" CASCADE;
  DROP TABLE "pages_blocks_feature_cards_items" CASCADE;
  DROP TABLE "pages_blocks_feature_cards" CASCADE;
  DROP TABLE "pages_blocks_tag_list_tags" CASCADE;
  DROP TABLE "pages_blocks_tag_list" CASCADE;
  DROP TABLE "pages_blocks_video" CASCADE;
  ALTER TABLE "pages" DROP CONSTRAINT "pages_hero_image_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_donate_photo_id_media_id_fk";
  
  DROP INDEX "pages_hero_image_idx";
  DROP INDEX "site_settings_donate_photo_idx";
  ALTER TABLE "pages" DROP COLUMN "hero_image_id";
  ALTER TABLE "pages_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_locales" DROP COLUMN "lead";
  ALTER TABLE "pages_locales" DROP COLUMN "location";
  ALTER TABLE "site_settings" DROP COLUMN "donate_photo_id";
  DROP TYPE "public"."enum_pages_blocks_section_heading_style";
  DROP TYPE "public"."enum_pages_blocks_quote_variant";
  DROP TYPE "public"."enum_pages_blocks_labeled_list_layout";
  DROP TYPE "public"."enum_pages_blocks_feature_cards_items_icon";`)
}

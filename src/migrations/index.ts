import * as migration_20260917_050507_initial_schema from './20260917_050507_initial_schema';
import * as migration_20260917_172914_books_review_fields from './20260917_172914_books_review_fields';
import * as migration_20260918_051142_carts_collection from './20260918_051142_carts_collection';
import * as migration_20260918_122803_books_url_slug from './20260918_122803_books_url_slug';
import * as migration_20260919_191433_orders_and_payments from './20260919_191433_orders_and_payments';
import * as migration_20260920_045628_media_storage_prefix from './20260920_045628_media_storage_prefix';
import * as migration_20260922_062811_google_sign_in from './20260922_062811_google_sign_in';
import * as migration_20260922_105315_news_images_and_links from './20260922_105315_news_images_and_links';
import * as migration_20260922_130000_money_to_major_units from './20260922_130000_money_to_major_units';

export const migrations = [
  {
    up: migration_20260917_050507_initial_schema.up,
    down: migration_20260917_050507_initial_schema.down,
    name: '20260917_050507_initial_schema',
  },
  {
    up: migration_20260917_172914_books_review_fields.up,
    down: migration_20260917_172914_books_review_fields.down,
    name: '20260917_172914_books_review_fields',
  },
  {
    up: migration_20260918_051142_carts_collection.up,
    down: migration_20260918_051142_carts_collection.down,
    name: '20260918_051142_carts_collection',
  },
  {
    up: migration_20260918_122803_books_url_slug.up,
    down: migration_20260918_122803_books_url_slug.down,
    name: '20260918_122803_books_url_slug',
  },
  {
    up: migration_20260919_191433_orders_and_payments.up,
    down: migration_20260919_191433_orders_and_payments.down,
    name: '20260919_191433_orders_and_payments',
  },
  {
    up: migration_20260920_045628_media_storage_prefix.up,
    down: migration_20260920_045628_media_storage_prefix.down,
    name: '20260920_045628_media_storage_prefix',
  },
  {
    up: migration_20260922_062811_google_sign_in.up,
    down: migration_20260922_062811_google_sign_in.down,
    name: '20260922_062811_google_sign_in',
  },
  {
    up: migration_20260922_105315_news_images_and_links.up,
    down: migration_20260922_105315_news_images_and_links.down,
    name: '20260922_105315_news_images_and_links',
  },
  {
    up: migration_20260922_130000_money_to_major_units.up,
    down: migration_20260922_130000_money_to_major_units.down,
    name: '20260922_130000_money_to_major_units',
  },
];

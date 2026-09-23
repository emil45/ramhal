import * as migration_20260917_050507_initial_schema from './20260917_050507_initial_schema';
import * as migration_20260917_172914_books_review_fields from './20260917_172914_books_review_fields';
import * as migration_20260918_051142_carts_collection from './20260918_051142_carts_collection';
import * as migration_20260918_122803_books_url_slug from './20260918_122803_books_url_slug';
import * as migration_20260919_191433_orders_and_payments from './20260919_191433_orders_and_payments';
import * as migration_20260920_045628_media_storage_prefix from './20260920_045628_media_storage_prefix';
import * as migration_20260922_062811_google_sign_in from './20260922_062811_google_sign_in';
import * as migration_20260922_105315_news_images_and_links from './20260922_105315_news_images_and_links';
import * as migration_20260922_130000_money_to_major_units from './20260922_130000_money_to_major_units';
import * as migration_20260922_190439_TASK_32_admin_facelift from './20260922_190439_TASK_32_admin_facelift';
import * as migration_20260922_211550_TASK_35_book_bibliographic_metadata from './20260922_211550_TASK_35_book_bibliographic_metadata';
import * as migration_20260923_122827_add_pages_content_fields from './20260923_122827_add_pages_content_fields';
import * as migration_20260923_122843_remove_pages_body_field from './20260923_122843_remove_pages_body_field';
import * as migration_20260923_123213_add_pages_section_heading_concluding_style from './20260923_123213_add_pages_section_heading_concluding_style';
import * as migration_20260923_123752_add_pages_meta_description from './20260923_123752_add_pages_meta_description';

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
  {
    up: migration_20260922_190439_TASK_32_admin_facelift.up,
    down: migration_20260922_190439_TASK_32_admin_facelift.down,
    name: '20260922_190439_TASK_32_admin_facelift',
  },
  {
    up: migration_20260922_211550_TASK_35_book_bibliographic_metadata.up,
    down: migration_20260922_211550_TASK_35_book_bibliographic_metadata.down,
    name: '20260922_211550_TASK_35_book_bibliographic_metadata',
  },
  {
    up: migration_20260923_122827_add_pages_content_fields.up,
    down: migration_20260923_122827_add_pages_content_fields.down,
    name: '20260923_122827_add_pages_content_fields',
  },
  {
    up: migration_20260923_122843_remove_pages_body_field.up,
    down: migration_20260923_122843_remove_pages_body_field.down,
    name: '20260923_122843_remove_pages_body_field',
  },
  {
    up: migration_20260923_123213_add_pages_section_heading_concluding_style.up,
    down: migration_20260923_123213_add_pages_section_heading_concluding_style.down,
    name: '20260923_123213_add_pages_section_heading_concluding_style',
  },
  {
    up: migration_20260923_123752_add_pages_meta_description.up,
    down: migration_20260923_123752_add_pages_meta_description.down,
    name: '20260923_123752_add_pages_meta_description'
  },
];

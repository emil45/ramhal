import * as migration_20260917_050507_initial_schema from './20260917_050507_initial_schema';
import * as migration_20260917_172914_books_review_fields from './20260917_172914_books_review_fields';
import * as migration_20260918_051142_carts_collection from './20260918_051142_carts_collection';
import * as migration_20260918_122803_books_url_slug from './20260918_122803_books_url_slug';
import * as migration_20260919_191433_orders_and_payments from './20260919_191433_orders_and_payments';

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
    name: '20260919_191433_orders_and_payments'
  },
];

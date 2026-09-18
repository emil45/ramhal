import * as migration_20260917_050507_initial_schema from './20260917_050507_initial_schema';
import * as migration_20260917_172914_books_review_fields from './20260917_172914_books_review_fields';

export const migrations = [
  {
    up: migration_20260917_050507_initial_schema.up,
    down: migration_20260917_050507_initial_schema.down,
    name: '20260917_050507_initial_schema',
  },
  {
    up: migration_20260917_172914_books_review_fields.up,
    down: migration_20260917_172914_books_review_fields.down,
    name: '20260917_172914_books_review_fields'
  },
];

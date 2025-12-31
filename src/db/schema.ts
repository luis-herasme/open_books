import { z } from 'zod';
import {
  uuid,
  pgTable,
  varchar,
  timestamp,
  integer,
  unique,
  index,
  pgEnum
} from 'drizzle-orm/pg-core';

import {
  MAX_BOOK_TITLE_LENGTH,
  MAX_BOOK_AUTHOR_LENGTH,
  MAX_CHAPTER_TITLE_LENGTH,
  MAX_CHAPTER_CONTENT_LENGTH,
  MAX_BOOK_DESCRIPTION_LENGTH,
  SUPPORTED_IMAGE_MIME_TYPES
} from '../constants.ts';

const imageContentTypeEnum = pgEnum('image_content_type', SUPPORTED_IMAGE_MIME_TYPES);
export const SupportedImageMimeType = z.enum(SUPPORTED_IMAGE_MIME_TYPES);
export type SupportedImageMimeType = z.infer<typeof SupportedImageMimeType>;

export const imagesTable = pgTable('images', {
  id: uuid().primaryKey().defaultRandom(),
  content_type: imageContentTypeEnum().notNull(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow()
});

export type ImageSelect = typeof imagesTable.$inferSelect;
export type ImageInsert = typeof imagesTable.$inferInsert;

export const booksTable = pgTable(
  'books',
  {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar({ length: MAX_BOOK_TITLE_LENGTH }).notNull(),
    author: varchar({ length: MAX_BOOK_AUTHOR_LENGTH }),
    description: varchar({ length: MAX_BOOK_DESCRIPTION_LENGTH }),
    image_id: uuid().references(() => imagesTable.id),

    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow()
  },
  (table) => [index('books_title_idx').on(table.title)]
);

export type BookSelect = typeof booksTable.$inferSelect;
export type BookInsert = typeof booksTable.$inferInsert;

export const chaptersTable = pgTable(
  'chapters',
  {
    id: uuid().primaryKey().defaultRandom(),
    book_id: uuid()
      .notNull()
      .references(() => booksTable.id, { onDelete: 'cascade' }),
    number: integer().notNull(),
    title: varchar({ length: MAX_CHAPTER_TITLE_LENGTH }).notNull(),
    content: varchar({ length: MAX_CHAPTER_CONTENT_LENGTH }).notNull(),

    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow()
  },
  (table) => [
    unique().on(table.book_id, table.number),
    index('chapters_book_id_idx').on(table.book_id)
  ]
);

export type ChapterSelect = typeof chaptersTable.$inferSelect;
export type ChapterInsert = typeof chaptersTable.$inferInsert;

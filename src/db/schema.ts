import { uuid, pgTable, varchar, timestamp, integer, unique, index } from 'drizzle-orm/pg-core';

import {
  MAX_BOOK_TITLE_LENGTH,
  MAX_BOOK_AUTHOR_LENGTH,
  MAX_CHAPTER_TITLE_LENGTH,
  MAX_BOOK_IMAGE_URL_LENGTH,
  MAX_CHAPTER_CONTENT_LENGTH,
  MAX_BOOK_DESCRIPTION_LENGTH
} from '../constants.ts';

export const booksTable = pgTable(
  'books',
  {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar({ length: MAX_BOOK_TITLE_LENGTH }).notNull(),
    image_url: varchar({ length: MAX_BOOK_IMAGE_URL_LENGTH }),
    author: varchar({ length: MAX_BOOK_AUTHOR_LENGTH }),
    description: varchar({ length: MAX_BOOK_DESCRIPTION_LENGTH }),

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

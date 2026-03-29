import { z } from 'zod';
import { text, integer, sqliteTable, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

import { SUPPORTED_IMAGE_MIME_TYPES } from '../constants.ts';

export const SupportedImageMimeType = z.enum(SUPPORTED_IMAGE_MIME_TYPES);
export type SupportedImageMimeType = z.infer<typeof SupportedImageMimeType>;

export const imagesTable = sqliteTable('images', {
  id: text().primaryKey().$default(() => crypto.randomUUID()),
  content_type: text().notNull(),
  created_at: text().notNull().$default(() => new Date().toISOString()),
  updated_at: text().notNull().$default(() => new Date().toISOString()).$onUpdate(() => new Date().toISOString())
});

export type ImageSelect = typeof imagesTable.$inferSelect;
export type ImageInsert = typeof imagesTable.$inferInsert;

export const booksTable = sqliteTable(
  'books',
  {
    id: text().primaryKey().$default(() => crypto.randomUUID()),
    title: text().notNull(),
    author: text(),
    description: text(),
    image_id: text().references(() => imagesTable.id),

    created_at: text().notNull().$default(() => new Date().toISOString()),
    updated_at: text().notNull().$default(() => new Date().toISOString()).$onUpdate(() => new Date().toISOString())
  },
  (table) => [index('books_title_idx').on(table.title)]
);

export type BookSelect = typeof booksTable.$inferSelect;
export type BookInsert = typeof booksTable.$inferInsert;

export const chaptersTable = sqliteTable(
  'chapters',
  {
    id: text().primaryKey().$default(() => crypto.randomUUID()),
    book_id: text()
      .notNull()
      .references(() => booksTable.id, { onDelete: 'cascade' }),
    number: integer().notNull(),
    title: text().notNull(),
    content: text().notNull(),

    created_at: text().notNull().$default(() => new Date().toISOString()),
    updated_at: text().notNull().$default(() => new Date().toISOString()).$onUpdate(() => new Date().toISOString())
  },
  (table) => [
    uniqueIndex('chapters_book_id_number_unique').on(table.book_id, table.number),
    index('chapters_book_id_idx').on(table.book_id)
  ]
);

export type ChapterSelect = typeof chaptersTable.$inferSelect;
export type ChapterInsert = typeof chaptersTable.$inferInsert;

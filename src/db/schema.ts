import { uuid, pgTable, varchar, text, timestamp, integer, unique } from 'drizzle-orm/pg-core';

export const booksTable = pgTable('books', {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar({ length: 256 }).notNull(),
  image_url: varchar({ length: 512 }),

  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow()
});

export type BookSelect = typeof booksTable.$inferSelect;
export type BookInsert = typeof booksTable.$inferInsert;

export const chaptersTable = pgTable(
  'chapters',
  {
    id: uuid().primaryKey().defaultRandom(),
    book_id: uuid()
      .notNull()
      .references(() => booksTable.id),
    number: integer().notNull(),
    title: varchar({ length: 256 }).notNull(),
    content: text().notNull(),
    image_url: varchar({ length: 512 }),

    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow()
  },
  (table) => ({
    uniqueChapterNumberPerBook: unique().on(table.book_id, table.number)
  })
);

export type ChapterSelect = typeof chaptersTable.$inferSelect;
export type ChapterInsert = typeof chaptersTable.$inferInsert;

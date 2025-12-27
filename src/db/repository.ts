import { db } from './index.ts';
import {
  chaptersTable,
  ChapterSelect,
  BookSelect,
  booksTable,
  BookInsert,
  ChapterInsert
} from './schema.ts';

import { eq, like, count } from 'drizzle-orm';

export async function getChapterById(chapter_id: string): Promise<ChapterSelect | null> {
  const [chapter] = await db
    .select()
    .from(chaptersTable)
    .where(eq(chaptersTable.id, chapter_id))
    .limit(1)
    .execute();

  if (!chapter) {
    return null;
  }

  return chapter;
}

export async function getChaptersByBookId({
  book_id,
  offset,
  limit
}: {
  book_id: string;
  offset: number;
  limit: number;
}): Promise<ChapterSelect[]> {
  return await db
    .select()
    .from(chaptersTable)
    .where(eq(chaptersTable.book_id, book_id))
    .limit(limit)
    .offset(offset)
    .execute();
}

export async function getBooksByTitle({
  term,
  offset,
  limit
}: {
  term: string;
  offset: number;
  limit: number;
}): Promise<{
  books: BookSelect[];
  count: number;
}> {
  return db.transaction(async (tx) => {
    const searchTerm = `%${term.toLowerCase()}%`;

    const books = await tx
      .select()
      .from(booksTable)
      .where(like(booksTable.title, searchTerm))
      .offset(offset)
      .limit(limit)
      .execute();

    const [booksCount] = await tx
      .select({ count: count() })
      .from(booksTable)
      .where(like(booksTable.title, searchTerm))
      .execute();

    if (!booksCount) {
      throw new Error('Failed to count books');
    }

    return {
      books,
      count: booksCount.count
    };
  });
}

export async function createBook(data: BookInsert): Promise<BookSelect> {
  const [book] = await db.insert(booksTable).values(data).returning().execute();

  if (!book) {
    throw new Error('Failed to create book');
  }

  return book;
}

export async function createChapter(data: ChapterInsert): Promise<ChapterSelect> {
  const [chapter] = await db.insert(chaptersTable).values(data).returning().execute();

  if (!chapter) {
    throw new Error('Failed to create chapter');
  }

  return chapter;
}

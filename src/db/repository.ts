import { Result } from '../result.ts';
import { db } from './index.ts';
import {
  chaptersTable,
  ChapterSelect,
  BookSelect,
  booksTable,
  BookInsert,
  ChapterInsert
} from './schema.ts';

import { eq, count, ilike, asc } from 'drizzle-orm';

export async function getChapterById(chapter_id: string): Promise<ChapterSelect | null> {
  const [chapter] = await db
    .select()
    .from(chaptersTable)
    .where(eq(chaptersTable.id, chapter_id))
    .limit(1);

  if (!chapter) {
    return null;
  }

  return chapter;
}

type GetChaptersByBookIdResult = Result<
  {
    chapters: ChapterSelect[];
    count: number;
  },
  'BOOK_NOT_FOUND'
>;

export async function getChaptersByBookId({
  book_id,
  offset,
  limit
}: {
  book_id: string;
  offset: number;
  limit: number;
}): Promise<GetChaptersByBookIdResult> {
  return db.transaction(async (tx) => {
    const [book] = await tx.select().from(booksTable).where(eq(booksTable.id, book_id)).limit(1);

    if (!book) {
      return {
        ok: false,
        error: 'BOOK_NOT_FOUND'
      };
    }

    const whereClause = eq(chaptersTable.book_id, book.id);

    const chapters = await tx
      .select()
      .from(chaptersTable)
      .where(whereClause)
      .orderBy(asc(chaptersTable.number))
      .limit(limit)
      .offset(offset);

    const [chaptersCount] = await tx
      .select({ count: count() })
      .from(chaptersTable)
      .where(whereClause);

    if (!chaptersCount) {
      throw new Error('Failed to count chapters');
    }

    return {
      ok: true,
      data: {
        chapters,
        count: chaptersCount.count
      }
    };
  });
}

/**
 * Sanitizes a term for use in an ILIKE query.
 * @param term - The term to sanitize.
 * @returns The sanitized term.
 */
function ilikeSanitize(term: string): string {
  let sanitized = '';
  for (const char of term) {
    if (char === '%' || char === '_') {
      sanitized += '\\' + char;
    } else {
      sanitized += char;
    }
  }
  return sanitized;
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
    const whereClause = ilike(booksTable.title, `%${ilikeSanitize(term)}%`);

    const books = await tx
      .select()
      .from(booksTable)
      .where(whereClause)
      .orderBy(asc(booksTable.title))
      .offset(offset)
      .limit(limit);

    const [booksCount] = await tx.select({ count: count() }).from(booksTable).where(whereClause);

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
  const [book] = await db.insert(booksTable).values(data).returning();

  if (!book) {
    throw new Error('Failed to create book');
  }

  return book;
}

export async function createChapter(data: ChapterInsert): Promise<ChapterSelect> {
  const [chapter] = await db.insert(chaptersTable).values(data).returning();

  if (!chapter) {
    throw new Error('Failed to create chapter');
  }

  return chapter;
}

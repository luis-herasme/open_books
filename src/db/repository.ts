import { eq, count, asc, sql } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

import {
  chaptersTable,
  ChapterSelect,
  BookSelect,
  booksTable,
  ChapterInsert,
  imagesTable,
  SupportedImageMimeType
} from './schema.ts';

type GetChapterByIdParams = {
  db: DrizzleD1Database;
  chapter_id: string;
};

export async function getChapterById({
  db,
  chapter_id
}: GetChapterByIdParams): Promise<ChapterSelect | null> {
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

type GetChaptersByBookIdResult =
  | {
      ok: true;
      data: {
        chapters: ChapterSelect[];
        total: number;
      };
    }
  | {
      ok: false;
      error: 'BOOK_NOT_FOUND';
    };

type GetChaptersByBookIdParams = {
  db: DrizzleD1Database;
  book_id: string;
  offset: number;
  limit: number;
};

export async function getChaptersByBookId({
  db,
  book_id,
  offset,
  limit
}: GetChaptersByBookIdParams): Promise<GetChaptersByBookIdResult> {
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, book_id)).limit(1);

  if (!book) {
    return {
      ok: false as const,
      error: 'BOOK_NOT_FOUND' as const
    };
  }

  const whereClause = eq(chaptersTable.book_id, book.id);

  const chapters = await db
    .select()
    .from(chaptersTable)
    .where(whereClause)
    .orderBy(asc(chaptersTable.number))
    .limit(limit)
    .offset(offset);

  const [chaptersCount] = await db
    .select({ count: count() })
    .from(chaptersTable)
    .where(whereClause);

  if (!chaptersCount) {
    throw new Error('Failed to count chapters');
  }

  return {
    ok: true as const,
    data: {
      chapters,
      total: chaptersCount.count
    }
  };
}

/**
 * Sanitizes a term for use in a LIKE query.
 * Escapes % and _ wildcards with backslash.
 * Must be used with ESCAPE '\' clause in the query.
 */
function likeSanitize(term: string): string {
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

type GetBooksByTitleParams = {
  db: DrizzleD1Database;
  book_title: string;
  offset: number;
  limit: number;
};

export async function getBooksByTitle({
  db,
  book_title,
  offset,
  limit
}: GetBooksByTitleParams): Promise<{
  books: BookSelect[];
  total: number;
}> {
  const pattern = `%${likeSanitize(book_title.toLowerCase())}%`;
  const escapeChar = '\\';
  const whereClause = sql`lower(${booksTable.title}) LIKE ${pattern} ESCAPE ${escapeChar}`;

  const books = await db
    .select()
    .from(booksTable)
    .where(whereClause)
    .orderBy(asc(booksTable.title))
    .offset(offset)
    .limit(limit);

  const [booksCount] = await db.select({ count: count() }).from(booksTable).where(whereClause);

  if (!booksCount) {
    throw new Error('Failed to count books');
  }

  return {
    books,
    total: booksCount.count
  };
}

type CreateChapterParams = {
  db: DrizzleD1Database;
  data: ChapterInsert;
};

export async function createChapter({ db, data }: CreateChapterParams): Promise<ChapterSelect> {
  const [chapter] = await db.insert(chaptersTable).values(data).returning();

  if (!chapter) {
    throw new Error('Failed to create chapter');
  }

  return chapter;
}

type CreateBookParams = {
  db: DrizzleD1Database;
  title: string;
  author?: string;
  description?: string;
  image?: {
    buffer: Buffer;
    contentType: SupportedImageMimeType;
  };
};

export async function createBook({
  db,
  title,
  author,
  description,
  image
}: CreateBookParams): Promise<BookSelect> {
  if (image) {
    const bookId = crypto.randomUUID();
    const imageId = crypto.randomUUID();
    const now = new Date().toISOString();

    const results = await db.batch([
      db.insert(imagesTable).values({
        id: imageId,
        content_type: image.contentType,
        created_at: now,
        updated_at: now
      }),
      db
        .insert(booksTable)
        .values({
          id: bookId,
          title,
          author,
          description,
          image_id: imageId,
          created_at: now,
          updated_at: now
        })
        .returning()
    ]);

    const bookResult = results[1];
    const book = bookResult[0];

    if (!book) {
      throw new Error('Failed to create book');
    }

    return book;
  }

  const [book] = await db
    .insert(booksTable)
    .values({
      title,
      author,
      description
    })
    .returning();

  if (!book) {
    throw new Error('Failed to create book');
  }

  return book;
}

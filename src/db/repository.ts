import { eq, count, asc, sql } from 'drizzle-orm';

import { imageStorage } from '../lib/image-storage.ts';
import { Result } from '../lib/result.ts';
import { db } from './index.ts';
import {
  chaptersTable,
  ChapterSelect,
  BookSelect,
  booksTable,
  ChapterInsert,
  imagesTable,
  SupportedImageMimeType
} from './schema.ts';

export function getChapterById(chapter_id: string): ChapterSelect | null {
  const [chapter] = db
    .select()
    .from(chaptersTable)
    .where(eq(chaptersTable.id, chapter_id))
    .limit(1)
    .all();

  if (!chapter) {
    return null;
  }

  return chapter;
}

type GetChaptersByBookIdResult = Result<
  {
    chapters: ChapterSelect[];
    total: number;
  },
  'BOOK_NOT_FOUND'
>;

type GetChaptersByBookIdParams = {
  book_id: string;
  offset: number;
  limit: number;
};

export function getChaptersByBookId({
  book_id,
  offset,
  limit
}: GetChaptersByBookIdParams): GetChaptersByBookIdResult {
  return db.transaction((tx) => {
    const [book] = tx.select().from(booksTable).where(eq(booksTable.id, book_id)).limit(1).all();

    if (!book) {
      return {
        ok: false as const,
        error: 'BOOK_NOT_FOUND' as const
      };
    }

    const whereClause = eq(chaptersTable.book_id, book.id);

    const chapters = tx
      .select()
      .from(chaptersTable)
      .where(whereClause)
      .orderBy(asc(chaptersTable.number))
      .limit(limit)
      .offset(offset)
      .all();

    const [chaptersCount] = tx
      .select({ count: count() })
      .from(chaptersTable)
      .where(whereClause)
      .all();

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
  });
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
  book_title: string;
  offset: number;
  limit: number;
};

export function getBooksByTitle({
  book_title,
  offset,
  limit
}: GetBooksByTitleParams): {
  books: BookSelect[];
  total: number;
} {
  return db.transaction((tx) => {
    const pattern = `%${likeSanitize(book_title.toLowerCase())}%`;
    const escapeChar = '\\';
    const whereClause = sql`lower(${booksTable.title}) LIKE ${pattern} ESCAPE ${escapeChar}`;

    const books = tx
      .select()
      .from(booksTable)
      .where(whereClause)
      .orderBy(asc(booksTable.title))
      .offset(offset)
      .limit(limit)
      .all();

    const [booksCount] = tx.select({ count: count() }).from(booksTable).where(whereClause).all();

    if (!booksCount) {
      throw new Error('Failed to count books');
    }

    return {
      books,
      total: booksCount.count
    };
  });
}

export function createChapter(data: ChapterInsert): ChapterSelect {
  const [chapter] = db.insert(chaptersTable).values(data).returning().all();

  if (!chapter) {
    throw new Error('Failed to create chapter');
  }

  return chapter;
}

type CreateBookParams = {
  title: string;
  author?: string;
  description?: string;
  image?: {
    buffer: Buffer;
    contentType: SupportedImageMimeType;
  };
};

export async function createBook({
  title,
  author,
  description,
  image
}: CreateBookParams): Promise<BookSelect> {
  // Insert image and book rows in a single sync transaction.
  // S3 upload happens after the transaction since it's async.
  const { book, imageToUpload } = db.transaction((tx) => {
    let imageId: string | undefined;

    if (image) {
      const [createdImage] = tx
        .insert(imagesTable)
        .values({ content_type: image.contentType })
        .returning()
        .all();

      if (!createdImage) {
        throw new Error('Failed to create image');
      }

      imageId = createdImage.id;
    }

    const [book] = tx
      .insert(booksTable)
      .values({
        title,
        author,
        description,
        image_id: imageId
      })
      .returning()
      .all();

    if (!book) {
      throw new Error('Failed to create book');
    }

    return {
      book,
      imageToUpload: image && imageId ? { imageId, buffer: image.buffer, contentType: image.contentType } : undefined
    };
  });

  if (imageToUpload) {
    await imageStorage.saveBuffer(imageToUpload);
  }

  return book;
}

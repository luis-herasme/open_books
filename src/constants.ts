import { util } from 'zod';

// Books
export const MAX_BOOKS_PER_PAGE = 100;
export const MAX_CHAPTERS_PER_BOOK = 10_000;
export const MAX_BOOK_TITLE_LENGTH = 1_000;
export const MAX_BOOK_AUTHOR_LENGTH = 1_000;
export const MAX_BOOK_DESCRIPTION_LENGTH = 1_000_000;

// Chapters
export const MAX_CHAPTERS_PER_PAGE = 100;
export const MAX_CHAPTER_TITLE_LENGTH = 1_000;
export const MAX_CHAPTER_CONTENT_LENGTH = 1_000_000;

// Images
export const MAX_UPLOAD_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg'
] as const satisfies util.MimeTypes[];

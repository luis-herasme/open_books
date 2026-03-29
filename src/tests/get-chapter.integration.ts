import { testClient } from 'hono/testing';
import { describe, it, expect, afterEach } from 'vitest';

import { cleanupDatabase, createTestBook, createTestChapter } from './test-helpers.ts';
import { createApp } from '../app.ts';

describe('GET /chapter', () => {
  const app = createApp();
  const client = testClient(app);

  afterEach(cleanupDatabase);

  it('should return chapter content when chapter exists', async () => {
    const bookId = await createTestBook(client, {
      title: 'Book'
    });

    const chapterId = await createTestChapter(client, {
      book_id: bookId,
      title: 'Chapter 1',
      content: 'This is the chapter content',
      number: 1
    });

    const response = await client.chapter.$get({
      query: {
        chapter_id: chapterId
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toEqual({
      book_id: bookId,
      content: 'This is the chapter content'
    });
  });

  it('should return 404 when chapter does not exist', async () => {
    const response = await client.chapter.$get({
      query: { chapter_id: '123e4567-e89b-12d3-a456-426614174000' }
    });

    expect(response.status).toBe(404);
  });

  it('should return 422 for invalid chapter_id format', async () => {
    const response = await app.request('/chapter?chapter_id=invalid-uuid');

    expect(response.status).toBe(422);
  });

  it('should return 422 when chapter_id is missing', async () => {
    const response = await app.request('/chapter');

    expect(response.status).toBe(422);
  });
});

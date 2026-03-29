import { describe, it, expect, afterEach } from 'vitest';
import assert from 'node:assert';

import { app, client, env, cleanupDatabase, createTestBook, createTestChapter } from './test-helpers.ts';

describe('GET /chapters', () => {
  afterEach(cleanupDatabase);

  it('should return chapters list when book exists', async () => {
    const bookId = await createTestBook(client, { title: 'Test Book' });

    const chapter1Id = await createTestChapter(client, {
      book_id: bookId,
      number: 1,
      title: 'Chapter 1',
      content: 'Content 1'
    });

    const chapter2Id = await createTestChapter(client, {
      book_id: bookId,
      number: 2,
      title: 'Chapter 2',
      content: 'Content 2'
    });

    const response = await client.chapters.$get({
      query: { book_id: bookId }
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toEqual({
      chapters: [
        {
          chapter_id: chapter1Id,
          chapter_title: 'Chapter 1'
        },
        {
          chapter_id: chapter2Id,
          chapter_title: 'Chapter 2'
        }
      ],
      total: 2
    });
  });

  it('should return chapters with pagination parameters', async () => {
    const bookId = await createTestBook(client, { title: 'Test Book' });

    for (let i = 1; i <= 5; i++) {
      await createTestChapter(client, {
        book_id: bookId,
        number: i,
        title: `Chapter ${i}`,
        content: `Content ${i}`
      });
    }

    const response = await client.chapters.$get({
      query: {
        book_id: bookId,
        skip: '2',
        take: '2'
      }
    });

    assert(response.status === 200);
    const data = await response.json();
    expect(data.chapters).toHaveLength(2);
    expect(data.chapters[0]?.chapter_title).toBe('Chapter 3');
    expect(data.chapters[1]?.chapter_title).toBe('Chapter 4');
    expect(data.total).toBe(5);
  });

  it('should return 404 when book does not exist', async () => {
    const response = await client.chapters.$get({
      query: { book_id: '123e4567-e89b-12d3-a456-426614174000' }
    });

    expect(response.status).toBe(404);
  });

  it('should return 422 for invalid book_id format', async () => {
    const response = await app.request('/chapters?book_id=invalid-uuid', undefined, env);

    expect(response.status).toBe(422);
  });

  it('should return 422 when book_id is missing', async () => {
    const response = await app.request('/chapters', undefined, env);

    expect(response.status).toBe(422);
  });

  it('should return 422 when take exceeds maximum', async () => {
    const response = await app.request(
      '/chapters?book_id=987e4567-e89b-12d3-a456-426614174000&take=200',
      undefined,
      env
    );

    expect(response.status).toBe(422);
  });

  it('should return 422 when skip is negative', async () => {
    const response = await app.request(
      '/chapters?book_id=987e4567-e89b-12d3-a456-426614174000&skip=-1',
      undefined,
      env
    );

    expect(response.status).toBe(422);
  });
});

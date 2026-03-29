import { describe, it, expect, afterEach } from 'vitest';
import assert from 'node:assert';

import { app, client, env, cleanupDatabase, createTestBook, TEST_IMAGE_FILE } from './test-helpers.ts';

describe('GET /search-book', () => {
  afterEach(cleanupDatabase);

  it('should return books matching the search title', async () => {
    const book1Id = await createTestBook(client, {
      title: 'The Great Adventure',
      author: 'John Doe',
      description: 'An epic adventure story'
    });

    const book2Id = await createTestBook(client, {
      title: 'Adventure Time',
      author: 'Jane Smith'
    });

    await createTestBook(client, {
      title: 'Mystery Novel'
    });

    const response = await client['search-book'].$get({
      query: {
        book_title: 'Adventure'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.books).toHaveLength(2);
    expect(data.total).toBe(2);

    expect(data.books[0]).toEqual({
      book_id: book2Id,
      book_title: 'Adventure Time',
      image_url: null,
      author: 'Jane Smith',
      description: null
    });

    expect(data.books[1]).toEqual({
      book_id: book1Id,
      book_title: 'The Great Adventure',
      image_url: null,
      author: 'John Doe',
      description: 'An epic adventure story'
    });
  });

  it('should return books with image URLs when image is uploaded', async () => {
    const bookId = await createTestBook(client, {
      title: 'Book with Image',
      author: 'Author',
      image: TEST_IMAGE_FILE
    });

    const response = await client['search-book'].$get({
      query: {
        book_title: 'Book with Image'
      }
    });

    assert(response.status === 200);
    const data = await response.json();

    assert(data.books[0]);
    expect(data.books[0].book_id).toBe(bookId);
    expect(data.books[0].image_url).toMatch(/^https:\/\/test-r2\.example\.com\//);
  });

  it('should return empty array when no books match', async () => {
    await createTestBook(client, {
      title: 'Mystery Novel'
    });

    const response = await client['search-book'].$get({
      query: {
        book_title: 'NonExistentBook'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      books: [],
      total: 0
    });
  });

  it('should handle pagination parameters', async () => {
    for (let i = 1; i <= 10; i++) {
      await createTestBook(client, {
        title: `Test Book ${i.toString().padStart(2, '0')}`
      });
    }

    const response = await client['search-book'].$get({
      query: {
        book_title: 'Test',
        skip: '3',
        take: '4'
      }
    });

    assert(response.status === 200);
    const data = await response.json();

    expect(data.books).toHaveLength(4);
    expect(data.total).toBe(10);

    expect(data.books[0]?.book_title).toBe('Test Book 04');
    expect(data.books[3]?.book_title).toBe('Test Book 07');
  });

  it('should perform case-insensitive search', async () => {
    await createTestBook(client, { title: 'UPPERCASE TITLE' });
    await createTestBook(client, { title: 'lowercase title' });
    await createTestBook(client, { title: 'MixedCase Title' });

    const response = await client['search-book'].$get({
      query: { book_title: 'title' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.books).toHaveLength(3);
    expect(data.total).toBe(3);
  });

  it('should return 422 when book_title is missing', async () => {
    const response = await app.request('/search-book', undefined, env);

    expect(response.status).toBe(422);
  });

  it('should return 422 when take exceeds maximum', async () => {
    const response = await app.request('/search-book?book_title=test&take=200', undefined, env);

    expect(response.status).toBe(422);
  });

  it('should return 422 when skip is negative', async () => {
    const response = await app.request('/search-book?book_title=test&skip=-1', undefined, env);

    expect(response.status).toBe(422);
  });
});

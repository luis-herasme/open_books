import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { testClient } from 'hono/testing';
import { describe, it, expect, afterEach } from 'vitest';

import { env } from '../env.ts';
import { createApp } from '../app.ts';
import { cleanupDatabase, TEST_IMAGE_FILE } from './test-helpers.ts';

describe('POST /upload-book', () => {
  const app = createApp();
  const client = testClient(app);

  afterEach(cleanupDatabase);

  it('should create a book with only title', async () => {
    const testBookTitle = randomUUID();

    const response = await client['upload-book'].$post(
      {
        form: {
          title: testBookTitle
        }
      },
      {
        headers: {
          'x-api-key': env.API_KEY
        }
      }
    );

    assert(response.status === 201);

    const searchResponse = await client['search-book'].$get({
      query: {
        book_title: testBookTitle
      }
    });

    expect(searchResponse.status).toBe(200);
    const searchData = await searchResponse.json();

    expect(searchData.total).toBe(1);
    expect(searchData.books).toHaveLength(1);
    expect(searchData.books[0]?.book_title).toBe(testBookTitle);
  });

  it('should create a book with title, author and description', async () => {
    const testBook = {
      title: randomUUID(),
      author: randomUUID(),
      description: randomUUID()
    };

    const response = await client['upload-book'].$post(
      {
        form: {
          title: testBook.title,
          author: testBook.author,
          description: testBook.description
        }
      },
      {
        headers: {
          'x-api-key': env.API_KEY
        }
      }
    );

    assert(response.status === 201);
    const data = await response.json();
    expect(data.book_id).toBeDefined();

    const searchResponse = await client['search-book'].$get({
      query: {
        book_title: testBook.title
      }
    });

    expect(searchResponse.status).toBe(200);
    const searchData = await searchResponse.json();
    expect(searchData.books).toHaveLength(1);
    expect(searchData.books[0]).toMatchObject({
      book_id: data.book_id,
      book_title: testBook.title,
      author: testBook.author,
      description: testBook.description
    });
  });

  it('should create a book with an image', async () => {
    const testBookTitle = randomUUID();
    const response = await client['upload-book'].$post(
      {
        form: {
          title: testBookTitle,
          image: TEST_IMAGE_FILE
        }
      },
      {
        headers: {
          'x-api-key': env.API_KEY
        }
      }
    );

    assert(response.status === 201);
    const data = await response.json();
    expect(data.book_id).toBeDefined();

    // Verify book was created with an image by searching for it
    const searchResponse = await client['search-book'].$get({
      query: {
        book_title: testBookTitle
      }
    });

    expect(searchResponse.status).toBe(200);
    const searchData = await searchResponse.json();
    expect(searchData.books).toHaveLength(1);
    expect(searchData.books[0]?.book_id).toBe(data.book_id);
    expect(searchData.books[0]?.image_url).toBeDefined();
  });

  it('should return 401 when API key is missing', async () => {
    const response = await client['upload-book'].$post({
      form: {
        title: 'My New Book'
      }
    });

    expect(response.status).toBe(401);
  });

  it('should return 401 when API key is invalid', async () => {
    const response = await client['upload-book'].$post(
      {
        form: {
          title: 'My New Book'
        }
      },
      {
        headers: {
          'x-api-key': 'wrong-api-key'
        }
      }
    );

    expect(response.status).toBe(401);
  });
});

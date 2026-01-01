import assert from 'node:assert';
import { testClient } from 'hono/testing';
import { describe, it, expect, afterEach } from 'vitest';

import { env } from '../env.ts';
import { createApp } from '../app.ts';
import { createTestBook, cleanupDatabase } from './test-helpers.ts';

describe('POST /upload-chapter', () => {
  const app = createApp();
  const client = testClient(app);

  afterEach(cleanupDatabase);

  it('should create a chapter successfully', async () => {
    const bookId = await createTestBook(client, {
      title: 'Test Book'
    });

    const response = await client['upload-chapter'].$post(
      {
        json: {
          book_id: bookId,
          title: 'Chapter 1: The Beginning',
          content: 'Once upon a time...',
          number: 1
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
    expect(data.chapter_id).toBeDefined();

    // Verify chapter was created by fetching it via API
    const getResponse = await client.chapter.$get({
      query: {
        chapter_id: data.chapter_id
      }
    });

    assert(getResponse.status === 200);
    const chapterData = await getResponse.json();
    expect(chapterData.book_id).toBe(bookId);
  });

  it('should create multiple chapters for the same book', async () => {
    const bookId = await createTestBook(client, {
      title: 'Test Book'
    });

    // Create first chapter
    const response1 = await client['upload-chapter'].$post(
      {
        json: {
          book_id: bookId,
          title: 'Chapter 1',
          content: 'First chapter content',
          number: 1
        }
      },
      {
        headers: {
          'x-api-key': env.API_KEY
        }
      }
    );

    expect(response1.status).toBe(201);

    // Create second chapter
    const response2 = await client['upload-chapter'].$post(
      {
        json: {
          book_id: bookId,
          title: 'Chapter 2',
          content: 'Second chapter content',
          number: 2
        }
      },
      {
        headers: {
          'x-api-key': env.API_KEY
        }
      }
    );

    expect(response2.status).toBe(201);

    // Verify both chapters exist by listing chapters
    const chaptersResponse = await client.chapters.$get({
      query: {
        book_id: bookId
      }
    });

    assert(chaptersResponse.status === 200);
    const chaptersData = await chaptersResponse.json();
    expect(chaptersData.chapters).toHaveLength(2);
    expect(chaptersData.total).toBe(2);
  });

  it('should return 401 when API key is missing', async () => {
    const response = await client['upload-chapter'].$post({
      json: {
        book_id: '987e4567-e89b-12d3-a456-426614174000',
        title: 'Chapter 1',
        content: 'Content here',
        number: 1
      }
    });

    expect(response.status).toBe(401);
  });

  it('should return 401 when API key is invalid', async () => {
    const response = await client['upload-chapter'].$post(
      {
        json: {
          book_id: '987e4567-e89b-12d3-a456-426614174000',
          title: 'Chapter 1',
          content: 'Content here',
          number: 1
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

  it('should return 422 when book_id is invalid', async () => {
    const response = await app.request('/upload-chapter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.API_KEY
      },
      body: JSON.stringify({
        book_id: 'invalid-uuid',
        title: 'Chapter 1',
        content: 'Content here',
        number: 1
      })
    });

    expect(response.status).toBe(422);
  });

  it('should return 422 when title is empty', async () => {
    const response = await app.request('/upload-chapter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.API_KEY
      },
      body: JSON.stringify({
        book_id: '987e4567-e89b-12d3-a456-426614174000',
        title: '',
        content: 'Content here',
        number: 1
      })
    });

    expect(response.status).toBe(422);
  });

  it('should return 422 when content is empty', async () => {
    const response = await app.request('/upload-chapter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.API_KEY
      },
      body: JSON.stringify({
        book_id: '987e4567-e89b-12d3-a456-426614174000',
        title: 'Chapter 1',
        content: '',
        number: 1
      })
    });

    expect(response.status).toBe(422);
  });

  it('should return 422 when number is less than 1', async () => {
    const response = await app.request('/upload-chapter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.API_KEY
      },
      body: JSON.stringify({
        book_id: '987e4567-e89b-12d3-a456-426614174000',
        title: 'Chapter 1',
        content: 'Content here',
        number: 0
      })
    });

    expect(response.status).toBe(422);
  });

  it('should return 422 when number is negative', async () => {
    const response = await app.request('/upload-chapter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.API_KEY
      },
      body: JSON.stringify({
        book_id: '987e4567-e89b-12d3-a456-426614174000',
        title: 'Chapter 1',
        content: 'Content here',
        number: -1
      })
    });

    expect(response.status).toBe(422);
  });

  it('should return 422 when required fields are missing', async () => {
    const response = await app.request('/upload-chapter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.API_KEY
      },
      body: JSON.stringify({
        book_id: '987e4567-e89b-12d3-a456-426614174000'
      })
    });

    expect(response.status).toBe(422);
  });
});

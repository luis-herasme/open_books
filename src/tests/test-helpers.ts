import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { testClient } from 'hono/testing';

import { env } from '../env.ts';
import type { App } from '../app.ts';

const testDb = drizzle(env.DATABASE_URL);

export async function cleanupDatabase() {
  // Get all table names from the public schema
  const result = await testDb.execute<{ tablename: string }>(sql`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  `);

  // Truncate all tables with CASCADE to handle foreign key constraints
  for (const row of result.rows) {
    try {
      await testDb.execute(sql.raw(`TRUNCATE TABLE "${row.tablename}" CASCADE`));
    } catch {
      // Ignore errors (table might not exist or have issues)
    }
  }
}

const TEST_IMAGE_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
  0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
  0x44, 0xae, 0x42, 0x60, 0x82
]);

export const TEST_IMAGE_FILE = new File([TEST_IMAGE_BYTES], 'cover.png', { type: 'image/png' });

type TestAppClient = ReturnType<typeof testClient<App>>;

type TestBookData = {
  title: string;
  author?: string;
  description?: string;
  image?: File;
};

export async function createTestBook(client: TestAppClient, form: TestBookData) {
  const response = await client['upload-book'].$post(
    {
      form
    },
    {
      headers: {
        'x-api-key': env.API_KEY
      }
    }
  );

  if (response.status !== 201) {
    throw new Error(`Failed to create book: ${response.status}`);
  }

  const result = await response.json();
  return result.book_id;
}

export async function createTestChapter(
  client: TestAppClient,
  data: {
    book_id: string;
    number: number;
    title: string;
    content: string;
  }
) {
  const response = await client['upload-chapter'].$post(
    {
      json: {
        book_id: data.book_id,
        number: data.number,
        title: data.title,
        content: data.content
      }
    },
    {
      headers: {
        'x-api-key': env.API_KEY
      }
    }
  );

  if (response.status !== 201) {
    throw new Error(`Failed to create chapter: ${response.status}`);
  }

  const result = await response.json();
  return result.chapter_id;
}

import { env } from 'cloudflare:test';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import { testClient } from 'hono/testing';

import { createApp } from '../app.ts';
import type { App } from '../app.ts';

// Re-export env so test files can use it for app.request() calls
export { env } from 'cloudflare:test';

const app = createApp();

// Pass env as second arg so Hono binds c.env for Workers
export const client = testClient(app, env);
export { app };

export async function cleanupDatabase() {
  const db = drizzle(env.DB);

  await db.run(sql`PRAGMA foreign_keys = OFF`);

  const tables = await db.all<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%' AND name NOT LIKE '_cf_%'`
  );

  for (const table of tables) {
    await db.run(sql.raw(`DELETE FROM "${table.name}"`));
  }

  await db.run(sql`PRAGMA foreign_keys = ON`);
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
        'x-api-key': '1234'
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
        'x-api-key': '1234'
      }
    }
  );

  if (response.status !== 201) {
    throw new Error(`Failed to create chapter: ${response.status}`);
  }

  const result = await response.json();
  return result.chapter_id;
}

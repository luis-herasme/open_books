import { env } from 'cloudflare:test';

// Apply D1 migrations before tests run
await env.DB.exec(`CREATE TABLE IF NOT EXISTS "images" ("id" text PRIMARY KEY NOT NULL, "content_type" text NOT NULL, "created_at" text NOT NULL, "updated_at" text NOT NULL)`);
await env.DB.exec(`CREATE TABLE IF NOT EXISTS "books" ("id" text PRIMARY KEY NOT NULL, "title" text NOT NULL, "author" text, "description" text, "image_id" text, "created_at" text NOT NULL, "updated_at" text NOT NULL, FOREIGN KEY ("image_id") REFERENCES "images"("id") ON UPDATE no action ON DELETE no action)`);
await env.DB.exec(`CREATE INDEX IF NOT EXISTS "books_title_idx" ON "books" ("title")`);
await env.DB.exec(`CREATE TABLE IF NOT EXISTS "chapters" ("id" text PRIMARY KEY NOT NULL, "book_id" text NOT NULL, "number" integer NOT NULL, "title" text NOT NULL, "content" text NOT NULL, "created_at" text NOT NULL, "updated_at" text NOT NULL, FOREIGN KEY ("book_id") REFERENCES "books"("id") ON UPDATE no action ON DELETE cascade)`);
await env.DB.exec(`CREATE UNIQUE INDEX IF NOT EXISTS "chapters_book_id_number_unique" ON "chapters" ("book_id","number")`);
await env.DB.exec(`CREATE INDEX IF NOT EXISTS "chapters_book_id_idx" ON "chapters" ("book_id")`);

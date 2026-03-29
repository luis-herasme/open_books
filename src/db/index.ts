import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { env } from '../env.ts';

export const db = drizzle(new Database(env.DATABASE_PATH));

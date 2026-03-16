import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config.js';
import { logger } from '../logger.js';
import * as schema from './schema.js';

let client: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle<typeof schema>>;

export function getDb() {
  if (!db) {
    client = postgres(config.DATABASE_URL, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
      onnotice: (notice) => logger.debug({ notice }, 'PostgreSQL notice'),
    });
    db = drizzle(client, { schema, logger: config.LOG_LEVEL === 'debug' });
    logger.info('Database connection pool created');
  }
  return db;
}

export async function closeDb() {
  if (client) {
    await client.end();
    logger.info('Database connection pool closed');
  }
}

export { schema };
export type Db = ReturnType<typeof getDb>;

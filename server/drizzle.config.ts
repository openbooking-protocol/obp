import type { Config } from 'drizzle-kit';
import { config as appConfig } from './src/config.js';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: appConfig.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;

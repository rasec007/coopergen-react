import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@/lib/db/schema';

declare global {
  // Prevent multiple pool instances in development (hot reload)
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

const pool =
  globalThis._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis._pgPool = pool;
}

export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export { pool };

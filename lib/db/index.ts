import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@/lib/db/schema';

declare global {
  // Prevent multiple pool instances in development (hot reload)
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

const getDatabaseUrl = () => {
  const env = process.env.NODE_ENV as string;
  let url = process.env.DATABASE_URL; // Default

  if (env === 'prod' || env === 'production') {
    url = process.env.DATABASE_URL_PROD;
  } else if (env === 'deve' || env === 'development') {
    url = process.env.DATABASE_URL_DEVE;
  }
  
  console.log(`[DB] Conectando ao banco: ${url?.split('/').pop()?.split('?')[0]} (NODE_ENV: ${env})`);
  return url;
};

const pool =
  globalThis._pgPool ??
  new Pool({
    connectionString: getDatabaseUrl()!,
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

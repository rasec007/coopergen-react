import { db } from './lib/db';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    const result = await db.execute(sql`SELECT 1 as connected`);
    console.log('Database connection successful:', result);
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();

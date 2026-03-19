import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local'), override: true });

const { Client } = pg;

async function testLogin() {
  const dbUrl = process.env.DATABASE_URL;
  console.log(`[DEBUG] Connecting to: ${dbUrl?.split('@')[1]}`);
  
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log("[OK] Connected to database.");
    
    const res = await client.query("SELECT id, email, name, password_hash, is_active FROM users LIMIT 1;");
    if (res.rows.length > 0) {
        console.log("[OK] Found users table and at least one user.");
        console.log(`[DEBUG] User example: ${res.rows[0].email}`);
    } else {
        console.log("[WARN] Users table exists but is empty.");
    }
    
    const resTokens = await client.query("SELECT * FROM refresh_tokens LIMIT 1;");
    console.log("[OK] Found refresh_tokens table.");

  } catch (err) {
    console.error("[ERROR] Database Error:", err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    await client.end();
  }
}

testLogin().catch(console.error);

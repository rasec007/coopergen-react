import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Client } = pg;

async function listDatabases() {
  const baseConnectionString = "postgres://coopergen_react:R%40sec007k9.%2C.%2C@easypanel2.c2net.com.br:5434/postgres";
  const client = new Client({ connectionString: baseConnectionString });

  try {
    await client.connect();
    const res = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
    console.log("[DIAGNOSTIC] Bancos de dados encontrados:");
    res.rows.forEach(row => console.log(`- ${row.datname}`));
  } catch (err) {
    console.error("[DIAGNOSTIC] Erro:", err.message);
  } finally {
    await client.end();
  }
}

listDatabases().catch(console.error);

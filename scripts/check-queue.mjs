import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregando .env.local explicitamente
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Client } = pg;

async function checkQueue() {
  const NODE_ENV = process.env.NODE_ENV;
  const dbUrl = process.env.DATABASE_URL;
  const dbUrlDev = process.env.DATABASE_URL_DEVE;
  const dbUrlProd = process.env.DATABASE_URL_PROD;

  console.log(`[DEBUG] NODE_ENV: ${NODE_ENV}`);
  console.log(`[DEBUG] DATABASE_URL: ${dbUrl?.split('@')[1]}`);
  console.log(`[DEBUG] DATABASE_URL_DEVE: ${dbUrlDev?.split('@')[1]}`);
  console.log(`[DEBUG] DATABASE_URL_PROD: ${dbUrlProd?.split('@')[1]}`);

  // Forçar o uso de DATABASE_URL se existir
  const connectionString = dbUrl || (NODE_ENV === 'production' ? dbUrlProd : dbUrlDev);
  
  if (!connectionString) {
      console.error("[DEBUG] Erro: Nenhuma URL de banco encontrada!");
      return;
  }

  console.log(`[DEBUG] Conectando a: ${connectionString.split('/').pop()}`);
  const client = new Client({ connectionString });

  try {
    await client.connect();
    const res = await client.query("SELECT status, count(*) FROM notification_queue GROUP BY status;");
    console.log("[QUEUE] Status das notificações:");
    res.rows.forEach(row => console.log(`- ${row.status}: ${row.count}`));
    
    const lastFailed = await client.query("SELECT error FROM notification_queue WHERE status = 'failed' ORDER BY created_at DESC LIMIT 5;");
    if (lastFailed.rows.length > 0) {
      console.log("[QUEUE] Últimos erros encontrados:");
      lastFailed.rows.forEach(row => console.log(`- ${row.error}`));
    }
    
    const pending = await client.query("SELECT id, type, recipient FROM notification_queue WHERE status = 'pending' LIMIT 3;");
    if (pending.rows.length > 0) {
        console.log("[QUEUE] Exemplos de notificações pendentes:");
        pending.rows.forEach(p => console.log(`- ID: ${p.id}, Tipo: ${p.type}, Destinatário: ${p.recipient}`));
    }
  } catch (err) {
    console.error("[QUEUE] Erro:", err.message);
  } finally {
    await client.end();
  }
}

checkQueue().catch(console.error);

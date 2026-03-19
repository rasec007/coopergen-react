import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregando .env.local com override para garantir que use o banco correto
dotenv.config({ path: resolve(__dirname, '../.env.local'), override: true });

const { Client } = pg;

async function checkQueue() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
      console.error("❌ Erro: DATABASE_URL não encontrada no .env.local");
      return;
  }

  console.log(`🔍 Verificando banco: ${connectionString.split('/').pop()?.split('?')[0]}`);
  const client = new Client({ connectionString });

  try {
    await client.connect();
    
    // 1. Resumo da Fila
    const res = await client.query("SELECT status, count(*) FROM notification_queue GROUP BY status;");
    console.log("\n📊 RESUMO DA FILA:");
    if (res.rows.length === 0) {
        console.log("  (Fila vazia)");
    } else {
        res.rows.forEach(row => {
            const icon = row.status === 'sent' ? '✅' : (row.status === 'failed' ? '❌' : '⏳');
            console.log(`  ${icon} ${row.status.toUpperCase()}: ${row.count}`);
        });
    }
    
    // 2. Últimas Falhas
    const lastFailed = await client.query("SELECT error, type, recipient, created_at FROM notification_queue WHERE status = 'failed' ORDER BY created_at DESC LIMIT 3;");
    if (lastFailed.rows.length > 0) {
      console.log("\n⚠️ ÚLTIMOS ERROS:");
      lastFailed.rows.forEach(row => {
          console.log(`  - [${row.type}] ${row.recipient}: ${row.error?.substring(0, 100)}...`);
      });
    }
    
    // 3. Pendentes
    const pending = await client.query("SELECT id, type, recipient FROM notification_queue WHERE status = 'pending' LIMIT 3;");
    if (pending.rows.length > 0) {
        console.log("\n⏳ NOTIFICAÇÕES AGUARDANDO:");
        pending.rows.forEach(p => console.log(`  - [${p.type}] para ${p.recipient}`));
    } else {
        console.log("\n✅ Nenhuma notificação pendente no momento.");
    }

  } catch (err) {
    console.error("❌ Erro ao conectar:", err.message);
  } finally {
    await client.end();
  }
}

checkQueue().catch(console.error);

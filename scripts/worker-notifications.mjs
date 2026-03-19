import pg from 'pg';
const { Pool } = pg;
import nodemailer from 'nodemailer';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ override: true }); // Tenta carregar do .env se existir
dotenv.config({ path: join(__dirname, '../.env.local'), override: true }); // Tenta carregar do .env.local se existir

const NODE_ENV = process.env.NODE_ENV || 'deve';
const dbUrl = process.env.DATABASE_URL || ((NODE_ENV === 'prod' || NODE_ENV === 'production') ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL_DEVE);

if (!dbUrl) {
  console.error(`ERRO: DATABASE_URL para o ambiente ${NODE_ENV} não definida no .env.local`);
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
});

// Configuração de E-mail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para outros
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Configuração WhatsApp (Evolution API)
const waApiUrl = process.env.EVOLUTION_API_URL;
const waApiKey = process.env.EVOLUTION_API_KEY;

async function sendEmail(job) {
  const { recipient, payload } = job;
  console.log(`[EMAIL] Enviando para ${recipient}...`);
  
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'Coopergen'}" <${process.env.SMTP_USER}>`,
    to: recipient,
    subject: payload.subject,
    text: payload.body,
    html: `<p>${payload.body.replace(/\n/g, '<br>')}</p>`,
  });
}

async function sendWhatsApp(job) {
  const { recipient, payload } = job;
  console.log(`[WHATSAPP] Enviando para ${recipient}...`);

  // Limpar número (apenas dígitos)
  const cleanNumber = recipient.replace(/\D/g, '');
  
  // No Brasil, a Evolution costuma esperar o número com DDI (55)
  const finalNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;

  await axios.post(waApiUrl, {
    number: finalNumber,
    text: payload.body,
  }, {
    headers: {
      'apikey': waApiKey,
      'Content-Type': 'application/json'
    }
  });
}

async function processBatch() {
  const client = await pool.connect();
  try {
    // Buscar até 10 jobs pendentes com trava de linha para evitar duplicidade entre workers
    const { rows: jobs } = await client.query(`
      SELECT * FROM notification_queue 
      WHERE status = 'pending' 
      ORDER BY created_at ASC 
      LIMIT 10
      FOR UPDATE SKIP LOCKED
    `);

    if (jobs.length === 0) return;

    for (const job of jobs) {
      try {
        // Marcar como processando para evitar duplicidade (embora aqui seja serial)
        await client.query('UPDATE notification_queue SET status = $1, attempts = attempts + 1 WHERE id = $2', ['processing', job.id]);

        if (job.type === 'email') {
          await sendEmail(job);
        } else if (job.type === 'whatsapp') {
          await sendWhatsApp(job);
          // Requisito: 5 segundos entre envios de WhatsApp
          console.log('[WHATSAPP] Aguardando 5 segundos para o próximo...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Sucesso
        await client.query('UPDATE notification_queue SET status = $1, processed_at = NOW() WHERE id = $2', ['sent', job.id]);
        console.log(`[JOB SUCCESS] ID: ${job.id} (${job.type}) enviado.`);

      } catch (err) {
        console.error(`[JOB ERROR] ID: ${job.id} (${job.type}):`, err.message);
        await client.query('UPDATE notification_queue SET status = $1, error = $2 WHERE id = $3', ['failed', err.message, job.id]);
      }
    }
  } finally {
    client.release();
  }
}

async function start() {
  console.log(`--- Worker Iniciado (${NODE_ENV}) ---`);
  console.log(`Conectando ao banco: ${dbUrl.split('@')[1]}`); // Log seguro da URL
  
  // Resetar jobs que ficaram presos em 'processing' (ex: queda do servidor)
  const { rowCount } = await pool.query("UPDATE notification_queue SET status = 'pending' WHERE status = 'processing'");
  if (rowCount > 0) console.log(`[Worker] ${rowCount} jobs recuperados de 'processing' para 'pending'.`);
  while (true) {
    await processBatch();
    // Aguardar 10 segundos antes de checar a fila novamente se estiver vazio
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}

start().catch(console.error);

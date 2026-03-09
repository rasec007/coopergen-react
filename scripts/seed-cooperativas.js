const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function seed() {
  console.log('🌱 Seeding cooperativas (JS Script)...');
  console.log('Using database:', process.env.DATABASE_URL?.split('@')[1] || 'Not set');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    connectionTimeoutMillis: 5000,
  });

  const csvPath = path.join(process.cwd(), 'tabelas', 'Cooperativas.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const csvData = fs.readFileSync(csvPath, 'utf8');
  const lines = csvData.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length < 2) {
    console.log('⚠️ CSV is empty or only contains headers.');
    process.exit(0);
  }

  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const rows = lines.slice(1);

  const client = await pool.connect();

  try {
    for (const row of rows) {
      const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/"/g, '').trim()) || [];
      if (values.length === 0) continue;

      const data = {};
      headers.forEach((header, index) => {
        data[header] = values[index];
      });

      console.log(`Inserting: ${data.Nome}`);

      const query = `
        INSERT INTO cooperativas (name, nickname, phone, email, responsible, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          nickname = EXCLUDED.nickname,
          phone = EXCLUDED.phone,
          responsible = EXCLUDED.responsible,
          status = EXCLUDED.status,
          updated_at = NOW()
      `;

      const createdAt = data['Creation Date'] ? new Date(data['Creation Date']) : new Date();

      await client.query(query, [
        data.Nome || 'N/A',
        data.Apelido,
        data.Celular,
        data.Email,
        data.Responsavel,
        data.Status || 'Ativo',
        createdAt
      ]);
    }
    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

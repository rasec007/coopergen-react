// @ts-nocheck
const path = require('path');
const fs = require('fs');

// 1. Load env before anything else
const dotenv = require('dotenv');
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// 2. Import DB after env is loaded
const { db } = require('../lib/db');
const { cooperativas } = require('../lib/db/schema/cooperativas');
const { postosTrabalho } = require('../lib/db/schema/postos_trabalho');
const { cooperados } = require('../lib/db/schema/cooperados');

// Helper to parse CSV properly handling quotes
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const rows = lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index]?.replace(/^"|"$/g, '') || '';
    });
    return obj;
  });
  return rows;
}

async function seed() {
  console.log('🌱 Starting seed for postos_trabalho and cooperados...');
  console.log('Using database:', process.env.DATABASE_URL?.split('@')[1] || 'Not set');

  if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env.local');
      process.exit(1);
  }

  // 1. Map Cooperativas
  const allCoops = await db.select().from(cooperativas);
  const coopMap = new Map(allCoops.map(c => [c.name.toLowerCase(), c.id]));
  allCoops.forEach(c => {
      if (c.nickname) coopMap.set(c.nickname.toLowerCase(), c.id);
  });

  console.log(`Found ${allCoops.length} cooperativas in DB.`);

  // 2. Seed postos_trabalho
  const ptPath = path.join(process.cwd(), 'tabelas', 'PostoTrabalhos.csv');
  if (fs.existsSync(ptPath)) {
    const ptData = parseCSV(fs.readFileSync(ptPath, 'utf8'));
    console.log(`Seeding ${ptData.length} postos de trabalho...`);
    
    for (const row of ptData) {
      if (!row.Cooperativa || !row.Nome) continue;
      const coopId = coopMap.get(row.Cooperativa.toLowerCase());
      if (coopId) {
        try {
          await db.insert(postosTrabalho).values({
            name: row.Nome,
            cooperativaId: coopId,
          }).onConflictDoNothing();
        } catch (e) {
          console.error(`Error inserting PT ${row.Nome}:`, e);
        }
      }
    }
  }

  // 3. Seed cooperados
  const usersPath = path.join(process.cwd(), 'tabelas', 'Users.csv');
  if (fs.existsSync(usersPath)) {
    const usersData = parseCSV(fs.readFileSync(usersPath, 'utf8'));
    console.log(`Seeding ${usersData.length} cooperados...`);
    
    let count = 0;
    for (const row of usersData) {
      if (!row.Nome) continue;
      const coopId = coopMap.get(row.Cooperativa.toLowerCase());
      
      try {
        await db.insert(cooperados).values({
          name: row.Nome,
          email: row.email || null,
          phone: row.Celular || null,
          cpf: row.CPF || null,
          apelido: row.Apelido || null,
          matricula: row.Matricula || null,
          cooperativaId: coopId || null,
          perfil: row.Perfil || 'Cooperado',
          status: 'Ativo',
        }).onConflictDoNothing();
        count++;
        if (count % 100 === 0) console.log(`Processed ${count} cooperados...`);
      } catch (e) {
        console.error(`Error inserting Cooperado ${row.Nome}:`, e);
      }
    }
  }

  console.log('✅ Seed finished successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

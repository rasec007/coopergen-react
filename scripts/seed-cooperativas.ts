import 'dotenv/config'; // Must be FIRST
import { db } from '../lib/db';
import { cooperativas } from '../lib/db/schema/cooperativas';
import fs from 'fs';
import path from 'path';

async function seed() {
  console.log('🌱 Seeding cooperativas...');
  
  // Ensure DATABASE_URL is correct if loaded from .env.local manually
  // Actually 'import dotenv/config' looks at .env by default. 
  // Next.js uses .env.local, so we might need a specific path.
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

  console.log('Using database:', process.env.DATABASE_URL?.split('@')[1] || 'Not set');

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
  
  for (const row of rows) {
    const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/"/g, '').trim()) || [];
    
    if (values.length === 0) continue;

    const data: any = {};
    headers.forEach((header, index) => {
      data[header] = values[index];
    });
    
    console.log(`Inserting: ${data.Nome}`);
    
    try {
      await db.insert(cooperativas).values({
        name: data.Nome || 'N/A',
        nickname: data.Apelido,
        phone: data.Celular,
        email: data.Email,
        responsible: data.Responsavel,
        status: data.Status || 'Ativo',
        createdAt: data['Creation Date'] ? new Date(data['Creation Date']) : new Date(),
      }).onConflictDoUpdate({
        target: cooperativas.email,
        set: {
            name: data.Nome || 'N/A',
            nickname: data.Apelido,
            phone: data.Celular,
            responsible: data.Responsavel,
            status: data.Status || 'Ativo',
            updatedAt: new Date(),
        }
      });
    } catch (err) {
      console.error(`Error inserting ${data.Nome}:`, err);
    }
  }
  
  console.log('✅ Seeding completed!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

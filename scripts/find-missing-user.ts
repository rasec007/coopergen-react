import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { db } from '../lib/db/index';
import { users, cooperados } from '../lib/db/schema/index';
import { isNull, or, eq } from 'drizzle-orm';

async function find() {
  console.log('🔍 Buscando cooperados com problemas de sincronização...');
  
  try {
    // 1. Cooperados sem e-mail
    const noEmail = await db.select().from(cooperados).where(or(isNull(cooperados.email), eq(cooperados.email, '')));
    console.log(`\n❌ Cooperados sem e-mail (${noEmail.length}):`);
    noEmail.forEach(c => console.log(`- ${c.name} (Matrícula: ${c.matricula})`));

    // 2. Cooperados com e-mail mas sem userId vinculado
    const notLinked = await db.select().from(cooperados).where(isNull(cooperados.userId));
    const actuallyNotLinked = notLinked.filter(c => c.email && c.email.trim() !== '');
    
    console.log(`\n⚠️ Cooperados com e-mail mas sem vínculo (${actuallyNotLinked.length}):`);
    actuallyNotLinked.forEach(c => console.log(`- ${c.name} (${c.email})`));

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro na busca:', error.message || error);
    process.exit(1);
  }
}

find();

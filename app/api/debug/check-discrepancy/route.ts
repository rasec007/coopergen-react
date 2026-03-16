
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cooperados, users } from '@/lib/db/schema';
import { count } from 'drizzle-orm';

export async function GET() {
  try {
    const allCoops = await db.select().from(cooperados);
    const allUsers = await db.select().from(users);
    
    const coopsWithoutEmail = allCoops.filter(c => !c.email || c.email.trim() === '');
    
    // Encontrar os nomes dos que não têm e-mail
    const missingEmailList = coopsWithoutEmail.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      cpf: c.cpf
    }));

    return NextResponse.json({
      totalCooperados: allCoops.length,
      totalUsers: allUsers.length,
      missingEmailCount: missingEmailList.length,
      missingEmailList
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

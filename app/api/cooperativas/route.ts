import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cooperativas } from '@/lib/db/schema/cooperativas';
import { eq, desc, ilike, or, asc } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';
import { z } from 'zod';

const cooperativaSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  nickname: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  responsible: z.string().optional(),
  status: z.string().default('Ativo'),
});

export async function GET(req: NextRequest) {
  try {
    const token = await getAccessTokenFromCookies();
    if (!token || !(await verifyAccessToken(token))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    let query = db.select().from(cooperativas).where(eq(cooperativas.isActive, true));

    if (search) {
      query = db.select().from(cooperativas).where(
        or(
          ilike(cooperativas.name, `%${search}%`),
          ilike(cooperativas.nickname, `%${search}%`),
          ilike(cooperativas.email, `%${search}%`)
        )
      ) as any;
    }

    const results = await query.orderBy(asc(cooperativas.name));

    return NextResponse.json(results);
  } catch (error) {
    console.error('[COOPERATIVAS_GET]', error);
    return NextResponse.json({ error: 'Erro ao buscar cooperativas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getAccessTokenFromCookies();
    if (!token || !(await verifyAccessToken(token))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const result = cooperativaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const [newCooperativa] = await db.insert(cooperativas).values({
      ...result.data,
      email: result.data.email || null,
    }).returning();

    return NextResponse.json(newCooperativa);
  } catch (error) {
    console.error('[COOPERATIVAS_POST]', error);
    return NextResponse.json({ error: 'Erro ao criar cooperativa' }, { status: 500 });
  }
}

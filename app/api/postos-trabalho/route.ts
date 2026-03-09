import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { postosTrabalho } from '@/lib/db/schema/postos_trabalho';
import { eq, and, ilike } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = await getAccessTokenFromCookies();
    let userRole = null;
    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload) userRole = payload.role;
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    let cooperativaId = searchParams.get('cooperativaId');
    
    const cookieStore = await cookies();
    const activeCooperativaId = cookieStore.get('active_cooperativa_id')?.value;

    if (activeCooperativaId) {
      cooperativaId = activeCooperativaId;
    }

    let conditions = [];
    if (search) {
      conditions.push(ilike(postosTrabalho.name, `%${search}%`));
    }
    if (cooperativaId && cooperativaId !== 'all') {
      conditions.push(eq(postosTrabalho.cooperativaId, cooperativaId));
    }

    // @ts-ignore
    const data = await db.query.postosTrabalho.findMany({
      // @ts-ignore
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        cooperativa: true,
      },
      orderBy: (pt, { asc }) => [asc(pt.name)],
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching postos de trabalho:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.name || !body.cooperativaId) {
        return NextResponse.json({ error: 'Nome e Cooperativa são obrigatórios' }, { status: 400 });
    }

    const [newPT] = await db.insert(postosTrabalho).values({
      name: body.name,
      cooperativaId: body.cooperativaId,
    }).returning();

    return NextResponse.json(newPT);
  } catch (error: any) {
    console.error('Error creating posto de trabalho:', error);
    if (error.code === '23505') {
       return NextResponse.json({ error: 'Já existe um posto com este nome nesta cooperativa' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar posto de trabalho' }, { status: 500 });
  }
}

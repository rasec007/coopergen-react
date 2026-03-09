import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cooperados } from '@/lib/db/schema/cooperados';
import { eq, desc, and, ilike, or, asc, SQL } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { users } from '@/lib/db/schema/users';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const token = await getAccessTokenFromCookies();
    let userRole = null;
    let userCooperativaId = null;

    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload) {
        userRole = payload.role;
      }
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    let cooperativaId = searchParams.get('cooperativaId');
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    
    const cookieStore = await cookies();
    const activeCooperativaId = cookieStore.get('active_cooperativa_id')?.value;

    if (activeCooperativaId) {
      cooperativaId = activeCooperativaId;
    }
    
    let conditions: SQL[] = [eq(cooperados.isActive, true)];
    if (search) {
      const searchCondition = or(
        ilike(cooperados.name, `%${search}%`),
        ilike(cooperados.email, `%${search}%`),
        ilike(cooperados.cpf, `%${search}%`),
        ilike(cooperados.matricula, `%${search}%`)
      );
      if (searchCondition) conditions.push(searchCondition);
    }
    if (cooperativaId && cooperativaId !== 'all') {
      conditions.push(eq(cooperados.cooperativaId, cooperativaId));
    }
    if (status && status !== 'all') {
      conditions.push(eq(cooperados.status, status));
    }

    const data = await db.query.cooperados.findMany({
      // @ts-ignore
      where: conditions.length > 0 ? and(...(conditions as any)) : undefined,
      with: {
        cooperativa: true,
        postoTrabalho: true,
      },
      orderBy: [asc(cooperados.name)],
      limit: limitParam && limitParam !== 'all' ? parseInt(limitParam) : undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching cooperados:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    let finalUserId = body.userId || null;

    if (body.password) {
      const passwordHash = await hash(body.password, 10);
      const [newUser] = await db.insert(users).values({
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.perfil === 'ADM' ? 'admin' : 'user',
        registrationNumber: body.matricula || null,
        cpf: body.cpf || null,
        phone: body.phone || null,
      }).returning();
      finalUserId = newUser.id;
    }

    const [newCooperado] = await db.insert(cooperados).values({
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      cpf: body.cpf || null,
      apelido: body.apelido || null,
      matricula: body.matricula || null,
      cooperativaId: body.cooperativaId || null,
      postoTrabalhoId: body.postoTrabalhoId || null,
      userId: finalUserId,
      perfil: body.perfil || 'Cooperado',
      status: body.status || 'Ativo',
    }).returning();

    return NextResponse.json(newCooperado);
  } catch (error: any) {
    console.error('Error creating cooperado:', error);
    if (error.code === '23505' || error?.message?.includes('duplicate key value') || error?.cause?.code === '23505') {
       return NextResponse.json({ error: 'CPF, Matrícula ou E-mail já cadastrado' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar cooperado' }, { status: 500 });
  }
}

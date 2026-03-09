import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paystubs } from '@/lib/db/schema/paystubs';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { cooperados } from '@/lib/db/schema/cooperados';
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
    const type = searchParams.get('type');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    let cooperativaId = searchParams.get('cooperativaId');
    const postoTrabalhoId = searchParams.get('postoTrabalhoId');
    
    const cookieStore = await cookies();
    const activeCooperativaId = cookieStore.get('active_cooperativa_id')?.value;

    if (activeCooperativaId) {
      cooperativaId = activeCooperativaId;
    }

    let conditions = [];

    if (type && type !== 'all') {
      conditions.push(eq(paystubs.type, type));
    }
    if (year && year !== 'all') {
      conditions.push(eq(paystubs.year, parseInt(year)));
    }
    if (month && month !== 'all') {
      conditions.push(eq(paystubs.month, parseInt(month)));
    }
    if (postoTrabalhoId && postoTrabalhoId !== 'all') {
      conditions.push(eq(paystubs.postoTrabalhoId, postoTrabalhoId));
    }

    // Join with cooperados for search and filtering by cooperativa
    // @ts-ignore
    const data = await db.query.paystubs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        cooperado: {
          with: {
            cooperativa: true,
          }
        },
        postoTrabalho: true,
      },
      orderBy: (ps, { desc, asc }) => [desc(ps.year), desc(ps.month), asc(ps.id)],
    });

    // Post-filter by cooperativaId and search (since Drizzle relational query doesn't support nested filters easily in this version)
    let filtered = data;
    if (cooperativaId && cooperativaId !== 'all') {
      filtered = filtered.filter((ps: any) => ps.cooperado?.cooperativaId === cooperativaId && ps.cooperado?.isActive);
    } else {
      filtered = filtered.filter((ps: any) => ps.cooperado?.isActive);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((ps: any) => 
        ps.cooperado?.name.toLowerCase().includes(s) || 
        ps.cooperado?.cpf?.includes(s) ||
        ps.cooperado?.matricula?.includes(s)
      );
    }

    // Sort the final results: Year (ASC), Month (ASC), Name (ASC)
    filtered.sort((a: any, b: any) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      const nameA = a.cooperado?.name?.toLowerCase() || '';
      const nameB = b.cooperado?.name?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching paystubs:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.cooperadoId || !body.month || !body.year) {
      return NextResponse.json({ error: 'Cooperado, Mês e Ano são obrigatórios' }, { status: 400 });
    }

    const [newPaystub] = await db.insert(paystubs).values({
      cooperadoId: body.cooperadoId,
      postoTrabalhoId: body.postoTrabalhoId,
      type: body.type || 'Contra Cheque',
      month: parseInt(body.month),
      year: parseInt(body.year),
      valorBruto: body.valorBruto,
      valorLiquido: body.valorLiquido,
      fileUrl: body.fileUrl,
    }).returning();

    return NextResponse.json(newPaystub);
  } catch (error: any) {
    console.error('Error creating paystub:', error);
    return NextResponse.json({ error: 'Erro ao criar contra cheque' }, { status: 500 });
  }
}
